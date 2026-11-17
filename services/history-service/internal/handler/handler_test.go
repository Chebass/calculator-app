package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"sezzlemath/history-service/internal/calcclient"
	"sezzlemath/history-service/internal/history"
	"sezzlemath/history-service/internal/store"
)

// fakeCalc is a tiny calculator that supports add/divide and can simulate outages.
type fakeCalc struct{ down bool }

func (f fakeCalc) Calculate(_ context.Context, op string, a float64, b *float64) (float64, error) {
	if f.down {
		return 0, fmt.Errorf("%w: connection refused", calcclient.ErrUnavailable)
	}
	switch op {
	case "add":
		return a + *b, nil
	case "divide":
		if *b == 0 {
			return 0, &calcclient.Error{Status: 422, Code: "DIVISION_BY_ZERO", Message: "division by zero"}
		}
		return a / *b, nil
	}
	return 0, &calcclient.Error{Status: 400, Code: "UNKNOWN_OPERATION", Message: "unknown operation"}
}

func newServer(calc history.Calculator) http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	svc := history.NewService(store.NewMemory(), calc, nil)
	return Chain(New(svc, logger), logger, []string{"*"})
}

func do(h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func decode[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var v T
	if err := json.Unmarshal(rec.Body.Bytes(), &v); err != nil {
		t.Fatalf("decode %q: %v", rec.Body.String(), err)
	}
	return v
}

func errorCode(t *testing.T, rec *httptest.ResponseRecorder) string {
	t.Helper()
	return decode[ErrorBody](t, rec).Error.Code
}

func TestCRUDFlow(t *testing.T) {
	h := newServer(fakeCalc{})

	rec := do(h, http.MethodPost, "/api/v1/history", `{"operation":"add","a":2,"b":3}`)
	if rec.Code != http.StatusCreated || rec.Header().Get("Location") != "/api/v1/history/1" {
		t.Fatalf("create: %d %v %s", rec.Code, rec.Header(), rec.Body)
	}
	created := decode[history.Entry](t, rec)
	if created.Result != 5 || created.ID != 1 {
		t.Errorf("created: %+v", created)
	}

	do(h, http.MethodPost, "/api/v1/history", `{"operation":"add","a":10,"b":10}`)

	list := decode[struct{ Entries []history.Entry }](t, do(h, http.MethodGet, "/api/v1/history", ""))
	if len(list.Entries) != 2 || list.Entries[0].ID != 2 {
		t.Errorf("list newest first: %+v", list.Entries)
	}
	limited := decode[struct{ Entries []history.Entry }](t, do(h, http.MethodGet, "/api/v1/history?limit=1", ""))
	if len(limited.Entries) != 1 {
		t.Errorf("limit: %+v", limited.Entries)
	}

	rec = do(h, http.MethodGet, "/api/v1/history/1", "")
	if rec.Code != 200 || decode[history.Entry](t, rec).Result != 5 {
		t.Errorf("get: %d %s", rec.Code, rec.Body)
	}

	rec = do(h, http.MethodPut, "/api/v1/history/1", `{"operation":"add","a":7,"b":8}`)
	if rec.Code != 200 || decode[history.Entry](t, rec).Result != 15 {
		t.Errorf("update: %d %s", rec.Code, rec.Body)
	}

	if rec = do(h, http.MethodDelete, "/api/v1/history/1", ""); rec.Code != http.StatusNoContent {
		t.Errorf("delete: %d", rec.Code)
	}
	if rec = do(h, http.MethodGet, "/api/v1/history/1", ""); rec.Code != http.StatusNotFound || errorCode(t, rec) != "NOT_FOUND" {
		t.Errorf("get deleted: %d %s", rec.Code, rec.Body)
	}

	if rec = do(h, http.MethodDelete, "/api/v1/history", ""); rec.Code != http.StatusNoContent {
		t.Errorf("clear: %d", rec.Code)
	}
	empty := decode[struct{ Entries []history.Entry }](t, do(h, http.MethodGet, "/api/v1/history", ""))
	if len(empty.Entries) != 0 {
		t.Errorf("clear left entries: %+v", empty.Entries)
	}
}

func TestEmptyListIsAnArrayNotNull(t *testing.T) {
	// Entries must serialise as [] so clients never have to special-case null.
	body := do(newServer(fakeCalc{}), http.MethodGet, "/api/v1/history", "").Body.String()
	if !strings.Contains(body, `"entries":[]`) {
		t.Errorf("body = %s", body)
	}
}

func TestValidationErrors(t *testing.T) {
	h := newServer(fakeCalc{})
	tests := []struct {
		name, method, path, body string
		status                   int
		code                     string
	}{
		{"malformed json", "POST", "/api/v1/history", `{`, 400, "INVALID_JSON"},
		{"unknown field", "POST", "/api/v1/history", `{"operation":"add","a":1,"b":1,"result":99}`, 400, "INVALID_JSON"},
		{"trailing data", "POST", "/api/v1/history", `{"operation":"add","a":1,"b":1} x`, 400, "INVALID_JSON"},
		{"missing operation", "POST", "/api/v1/history", `{"a":1}`, 400, "MISSING_OPERATION"},
		{"missing operand", "POST", "/api/v1/history", `{"operation":"add"}`, 400, "MISSING_OPERAND"},
		{"calculator rejects: division", "POST", "/api/v1/history", `{"operation":"divide","a":1,"b":0}`, 422, "DIVISION_BY_ZERO"},
		{"calculator rejects: unknown op", "POST", "/api/v1/history", `{"operation":"mod","a":1,"b":1}`, 400, "UNKNOWN_OPERATION"},
		{"bad id", "GET", "/api/v1/history/abc", ``, 400, "INVALID_ID"},
		{"zero id", "DELETE", "/api/v1/history/0", ``, 400, "INVALID_ID"},
		{"bad id on update", "PUT", "/api/v1/history/x", `{"operation":"add","a":1,"b":1}`, 400, "INVALID_ID"},
		{"update invalid body", "PUT", "/api/v1/history/1", `{`, 400, "INVALID_JSON"},
		{"update missing entry", "PUT", "/api/v1/history/99", `{"operation":"add","a":1,"b":1}`, 404, "NOT_FOUND"},
		{"delete missing entry", "DELETE", "/api/v1/history/99", ``, 404, "NOT_FOUND"},
		{"limit not a number", "GET", "/api/v1/history?limit=abc", ``, 400, "INVALID_LIMIT"},
		{"limit too large", "GET", "/api/v1/history?limit=9999", ``, 400, "INVALID_LIMIT"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := do(h, tc.method, tc.path, tc.body)
			if rec.Code != tc.status || errorCode(t, rec) != tc.code {
				t.Errorf("got %d %s, want %d %s", rec.Code, rec.Body, tc.status, tc.code)
			}
		})
	}
}

