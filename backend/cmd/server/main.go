package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/KOU050223/go-card/internal/server"
)

func main() {
	cfg := LoadConfig()    // config.go の関数
	srv := server.New(cfg) // Echo を含む初期化
	ctx, stop := signal.NotifyContext(context.Background(),
		syscall.SIGTERM, os.Interrupt)
	defer stop()

	go func() {
		if err := srv.Start(":8080"); err != nil {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-ctx.Done() // Ctrl+C / SIGTERM 待ち
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}
