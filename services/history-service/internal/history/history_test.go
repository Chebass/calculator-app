package history_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"sezzlemath/history-service/internal/history"
	"sezzlemath/history-service/internal/store"
)

type fakeCalc struct {
	result float64
	err    error
	calls  int
}

func (f *fakeCalc) Calculate(_ context.Context, _ string, _ float64, _ *float64) (float64, error) {
	f.calls++
	return f.result, f.err
}

func ptr(f float64) *float64 { return &f }

func newService(calc history.Calculator) (*history.Service, *time.Time) {
	clock := time.Date(2026, 5, 6, 7, 8, 9, 0, time.UTC)
	return history.NewService(store.NewMemory(), calc, func() time.Time { return clock }), &clock
}

func TestCreateStoresServerComputedResult(t *testing.T) {
	calc := &fakeCalc{result: 42}
	svc, clock := newService(calc)

	got, err := svc.Create(context.Background(), history.Input{Operation: "add", A: 1, B: ptr(2)})
	if err != nil {
		t.Fatal(err)
	}
	if got.Result != 42 || got.ID == 0 || !got.CreatedAt.Equal(*clock) || !got.UpdatedAt.Equal(*clock) {
		t.Errorf("unexpected entry: %+v", got)
	}
}

func TestCreateDoesNotStoreWhenCalculationFails(t *testing.T) {
	boom := errors.New("division by zero")
	svc, _ := newService(&fakeCalc{err: boom})

	if _, err := svc.Create(context.Background(), history.Input{Operation: "divide", A: 1, B: ptr(0)}); !errors.Is(err, boom) {
		t.Fatalf("got %v", err)
	}
	if entries, _ := svc.List(context.Background(), 10); len(entries) != 0 {
		t.Errorf("failed calculation must not be stored, got %d entries", len(entries))
	}
}

func TestUpdateRecomputes(t *testing.T) {
	calc := &fakeCalc{result: 3}
	svc, _ := newService(calc)
	created, _ := svc.Create(context.Background(), history.Input{Operation: "add", A: 1, B: ptr(2)})

	calc.result = 20
	updated, err := svc.Update(context.Background(), created.ID, history.Input{Operation: "multiply", A: 4, B: ptr(5)})
	if err != nil {
		t.Fatal(err)
	}
	if updated.Result != 20 || updated.Operation != "multiply" || updated.A != 4 || *updated.B != 5 {
		t.Errorf("unexpected: %+v", updated)
	}
	if !updated.CreatedAt.Equal(created.CreatedAt) {
		t.Error("createdAt must be preserved")
	}
}

func TestUpdateErrors(t *testing.T) {
	calc := &fakeCalc{result: 1}
	svc, _ := newService(calc)

	if _, err := svc.Update(context.Background(), 99, history.Input{Operation: "add", A: 1, B: ptr(1)}); !errors.Is(err, history.ErrNotFound) {
		t.Errorf("missing entry: %v", err)
	}
	if calc.calls != 0 {
		t.Error("should not call the calculator for a missing entry")
	}

	created, _ := svc.Create(context.Background(), history.Input{Operation: "add", A: 1, B: ptr(1)})
	boom := errors.New("bad")
	calc.err = boom
	if _, err := svc.Update(context.Background(), created.ID, history.Input{Operation: "x", A: 1}); !errors.Is(err, boom) {
		t.Errorf("calc failure: %v", err)
	}
}

func TestGetListDeleteClearReady(t *testing.T) {
	svc, _ := newService(&fakeCalc{result: 1})
	ctx := context.Background()
	a, _ := svc.Create(ctx, history.Input{Operation: "add", A: 1, B: ptr(1)})
	b, _ := svc.Create(ctx, history.Input{Operation: "add", A: 2, B: ptr(2)})

	if got, err := svc.Get(ctx, a.ID); err != nil || got.ID != a.ID {
		t.Errorf("get: %+v %v", got, err)
	}
	if list, _ := svc.List(ctx, 10); len(list) != 2 || list[0].ID != b.ID {
		t.Errorf("list: %+v", list)
	}
	if err := svc.Delete(ctx, a.ID); err != nil {
		t.Errorf("delete: %v", err)
	}
	if err := svc.Clear(ctx); err != nil {
		t.Errorf("clear: %v", err)
	}
	if err := svc.Ready(ctx); err != nil {
		t.Errorf("ready: %v", err)
	}
}

func TestNewServiceDefaultsClock(t *testing.T) {
	svc := history.NewService(store.NewMemory(), &fakeCalc{}, nil)
	got, err := svc.Create(context.Background(), history.Input{Operation: "add", A: 1, B: ptr(1)})
	if err != nil || got.CreatedAt.IsZero() {
		t.Errorf("default clock not applied: %+v %v", got, err)
	}
}
