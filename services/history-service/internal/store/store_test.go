package store

import (
	"context"
	"errors"
	"path/filepath"
	"testing"
	"time"

	"sezzlemath/history-service/internal/history"
)

// Both implementations must satisfy the same behaviour: run one contract against each.
func repositories(t *testing.T) map[string]history.Repository {
	t.Helper()
	sqliteRepo, err := OpenSQLite(filepath.Join(t.TempDir(), "nested", "history.db"))
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	t.Cleanup(func() { _ = sqliteRepo.Close() })
	return map[string]history.Repository{"memory": NewMemory(), "sqlite": sqliteRepo}
}

func ptr(f float64) *float64 { return &f }

func entry(op string, a float64, b *float64, result float64) history.Entry {
	now := time.Date(2026, 1, 2, 3, 4, 5, 6, time.UTC)
	return history.Entry{Operation: op, A: a, B: b, Result: result, CreatedAt: now, UpdatedAt: now}
}

func TestRepositoryContract(t *testing.T) {
	for name, repo := range repositories(t) {
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()

			if err := repo.Ping(ctx); err != nil {
				t.Fatalf("ping: %v", err)
			}

			first, err := repo.Create(ctx, entry("add", 1, ptr(2), 3))
			if err != nil || first.ID == 0 {
				t.Fatalf("create: %+v %v", first, err)
			}
			second, _ := repo.Create(ctx, entry("sqrt", 9, nil, 3))
			third, _ := repo.Create(ctx, entry("multiply", 2, ptr(4), 8))

			got, err := repo.Get(ctx, first.ID)
			if err != nil || got.B == nil || *got.B != 2 || !got.CreatedAt.Equal(first.CreatedAt) {
				t.Fatalf("get: %+v %v", got, err)
			}
			unary, _ := repo.Get(ctx, second.ID)
			if unary.B != nil {
				t.Errorf("unary entry must keep b = nil, got %v", *unary.B)
			}

			list, err := repo.List(ctx, 0)
			if err != nil || len(list) != 3 || list[0].ID != third.ID || list[2].ID != first.ID {
				t.Fatalf("list newest-first: %+v %v", list, err)
			}
			limited, _ := repo.List(ctx, 2)
			if len(limited) != 2 {
				t.Errorf("limit not applied: %d", len(limited))
			}

			first.Operation, first.Result = "subtract", -1
			first.UpdatedAt = first.UpdatedAt.Add(time.Hour)
			if _, err := repo.Update(ctx, first); err != nil {
				t.Fatalf("update: %v", err)
			}
			updated, _ := repo.Get(ctx, first.ID)
			if updated.Operation != "subtract" || updated.Result != -1 || !updated.UpdatedAt.Equal(first.UpdatedAt) {
				t.Errorf("update not persisted: %+v", updated)
			}

			if err := repo.Delete(ctx, second.ID); err != nil {
				t.Fatalf("delete: %v", err)
			}
			if _, err := repo.Get(ctx, second.ID); !errors.Is(err, history.ErrNotFound) {
				t.Errorf("get after delete: %v", err)
			}

			if err := repo.Clear(ctx); err != nil {
				t.Fatalf("clear: %v", err)
			}
			if list, _ := repo.List(ctx, 0); len(list) != 0 {
				t.Errorf("clear left %d entries", len(list))
			}
		})
	}
}

func TestRepositoryNotFound(t *testing.T) {
	for name, repo := range repositories(t) {
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()
			if _, err := repo.Get(ctx, 42); !errors.Is(err, history.ErrNotFound) {
				t.Errorf("get: %v", err)
			}
			if _, err := repo.Update(ctx, history.Entry{ID: 42}); !errors.Is(err, history.ErrNotFound) {
				t.Errorf("update: %v", err)
			}
			if err := repo.Delete(ctx, 42); !errors.Is(err, history.ErrNotFound) {
				t.Errorf("delete: %v", err)
			}
		})
	}
}

func TestSQLitePersistsAcrossReopen(t *testing.T) {
	path := filepath.Join(t.TempDir(), "history.db")
	repo, err := OpenSQLite(path)
	if err != nil {
		t.Fatal(err)
	}
	created, _ := repo.Create(context.Background(), entry("add", 1, ptr(1), 2))
	_ = repo.Close()

	reopened, err := OpenSQLite(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	if _, err := reopened.Get(context.Background(), created.ID); err != nil {
		t.Errorf("entry lost after reopen: %v", err)
	}
}

func TestOpenSQLiteFailsOnBadPath(t *testing.T) {
	// A file where a directory is expected cannot be created.
	file := filepath.Join(t.TempDir(), "file")
	repo, err := OpenSQLite(file)
	if err != nil {
		t.Fatal(err)
	}
	_ = repo.Close()
	if _, err := OpenSQLite(filepath.Join(file, "sub", "history.db")); err == nil {
		t.Error("expected an error when the data directory cannot be created")
	}
}
