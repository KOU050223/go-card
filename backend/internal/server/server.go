// backend/internal/server/server.go
package server

import (
	"context"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// Server はアプリケーションのHTTPサーバーを表します
type Server struct {
	*echo.Echo
	config *Config
}

// Config はサーバー設定を保持します
type Config struct {
	Port            int
	AllowOrigins    []string
	FirebaseProject string
	DB              DBConfig
}

// DBConfig はデータベース接続設定を保持します
type DBConfig struct {
	User                   string
	Password               string
	Name                   string
	InstanceConnectionName string
}

// New は設定に基づいて新しいサーバーインスタンスを作成します
func New(cfg *Config) *Server {
	e := echo.New()

	// ミドルウェア設定
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.AllowOrigins,
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowCredentials: true, // 追加: Cookie/認証情報を許可
	}))

	// ルーティング設定
	setupRoutes(e, cfg)

	return &Server{
		Echo:   e,
		config: cfg,
	}
}

// Start はサーバーを指定ポートで起動します
func (s *Server) Start(addr string) error {
	port := ":" + strconv.Itoa(s.config.Port)
	if addr != "" {
		port = addr
	}
	return s.Echo.Start(port)
}

// Shutdown はサーバーを正常に終了します
func (s *Server) Shutdown(ctx context.Context) error {
	return s.Echo.Shutdown(ctx)
}
