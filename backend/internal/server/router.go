// backend/internal/server/router.go
package server

import (
	"net/http"

	"github.com/KOU050223/go-card/internal/auth"
	"github.com/KOU050223/go-card/internal/db"
	"github.com/KOU050223/go-card/internal/ws"
	"github.com/labstack/echo/v4"
)

// setupRoutes はすべてのルートをEchoインスタンスに登録します
func setupRoutes(e *echo.Echo, cfg *Config) {
	// データベース初期化
	dbConn, err := db.NewMySQL(cfg.DB.User, cfg.DB.Password, cfg.DB.InstanceConnectionName, cfg.DB.Name)
	if err != nil {
		e.Logger.Fatalf("データベース接続エラー: %v", err)
	}

	// リポジトリ作成
	userRepo := db.NewUserRepository(dbConn)

	// Firebase認証ミドルウェア初期化
	authMiddleware, err := auth.NewFirebaseMiddleware(cfg.FirebaseProject)
	if err != nil {
		e.Logger.Fatalf("Firebase初期化エラー: %v", err)
	}

	// WebSocketハブ初期化
	hub := ws.NewHub()
	go hub.Run()

	// パブリックエンドポイント
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	// 認証が必要なエンドポイント
	api := e.Group("/api", authMiddleware.Verify)

	// ユーザー関連API
	api.GET("/users/me", func(c echo.Context) error {
		uid := c.Get("uid").(string)
		user, err := userRepo.GetByID(c.Request().Context(), uid)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "ユーザー情報の取得に失敗しました")
		}
		if user == nil {
			return echo.NewHTTPError(http.StatusNotFound, "ユーザーが見つかりません")
		}
		return c.JSON(http.StatusOK, user)
	})

	// WebSocket接続エンドポイント
	e.GET("/ws", func(c echo.Context) error {
		uid := c.Get("uid").(string)
		return ws.ServeWS(c, hub, uid)
	}, authMiddleware.Verify)
}
