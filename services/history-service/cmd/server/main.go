// Command server runs the SezzleMath history microservice.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"sezzlemath/history-service/internal/calcclient"
	"sezzlemath/history-service/internal/config"
	"sezzlemath/history-service/internal/handler"
	"sezzlemath/history-service/internal/history"
	"sezzlemath/history-service/internal/store"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel}))

	repo, err := store.OpenSQLite(cfg.DBPath)
	if err != nil {
		logger.Error("cannot open database", "path", cfg.DBPath, "error", err)
		os.Exit(1)
	}
	defer repo.Close()

	svc := history.NewService(repo, calcclient.New(cfg.CalculatorURL, nil), nil)
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler.Chain(handler.New(svc, logger), logger, cfg.AllowedOrigins),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("history-service listening", "addr", srv.Addr, "db", cfg.DBPath, "calculator", cfg.CalculatorURL)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", "error", err)
			stop()
		}
	}()

	<-ctx.Done()
	logger.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
	}
}
