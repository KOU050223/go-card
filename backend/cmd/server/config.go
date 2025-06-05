package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUser   string
	DBPass   string
	DBName   string
	InstConn string
}

func LoadConfig() Config {
	_ = godotenv.Load(".env") // dev だけ

	c := Config{
		DBUser:   getenv("DB_USER", "appuser"),
		DBPass:   must("DB_PASS"),
		DBName:   getenv("DB_NAME", "quickduel"),
		InstConn: must("INSTANCE_CONNECTION_NAME"),
	}
	return c
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
func must(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("env %s is required", k)
	}
	return v
}
