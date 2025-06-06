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

	// 接続通知メッセージ (一時的にコメントアウト)
	// hub.BroadcastMessage(&Message{
	// 	Type:    "user_connected",
	// 	UserID:  userID,
	// 	Content: map[string]string{"message": "ユーザーが接続しました"},
	// })

	// クライアントの読み書きgoroutineを起動
	go client.writePump()
	go client.readPump()

	return nil
}

// ServeDuelWS はDuel用WebSocket接続を処理します
func ServeDuelWS(c echo.Context, hub *Hub, userID string) error {
	duelID := c.QueryParam("duelId")
	if duelID == "" {
		log.Printf("[ServeDuelWS] duelIdが指定されていません (userID=%s)", userID)
		return c.String(http.StatusBadRequest, "duelIdが必要です (from ServeDuelWS)")
	}

	// 認証ユーザーIDのバリデーション（必要なら追加）
	if userID == "" {
		log.Printf("[ServeDuelWS] userIDが空です (duelId=%s)", duelID)
		return c.String(http.StatusUnauthorized, "userIDが必要です (from ServeDuelWS)")
	}

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Printf("[ServeDuelWS] WebSocketアップグレードエラー: %v (userID=%s, duelId=%s)", err, userID, duelID)
		return err
	}

	client := &Client{
		hub:         hub,
		conn:        conn,
		send:        make(chan *Message, 256),
		userID:      userID,
		closed:      false,
		duelService: hub.duelService,
	}

	// クライアント登録
	client.hub.register <- client

	// 対戦データを取得して送信
	duel, err := hub.duelService.GetDuel(duelID)
	if err != nil {
		log.Printf("[ServeDuelWS] duelデータ取得失敗: %v (userID=%s, duelId=%s)", err, userID, duelID)
		client.send <- &Message{
			Type:    "error",
			UserID:  userID,
			Content: map[string]string{"message": "対戦データが見つかりません"},
		}
	} else {
		client.send <- &Message{
			Type:    "duelData",
			UserID:  userID,
			Content: duel,
		}
	}

	// クライアントの読み書きgoroutineを起動
	go client.writePump()
	go client.readPump()

	return nil
}
