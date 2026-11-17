// Package config reads service configuration from environment variables.
package config

import (
	"log/slog"
	"os"
	"strings"
)

// Config holds runtime settings.
type Config struct {
	Port           string
	LogLevel       slog.Level
	AllowedOrigins []string
}

// Load reads PORT (default 8081), LOG_LEVEL (debug|info|warn|error, default info)
// and CORS_ORIGINS (comma-separated, default "*").
func Load() Config {
	return Config{
		Port:           getenv("PORT", "8081"),
		LogLevel:       parseLevel(getenv("LOG_LEVEL", "info")),
		AllowedOrigins: splitCSV(getenv("CORS_ORIGINS", "*")),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseLevel(s string) slog.Level {
	var l slog.Level
	if err := l.UnmarshalText([]byte(s)); err != nil {
		return slog.LevelInfo
	}
	return l
}

func splitCSV(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
