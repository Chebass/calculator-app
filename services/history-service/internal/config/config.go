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
	DBPath         string
	CalculatorURL  string
}

// Load reads PORT (default 8082), LOG_LEVEL (default info), CORS_ORIGINS (default "*"),
// DB_PATH (default ./data/history.db) and CALCULATOR_URL (default http://localhost:8081).
func Load() Config {
	return Config{
		Port:           getenv("PORT", "8082"),
		LogLevel:       parseLevel(getenv("LOG_LEVEL", "info")),
		AllowedOrigins: splitCSV(getenv("CORS_ORIGINS", "*")),
		DBPath:         getenv("DB_PATH", "./data/history.db"),
		CalculatorURL:  getenv("CALCULATOR_URL", "http://localhost:8081"),
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
