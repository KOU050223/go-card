// backend/internal/auth/middleware.go
package auth

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/labstack/echo/v4"
	"google.golang.org/api/option"
)

// FirebaseMiddleware はFirebase認証ミドルウェアを提供します
type FirebaseMiddleware struct {
	client     *auth.Client
	devMode    bool
	testUserID string
}

// NewFirebaseMiddleware は新しいFirebaseMiddlewareインスタンスを作成します
func NewFirebaseMiddleware(projectID string) (*FirebaseMiddleware, error) {
	// 開発モードの確認
	if os.Getenv("AUTH_DEV_MODE") == "true" {
		return &FirebaseMiddleware{
			client:     nil,
			devMode:    true,
			testUserID: os.Getenv("AUTH_TEST_USER_ID"),
		}, nil
	}

	ctx := context.Background()

	// Firebase初期化
	var app *firebase.App
	var err error

	// サービスアカウントキーパスがあればそれを使用
	if keyPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"); keyPath != "" {
		opt := option.WithCredentialsFile(keyPath)
		app, err = firebase.NewApp(ctx, &firebase.Config{ProjectID: projectID}, opt)
	} else {
		app, err = firebase.NewApp(ctx, &firebase.Config{ProjectID: projectID})
	}

	if err != nil {
		return nil, fmt.Errorf("Firebase初期化エラー: %w", err)
	}

	client, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("Firebase Auth初期化エラー: %w", err)
	}

	return &FirebaseMiddleware{
		client:     client,
		devMode:    false,
		testUserID: "",
	}, nil
}

// Verify はHTTPリクエストのIDトークンを検証します
func (m *FirebaseMiddleware) Verify(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// 開発モードの場合は認証をスキップ
		if m.devMode {
			// 開発用のユーザーIDを設定
			uid := m.testUserID
			if uid == "" {
				uid = "dev-user-123"
			}
			c.Set("uid", uid)
			return next(c)
		}

		// Authorizationヘッダーからトークンを取得
		authHeader := c.Request().Header.Get("Authorization")
		idToken := strings.TrimPrefix(authHeader, "Bearer ")

		if idToken == "" || idToken == authHeader {
			return echo.NewHTTPError(http.StatusUnauthorized, "認証トークンがありません")
		}

		// トークン検証
		token, err := m.client.VerifyIDToken(c.Request().Context(), idToken)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "無効なトークンです")
		}

		// ユーザーIDをコンテキストに設定
		c.Set("uid", token.UID)

		return next(c)
	}
}
