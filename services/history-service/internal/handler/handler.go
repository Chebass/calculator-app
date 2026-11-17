// Package handler exposes the history use cases as a JSON REST API.
package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"sezzlemath/history-service/internal/calcclient"
	"sezzlemath/history-service/internal/history"
)

const (
	maxBodyBytes = 1 << 10
	defaultLimit = 100
	maxLimit     = 500
)

// EntryRequest is the body of POST and PUT. The result is never accepted from clients.
type EntryRequest struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b"`
}

// ErrorBody is the uniform error envelope shared by all services.
type ErrorBody struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail carries a stable machine-readable code and a human message.
type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Service is the use-case surface the handler depends on (satisfied by *history.Service).
type Service interface {
	Create(ctx context.Context, in history.Input) (history.Entry, error)
	Update(ctx context.Context, id int64, in history.Input) (history.Entry, error)
	Get(ctx context.Context, id int64) (history.Entry, error)
	List(ctx context.Context, limit int) ([]history.Entry, error)
	Delete(ctx context.Context, id int64) error
	Clear(ctx context.Context) error
	Ready(ctx context.Context) error
}

// New returns the service router with all routes registered.
func New(svc Service, logger *slog.Logger) http.Handler {
	h := &handler{svc: svc, logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.health)
	mux.HandleFunc("GET /readyz", h.ready)
	mux.HandleFunc("GET /api/v1/history", h.list)
	mux.HandleFunc("POST /api/v1/history", h.create)
	mux.HandleFunc("DELETE /api/v1/history", h.clear)
	mux.HandleFunc("GET /api/v1/history/{id}", h.get)
	mux.HandleFunc("PUT /api/v1/history/{id}", h.update)
	mux.HandleFunc("DELETE /api/v1/history/{id}", h.delete)
	return mux
}

type handler struct {
	svc    Service
	logger *slog.Logger
}

func (h *handler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *handler) ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := h.svc.Ready(ctx); err != nil {
		h.logger.Error("readiness check failed", "error", err)
		writeError(w, http.StatusServiceUnavailable, "NOT_READY", "storage is not available")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func (h *handler) list(w http.ResponseWriter, r *http.Request) {
	limit := defaultLimit
	if raw := r.URL.Query().Get("limit"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 || n > maxLimit {
			writeError(w, http.StatusBadRequest, "INVALID_LIMIT", "limit must be an integer between 1 and "+strconv.Itoa(maxLimit))
			return
		}
		limit = n
	}
	entries, err := h.svc.List(r.Context(), limit)
	if err != nil {
		h.fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"entries": entries})
}

func (h *handler) get(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	entry, err := h.svc.Get(r.Context(), id)
	if err != nil {
		h.fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, entry)
}

func (h *handler) create(w http.ResponseWriter, r *http.Request) {
	in, ok := decodeInput(w, r)
	if !ok {
		return
	}
	entry, err := h.svc.Create(r.Context(), in)
	if err != nil {
		h.fail(w, err)
		return
	}
	w.Header().Set("Location", "/api/v1/history/"+strconv.FormatInt(entry.ID, 10))
	writeJSON(w, http.StatusCreated, entry)
}

func (h *handler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	in, ok := decodeInput(w, r)
	if !ok {
		return
	}
	entry, err := h.svc.Update(r.Context(), id, in)
	if err != nil {
		h.fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, entry)
}

func (h *handler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		h.fail(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *handler) clear(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.Clear(r.Context()); err != nil {
		h.fail(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// fail maps service errors to HTTP responses.
func (h *handler) fail(w http.ResponseWriter, err error) {
	var calcErr *calcclient.Error
	switch {
	case errors.Is(err, history.ErrNotFound):
		writeError(w, http.StatusNotFound, "NOT_FOUND", "history entry not found")
	case errors.As(err, &calcErr):
		// The calculator-service rejected the calculation; relay its verdict as-is.
		writeError(w, calcErr.Status, calcErr.Code, calcErr.Message)
	case errors.Is(err, calcclient.ErrUnavailable):
		h.logger.Error("calculator-service unavailable", "error", err)
		writeError(w, http.StatusBadGateway, "CALCULATOR_UNAVAILABLE", "the calculator service is unavailable")
	default:
		h.logger.Error("unexpected error", "error", err)
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "unexpected server error")
	}
}

func parseID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "id must be a positive integer")
		return 0, false
	}
	return id, true
}

func decodeInput(w http.ResponseWriter, r *http.Request) (history.Input, bool) {
	var req EntryRequest
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "body must be JSON with operation, a and optionally b")
		return history.Input{}, false
	}
	var rest json.RawMessage
	if dec.Decode(&rest) != io.EOF {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "body must contain a single JSON object")
		return history.Input{}, false
	}
	if req.Operation == "" {
		writeError(w, http.StatusBadRequest, "MISSING_OPERATION", "operation is required")
		return history.Input{}, false
	}
	if req.A == nil {
		writeError(w, http.StatusBadRequest, "MISSING_OPERAND", "operand a is required")
		return history.Input{}, false
	}
	return history.Input{Operation: req.Operation, A: *req.A, B: req.B}, true
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, ErrorBody{Error: ErrorDetail{Code: code, Message: message}})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
