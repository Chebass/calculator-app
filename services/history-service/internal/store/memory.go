// Package store holds the history.Repository implementations.
package store

import (
	"context"
	"sort"
	"sync"

	"sezzlemath/history-service/internal/history"
)

// Memory is a concurrency-safe in-memory repository, used in tests and handy for local runs.
type Memory struct {
	mu      sync.RWMutex
	nextID  int64
	entries map[int64]history.Entry
}

// NewMemory returns an empty in-memory repository.
func NewMemory() *Memory {
	return &Memory{nextID: 1, entries: make(map[int64]history.Entry)}
}

func (m *Memory) Create(_ context.Context, e history.Entry) (history.Entry, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	e.ID = m.nextID
	m.nextID++
	m.entries[e.ID] = e
	return e, nil
}

func (m *Memory) Get(_ context.Context, id int64) (history.Entry, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	e, ok := m.entries[id]
	if !ok {
		return history.Entry{}, history.ErrNotFound
	}
	return e, nil
}

func (m *Memory) List(_ context.Context, limit int) ([]history.Entry, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]history.Entry, 0, len(m.entries))
	for _, e := range m.entries {
		out = append(out, e)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID > out[j].ID })
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}

func (m *Memory) Update(_ context.Context, e history.Entry) (history.Entry, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.entries[e.ID]; !ok {
		return history.Entry{}, history.ErrNotFound
	}
	m.entries[e.ID] = e
	return e, nil
}

func (m *Memory) Delete(_ context.Context, id int64) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.entries[id]; !ok {
		return history.ErrNotFound
	}
	delete(m.entries, id)
	return nil
}

func (m *Memory) Clear(_ context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.entries = make(map[int64]history.Entry)
	return nil
}

func (m *Memory) Ping(context.Context) error { return nil }