func TestCalculatorOutage(t *testing.T) {
	rec := do(newServer(fakeCalc{down: true}), http.MethodPost, "/api/v1/history", `{"operation":"add","a":1,"b":1}`)
	if rec.Code != http.StatusBadGateway || errorCode(t, rec) != "CALCULATOR_UNAVAILABLE" {
		t.Errorf("got %d %s", rec.Code, rec.Body)
	}
}

type brokenService struct{ Service }

func (brokenService) List(context.Context, int) ([]history.Entry, error) {
	return nil, errors.New("disk on fire")
}
func (brokenService) Ready(context.Context) error { return errors.New("disk on fire") }

func TestInternalErrorsAreHidden(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	h := New(brokenService{}, logger)

	rec := do(h, http.MethodGet, "/api/v1/history", "")
	if rec.Code != 500 || errorCode(t, rec) != "INTERNAL_ERROR" || strings.Contains(rec.Body.String(), "disk") {
		t.Errorf("leaked or wrong: %d %s", rec.Code, rec.Body)
	}
	rec = do(h, http.MethodGet, "/readyz", "")
	if rec.Code != 503 || errorCode(t, rec) != "NOT_READY" {
		t.Errorf("readyz: %d %s", rec.Code, rec.Body)
	}
}

func TestHealthAndReady(t *testing.T) {
	h := newServer(fakeCalc{})
	if rec := do(h, http.MethodGet, "/healthz", ""); rec.Code != 200 {
		t.Errorf("healthz: %d", rec.Code)
	}
	if rec := do(h, http.MethodGet, "/readyz", ""); rec.Code != 200 {
		t.Errorf("readyz: %d", rec.Code)
	}
}

func TestMiddleware(t *testing.T) {
	h := newServer(fakeCalc{})

	req := httptest.NewRequest(http.MethodOptions, "/api/v1/history", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent || !strings.Contains(rec.Header().Get("Access-Control-Allow-Methods"), "DELETE") {
		t.Errorf("preflight: %d %v", rec.Code, rec.Header())
	}

	if id := do(h, http.MethodGet, "/healthz", "").Header().Get("X-Request-ID"); id == "" {
		t.Error("missing request id")
	}

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	panicking := recoverPanic(logger, http.HandlerFunc(func(http.ResponseWriter, *http.Request) { panic("boom") }))
	if rec := do(panicking, http.MethodGet, "/", ""); rec.Code != 500 {
		t.Errorf("panic not recovered: %d", rec.Code)
	}
}
