package config

import (
	"log/slog"
	"reflect"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	t.Setenv("PORT", "")
	t.Setenv("LOG_LEVEL", "")
	t.Setenv("CORS_ORIGINS", "")
	cfg := Load()
	if cfg.Port != "8081" || cfg.LogLevel != slog.LevelInfo || !reflect.DeepEqual(cfg.AllowedOrigins, []string{"*"}) {
		t.Errorf("unexpected defaults: %+v", cfg)
	}
}

func TestLoadFromEnv(t *testing.T) {
	t.Setenv("PORT", "9000")
	t.Setenv("LOG_LEVEL", "debug")
	t.Setenv("CORS_ORIGINS", "http://a.example, http://b.example ,")
	cfg := Load()
	if cfg.Port != "9000" || cfg.LogLevel != slog.LevelDebug {
		t.Errorf("unexpected config: %+v", cfg)
	}
	want := []string{"http://a.example", "http://b.example"}
	if !reflect.DeepEqual(cfg.AllowedOrigins, want) {
		t.Errorf("origins = %v, want %v", cfg.AllowedOrigins, want)
	}
}

func TestInvalidLogLevelFallsBack(t *testing.T) {
	t.Setenv("LOG_LEVEL", "loud")
	if Load().LogLevel != slog.LevelInfo {
		t.Error("invalid level should fall back to info")
	}
}
