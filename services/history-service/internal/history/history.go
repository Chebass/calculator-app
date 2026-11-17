// Package history is the domain layer of the history-service: it stores past
// calculations and keeps them trustworthy by recomputing every result through
// the calculator-service instead of believing the client.
package history

import (
	"context"
	"errors"
	"time"
)

// ErrNotFound is returned when an entry does not exist.
var ErrNotFound = errors.New("history entry not found")

// Entry is one stored calculation.
type Entry struct {
	ID        int64     `json:"id"`
	Operation string    `json:"operation"`
	A         float64   `json:"a"`
	B         *float64  `json:"b,omitempty"`
	Result    float64   `json:"result"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Input is what a client may submit; the result is always computed server-side.
type Input struct {
	Operation string
	A         float64
	B         *float64
}

// Repository persists entries. Implementations live in internal/store.
type Repository interface {
	Create(ctx context.Context, e Entry) (Entry, error)
	Get(ctx context.Context, id int64) (Entry, error)
	List(ctx context.Context, limit int) ([]Entry, error)
	Update(ctx context.Context, e Entry) (Entry, error)
	Delete(ctx context.Context, id int64) error
	Clear(ctx context.Context) error
	Ping(ctx context.Context) error
}

// Calculator computes results; implemented by the calculator-service HTTP client.
type Calculator interface {
	Calculate(ctx context.Context, operation string, a float64, b *float64) (float64, error)
}

// Service implements the history use cases.
type Service struct {
	repo Repository
	calc Calculator
	now  func() time.Time
}

// NewService wires the service. A nil clock defaults to time.Now.
func NewService(repo Repository, calc Calculator, now func() time.Time) *Service {
	if now == nil {
		now = time.Now
	}
	return &Service{repo: repo, calc: calc, now: now}
}

// Create computes and stores a new entry.
func (s *Service) Create(ctx context.Context, in Input) (Entry, error) {
	result, err := s.calc.Calculate(ctx, in.Operation, in.A, in.B)
	if err != nil {
		return Entry{}, err
	}
	now := s.now().UTC()
	return s.repo.Create(ctx, Entry{
		Operation: in.Operation, A: in.A, B: in.B, Result: result, CreatedAt: now, UpdatedAt: now,
	})
}

// Update replaces the operands/operation of an entry and recomputes the result.
func (s *Service) Update(ctx context.Context, id int64, in Input) (Entry, error) {
	current, err := s.repo.Get(ctx, id)
	if err != nil {
		return Entry{}, err
	}
	result, err := s.calc.Calculate(ctx, in.Operation, in.A, in.B)
	if err != nil {
		return Entry{}, err
	}
	current.Operation, current.A, current.B, current.Result = in.Operation, in.A, in.B, result
	current.UpdatedAt = s.now().UTC()
	return s.repo.Update(ctx, current)
}

// Get returns one entry.
func (s *Service) Get(ctx context.Context, id int64) (Entry, error) { return s.repo.Get(ctx, id) }

// List returns the newest entries first.
func (s *Service) List(ctx context.Context, limit int) ([]Entry, error) {
	return s.repo.List(ctx, limit)
}

// Delete removes one entry.
func (s *Service) Delete(ctx context.Context, id int64) error { return s.repo.Delete(ctx, id) }

// Clear removes every entry.
func (s *Service) Clear(ctx context.Context) error { return s.repo.Clear(ctx) }

// Ready reports whether the service can reach its storage.
func (s *Service) Ready(ctx context.Context) error { return s.repo.Ping(ctx) }
