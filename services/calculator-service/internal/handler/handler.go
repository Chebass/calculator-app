// Package handler exposes the calculator domain over a JSON REST API.
package handler

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"sezzlemath/calculator-service/internal/calculator"
)

const maxBodyBytes = 1 << 10 // 1 KiB is plenty for two numbers and an operation name

// CalculateRequest is the body of POST /api/v1/calculate.
// Operands are pointers so that "missing" can be told apart from 0.
type CalculateRequest struct {
	Operation calculator.Operation `json:"operation"`
	A         *float64             `json:"a"`
	B         *float64             `json:"b"`
}

// CalculateResponse is the success body of POST /api/v1/calculate.
type CalculateResponse struct {
	Operation calculator.Operation `json:"operation"`
	Result    float64              `json:"result"`
}

// ErrorBody is the uniform error envelope used by every endpoint.
type ErrorBody struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail carries a stable machine-readable code and a human message.
type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// New returns the service router with all routes registered.
func New(logger *slog.Logger) http.Handler {
	h := &handler{logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.health)
	mux.HandleFunc("GET /api/v1/operations", h.operations)
	mux.HandleFunc("POST /api/v1/calculate", h.calculate)
	return mux
}

type handler struct {
	logger *slog.Logger
}

func (h *handler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *handler) operations(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"operations": calculator.Specs()})
}

func (h *handler) calculate(w http.ResponseWriter, r *http.Request) {
	var req CalculateRequest
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "request body must be valid JSON with operation, a and optionally b")
		return
	}
	if extraData(dec) {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "request body must contain a single JSON object")
		return
	}
	if req.A == nil {
		writeError(w, http.StatusBadRequest, "MISSING_OPERAND", "operand a is required")
		return
	}

	result, err := calculator.Calculate(req.Operation, *req.A, req.B)
	if err != nil {
		status, code := classify(err)
		writeError(w, status, code, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, CalculateResponse{Operation: req.Operation, Result: result})
}

// extraData reports whether anything other than whitespace follows the decoded value.
func extraData(dec *json.Decoder) bool {
	var rest json.RawMessage
	return dec.Decode(&rest) != io.EOF
}

// classify maps domain errors to an HTTP status and a stable error code.
// Malformed requests are 400; well-formed requests that cannot be computed are 422.
func classify(err error) (int, string) {
	switch {
	case errors.Is(err, calculator.ErrUnknownOperation):
		return http.StatusBadRequest, "UNKNOWN_OPERATION"
	case errors.Is(err, calculator.ErrMissingOperand):
		return http.StatusBadRequest, "MISSING_OPERAND"
	case errors.Is(err, calculator.ErrUnexpectedOperand):
		return http.StatusBadRequest, "UNEXPECTED_OPERAND"
	case errors.Is(err, calculator.ErrDivisionByZero):
		return http.StatusUnprocessableEntity, "DIVISION_BY_ZERO"
	case errors.Is(err, calculator.ErrNegativeSqrt):
		return http.StatusUnprocessableEntity, "NEGATIVE_SQRT"
	case errors.Is(err, calculator.ErrUndefinedResult):
		return http.StatusUnprocessableEntity, "UNDEFINED_RESULT"
	default:
		return http.StatusInternalServerError, "INTERNAL_ERROR"
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, ErrorBody{Error: ErrorDetail{Code: code, Message: message}})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
