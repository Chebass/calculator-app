package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite" // pure-Go driver: no cgo, tiny static image

	"sezzlemath/history-service/internal/history"
)

const schema = `
CREATE TABLE IF NOT EXISTS history (
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	operation  TEXT NOT NULL,
	a          REAL NOT NULL,
	b          REAL,
	result     REAL NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);`

// SQLite stores history in a single SQLite file.
type SQLite struct{ db *sql.DB }

// OpenSQLite opens (creating if needed) the database at path and applies the schema.
func OpenSQLite(path string) (*SQLite, error) {
	if dir := filepath.Dir(path); dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, fmt.Errorf("create data dir: %w", err)
		}
	}
	db, err := sql.Open("sqlite", "file:"+filepath.ToSlash(path)+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)")
	if err != nil {
		return nil, err
	}
	// SQLite allows one writer at a time; a single connection keeps things simple and safe.
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(schema); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("apply schema: %w", err)
	}
	return &SQLite{db: db}, nil
}

// Close releases the database.
func (s *SQLite) Close() error { return s.db.Close() }

func (s *SQLite) Create(ctx context.Context, e history.Entry) (history.Entry, error) {
	res, err := s.db.ExecContext(ctx,
		`INSERT INTO history (operation, a, b, result, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
		e.Operation, e.A, nullable(e.B), e.Result, formatTime(e.CreatedAt), formatTime(e.UpdatedAt))
	if err != nil {
		return history.Entry{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return history.Entry{}, err
	}
	e.ID = id
	return e, nil
}

const selectCols = `SELECT id, operation, a, b, result, created_at, updated_at FROM history`

func (s *SQLite) Get(ctx context.Context, id int64) (history.Entry, error) {
	e, err := scan(s.db.QueryRowContext(ctx, selectCols+` WHERE id = ?`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return history.Entry{}, history.ErrNotFound
	}
	return e, err
}

func (s *SQLite) List(ctx context.Context, limit int) ([]history.Entry, error) {
	if limit <= 0 {
		limit = -1 // SQLite: no limit
	}
	rows, err := s.db.QueryContext(ctx, selectCols+` ORDER BY id DESC LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []history.Entry{}
	for rows.Next() {
		e, err := scan(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (s *SQLite) Update(ctx context.Context, e history.Entry) (history.Entry, error) {
	res, err := s.db.ExecContext(ctx,
		`UPDATE history SET operation = ?, a = ?, b = ?, result = ?, updated_at = ? WHERE id = ?`,
		e.Operation, e.A, nullable(e.B), e.Result, formatTime(e.UpdatedAt), e.ID)
	if err != nil {
		return history.Entry{}, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return history.Entry{}, history.ErrNotFound
	}
	return e, nil
}

func (s *SQLite) Delete(ctx context.Context, id int64) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM history WHERE id = ?`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return history.ErrNotFound
	}
	return nil
}

func (s *SQLite) Clear(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM history`)
	return err
}

func (s *SQLite) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

type scanner interface{ Scan(dest ...any) error }

func scan(r scanner) (history.Entry, error) {
	var (
		e                  history.Entry
		b                  sql.NullFloat64
		createdAt, updated string
	)
	if err := r.Scan(&e.ID, &e.Operation, &e.A, &b, &e.Result, &createdAt, &updated); err != nil {
		return history.Entry{}, err
	}
	if b.Valid {
		v := b.Float64
		e.B = &v
	}
	var err error
	if e.CreatedAt, err = time.Parse(time.RFC3339Nano, createdAt); err != nil {
		return history.Entry{}, err
	}
	if e.UpdatedAt, err = time.Parse(time.RFC3339Nano, updated); err != nil {
		return history.Entry{}, err
	}
	return e, nil
}

func nullable(b *float64) any {
	if b == nil {
		return nil
	}
	return *b
}

func formatTime(t time.Time) string { return t.UTC().Format(time.RFC3339Nano) }
