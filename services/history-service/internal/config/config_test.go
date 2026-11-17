package config

import (
	"log/slog"
	"reflect"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	for _, k := range []string{"PORT", "LOG_LEVEL", "CORS_ORIGINS", "DB_PATH", "CALCULATOR_URL"} {
		t.Setenv(k, "")
	}
	cfg := Load()
	if cfg.Port != "8082" || cfg.LogLevel != slog.LevelInfo || cfg.DBPath != "./data/history.db" ||
		cfg.CalculatorURL != "http://localhost:8081" || !reflect.DeepEqual(cfg.AllowedOrigins, []string{"*"}) {
		t.Errorf("unexpected defaults: %+v", cfg)
	}
}

func TestLoadFromEnv(t *testing.T) {
	t.Setenv("PORT", "9100")
	t.Setenv("LOG_LEVEL", "warn")
	t.Setenv("CORS_ORIGINS", "http://a.example, http://b.example")
	t.Setenv("DB_PATH", "/data/h.db")
	t.Setenv("CALCULATOR_URL", "http://calc:8081")
	cfg := Load()
	want := Config{
		Port: "9100", LogLevel: slog.LevelWarn,
		AllowedOrigins: []string{"http://a.example", "http://b.example"},
		DBPath:         "/data/h.db", CalculatorURL: "http://calc:8081",
	}
	if !reflect.DeepEqual(cfg, want) {
		t.Errorf("got %+v, want %+v", cfg, want)
	}
}

func TestInvalidLogLevelFallsBack(t *testing.T) {
	t.Setenv("LOG_LEVEL", "loud")
	if Load().LogLevel != slog.LevelInfo {
		t.Error("invalid level should fall back to info")
	}
}
