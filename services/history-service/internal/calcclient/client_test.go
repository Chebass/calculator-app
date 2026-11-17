package calcclient

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func ptr(f float64) *float64 { return &f }

func TestCalculateSuccess(t *testing.T) {
	var got request
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/v1/calculate" {
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
		}
		_ = json.NewDecoder(r.Body).Decode(&got)
		_, _ = w.Write([]byte(`{"operation":"add","result":5}`))
	}))
	defer srv.Close()

	// A trailing slash on the base URL must be tolerated.
	result, err := New(srv.URL+"/", nil).Calculate(context.Background(), "add", 2, ptr(3))
	if err != nil || result != 5 {
		t.Fatalf("got %v, %v", result, err)
	}
	if got.Operation != "add" || got.A != 2 || got.B == nil || *got.B != 3 {
		t.Errorf("server received %+v", got)
	}
}

func TestCalculateBusinessError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnprocessableEntity)
		_, _ = w.Write([]byte(`{"error":{"code":"DIVISION_BY_ZERO","message":"division by zero"}}`))
	}))
	defer srv.Close()

	_, err := New(srv.URL, nil).Calculate(context.Background(), "divide", 1, ptr(0))
	var calcErr *Error
	if !errors.As(err, &calcErr) || calcErr.Status != 422 || calcErr.Code != "DIVISION_BY_ZERO" || calcErr.Error() == "" {
		t.Fatalf("got %v", err)
	}
}

func TestCalculateUnavailable(t *testing.T) {
	tests := map[string]http.HandlerFunc{
		"server error":   func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(500); _, _ = w.Write([]byte(`{}`)) },
		"garbage":        func(w http.ResponseWriter, _ *http.Request) { _, _ = w.Write([]byte(`<html>`)) },
		"4xx w/o detail": func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(404); _, _ = w.Write([]byte(`{}`)) },
	}
	for name, h := range tests {
		t.Run(name, func(t *testing.T) {
			srv := httptest.NewServer(h)
			defer srv.Close()
			if _, err := New(srv.URL, nil).Calculate(context.Background(), "add", 1, ptr(1)); !errors.Is(err, ErrUnavailable) {
				t.Errorf("got %v", err)
			}
		})
	}
}

func TestCalculateConnectionRefused(t *testing.T) {
	srv := httptest.NewServer(http.NotFoundHandler())
	url := srv.URL
	srv.Close()
	if _, err := New(url, nil).Calculate(context.Background(), "add", 1, ptr(1)); !errors.Is(err, ErrUnavailable) {
		t.Errorf("got %v", err)
	}
}

func TestCalculateBadURL(t *testing.T) {
	if _, err := New("http://bad host", nil).Calculate(context.Background(), "add", 1, ptr(1)); err == nil {
		t.Error("expected an error for an invalid URL")
	}
}
