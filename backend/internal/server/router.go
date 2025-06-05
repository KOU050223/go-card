// backend/internal/server/router.go
package server

import (
	"fmt"
	"net/http"
	"time"

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
		// WebSocketの場合はクエリパラメータからトークンとUIDを取得
		token := c.QueryParam("token")
		userID := c.QueryParam("uid")

		var uid string
		if token != "" {
			// トークンが提供されている場合は検証
			verifiedUID, err := authMiddleware.VerifyWebSocketToken(token)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "トークン検証に失敗しました")
			}
			uid = verifiedUID
		} else if userID != "" {
			// UIDが直接提供されている場合はそれを使用（開発用）
			uid = userID
		} else {
			// どちらもない場合はランダムなユーザーIDを生成（開発用）
			uid = "anonymous-" + c.RealIP() + "-" + fmt.Sprintf("%d", time.Now().Unix())
		}

		return ws.ServeWS(c, hub, uid)
	})
}
