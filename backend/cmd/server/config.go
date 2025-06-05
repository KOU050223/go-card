// backend/cmd/server/config.go
package main

import (
	"flag"
	"os"
	"strconv"
	"strings"

	"github.com/KOU050223/go-card/internal/server"
	"github.com/joho/godotenv"
)

// LoadConfig は環境変数とコマンドラインフラグから設定を読み込みます
func LoadConfig() *server.Config {
	// .env ファイルがあれば読み込み
	godotenv.Load()

	// デフォルト値の設定
	cfg := &server.Config{
		Port:            8080,
		AllowOrigins:    []string{"*"},
		FirebaseProject: os.Getenv("FIREBASE_PROJECT_ID"),
		DB: server.DBConfig{
			User:                   os.Getenv("DB_USER"),
			Password:               os.Getenv("DB_PASS"),
			Name:                   os.Getenv("DB_NAME"),
			InstanceConnectionName: os.Getenv("INSTANCE_CONNECTION_NAME"),
		},
	}

	// 環境変数から読み込み (PORT はGCP App Engineで使用)
	if port := os.Getenv("PORT"); port != "" {
		if p, err := strconv.Atoi(port); err == nil {
			cfg.Port = p
		}
	}

	if origins := os.Getenv("ALLOW_ORIGINS"); origins != "" {
		cfg.AllowOrigins = strings.Split(origins, ",")
	}

	// コマンドラインフラグの処理
	flag.IntVar(&cfg.Port, "port", cfg.Port, "Server port")
	flag.Parse()

	return cfg
}
