package handler

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newServer() http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return Chain(New(logger), logger, []string{"http://localhost:5173"})
}

func do(t *testing.T, h http.Handler, method, path, body string, headers ...string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	for i := 0; i+1 < len(headers); i += 2 {
		req.Header.Set(headers[i], headers[i+1])
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestCalculate(t *testing.T) {
	h := newServer()
	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantResult float64
		wantCode   string
	}{
		{"add", `{"operation":"add","a":2,"b":3}`, 200, 5, ""},
		{"divide", `{"operation":"divide","a":9,"b":3}`, 200, 3, ""},
		{"zero operand is not missing", `{"operation":"add","a":0,"b":0}`, 200, 0, ""},
		{"sqrt", `{"operation":"sqrt","a":81}`, 200, 9, ""},
		{"percentage", `{"operation":"percentage","a":10,"b":200}`, 200, 20, ""},
		{"division by zero", `{"operation":"divide","a":1,"b":0}`, 422, 0, "DIVISION_BY_ZERO"},
		{"negative sqrt", `{"operation":"sqrt","a":-4}`, 422, 0, "NEGATIVE_SQRT"},
		{"overflow", `{"operation":"multiply","a":1e308,"b":10}`, 422, 0, "UNDEFINED_RESULT"},
		{"unknown operation", `{"operation":"mod","a":1,"b":2}`, 400, 0, "UNKNOWN_OPERATION"},
		{"missing a", `{"operation":"add","b":2}`, 400, 0, "MISSING_OPERAND"},
		{"missing b", `{"operation":"add","a":2}`, 400, 0, "MISSING_OPERAND"},
		{"unexpected b", `{"operation":"sqrt","a":4,"b":2}`, 400, 0, "UNEXPECTED_OPERAND"},
		{"operand as string", `{"operation":"add","a":"1","b":2}`, 400, 0, "INVALID_JSON"},
		{"unknown field", `{"operation":"add","a":1,"b":2,"c":3}`, 400, 0, "INVALID_JSON"},
		{"malformed json", `{"operation":`, 400, 0, "INVALID_JSON"},
		{"empty body", ``, 400, 0, "INVALID_JSON"},
		{"trailing data", `{"operation":"add","a":1,"b":2}{}`, 400, 0, "INVALID_JSON"},
		{"body too large", `{"operation":"` + strings.Repeat("x", 2048) + `"}`, 400, 0, "INVALID_JSON"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := do(t, h, http.MethodPost, "/api/v1/calculate", tc.body)
			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.wantStatus, rec.Body)
			}
			if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
				t.Errorf("content-type = %q", ct)
			}
			if tc.wantCode != "" {
				var e ErrorBody
				if err := json.Unmarshal(rec.Body.Bytes(), &e); err != nil {
					t.Fatal(err)
				}
				if e.Error.Code != tc.wantCode || e.Error.Message == "" {
					t.Errorf("error = %+v, want code %s", e.Error, tc.wantCode)
				}
				return
			}
			var res CalculateResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
				t.Fatal(err)
			}
			if res.Result != tc.wantResult {
				t.Errorf("result = %v, want %v", res.Result, tc.wantResult)
			}
		})
	}
}

func TestOperations(t *testing.T) {
	rec := do(t, newServer(), http.MethodGet, "/api/v1/operations", "")
	if rec.Code != 200 {
		t.Fatalf("status = %d", rec.Code)
	}
	var body struct {
		Operations []struct {
			Name  string `json:"name"`
			Arity int    `json:"arity"`
		} `json:"operations"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if len(body.Operations) != 7 || body.Operations[0].Name != "add" {
		t.Errorf("unexpected operations: %+v", body.Operations)
	}
}

func TestHealth(t *testing.T) {
	rec := do(t, newServer(), http.MethodGet, "/healthz", "")
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), `"ok"`) {
		t.Errorf("unexpected health response: %d %s", rec.Code, rec.Body)
	}
}

func TestMethodNotAllowed(t *testing.T) {
	rec := do(t, newServer(), http.MethodGet, "/api/v1/calculate", "")
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want 405", rec.Code)
	}
}

func TestRequestID(t *testing.T) {
	h := newServer()
	if id := do(t, h, http.MethodGet, "/healthz", "").Header().Get("X-Request-ID"); id == "" {
		t.Error("expected generated request id")
	}
	if id := do(t, h, http.MethodGet, "/healthz", "", "X-Request-ID", "abc").Header().Get("X-Request-ID"); id != "abc" {
		t.Errorf("request id = %q, want abc", id)
	}
}

func TestCORS(t *testing.T) {
	h := newServer()
	rec := do(t, h, http.MethodOptions, "/api/v1/calculate", "", "Origin", "http://localhost:5173")
	if rec.Code != http.StatusNoContent || rec.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Errorf("preflight failed: %d %v", rec.Code, rec.Header())
	}
	rec = do(t, h, http.MethodGet, "/healthz", "", "Origin", "http://evil.example")
	if rec.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Error("disallowed origin must not receive CORS headers")
	}
}

func TestWildcardCORS(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	h := Chain(New(logger), logger, []string{"*"})
	rec := do(t, h, http.MethodGet, "/healthz", "", "Origin", "http://anything.example")
	if rec.Header().Get("Access-Control-Allow-Origin") != "http://anything.example" {
		t.Error("wildcard should allow any origin")
	}
}

func TestRecoverPanic(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	h := recoverPanic(logger, http.HandlerFunc(func(http.ResponseWriter, *http.Request) { panic("boom") }))
	rec := do(t, h, http.MethodGet, "/", "")
	if rec.Code != http.StatusInternalServerError || !strings.Contains(rec.Body.String(), "INTERNAL_ERROR") {
		t.Errorf("unexpected: %d %s", rec.Code, rec.Body)
	}
}

func TestClassifyUnknownError(t *testing.T) {
	status, code := classify(io.ErrUnexpectedEOF)
	if status != http.StatusInternalServerError || code != "INTERNAL_ERROR" {
		t.Errorf("got %d %s", status, code)
	}
}
