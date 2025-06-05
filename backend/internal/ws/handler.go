// backend/internal/ws/handler.go
package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 本番環境では適切なオリジン検証を行うこと
	},
}

// ServeWS はHTTP接続をWebSocket接続にアップグレードします
func ServeWS(c echo.Context, hub *Hub, userID string) error {
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Printf("WebSocketアップグレードエラー: %v", err)
		return err
	}

	client := &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan *Message, 256),
		userID: userID,
		closed: false,
	}

	// クライアント登録
	client.hub.register <- client

	// 接続通知メッセージ
	hub.BroadcastMessage(&Message{
		Type:    "user_connected",
		UserID:  userID,
		Content: map[string]string{"message": "ユーザーが接続しました"},
	})

	// クライアントの読み書きgoroutineを起動
	go client.writePump()
	go client.readPump()

	return nil
}
