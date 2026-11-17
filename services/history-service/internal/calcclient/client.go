// Package calcclient is the history-service's HTTP client for the calculator-service.
package calcclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// ErrUnavailable means the calculator-service could not be reached or misbehaved.
var ErrUnavailable = errors.New("calculator service unavailable")

// Error is a business error reported by the calculator-service (HTTP 4xx).
type Error struct {
	Status  int
	Code    string
	Message string
}

func (e *Error) Error() string { return e.Message }

// Client calls POST /api/v1/calculate.
type Client struct {
	baseURL string
	http    *http.Client
}

// New returns a client for the calculator-service at baseURL.
func New(baseURL string, httpClient *http.Client) *Client {
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 3 * time.Second}
	}
	return &Client{baseURL: strings.TrimRight(baseURL, "/"), http: httpClient}
}

type request struct {
	Operation string   `json:"operation"`
	A         float64  `json:"a"`
	B         *float64 `json:"b,omitempty"`
}

type response struct {
	Result float64 `json:"result"`
	Error  *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// Calculate implements history.Calculator.
func (c *Client) Calculate(ctx context.Context, operation string, a float64, b *float64) (float64, error) {
	body, err := json.Marshal(request{Operation: operation, A: a, B: b})
	if err != nil {
		return 0, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/v1/calculate", bytes.NewReader(body))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	defer resp.Body.Close()

	var out response
	// A calculation response is a few dozen bytes; never buffer more than 64 KiB from a peer.
	if err := json.NewDecoder(io.LimitReader(resp.Body, 64<<10)).Decode(&out); err != nil {
		return 0, fmt.Errorf("%w: unreadable response (status %d)", ErrUnavailable, resp.StatusCode)
	}
	switch {
	case resp.StatusCode == http.StatusOK:
		return out.Result, nil
	case resp.StatusCode >= 400 && resp.StatusCode < 500 && out.Error != nil:
		return 0, &Error{Status: resp.StatusCode, Code: out.Error.Code, Message: out.Error.Message}
	default:
		return 0, fmt.Errorf("%w: status %d", ErrUnavailable, resp.StatusCode)
	}
}
