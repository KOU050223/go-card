// backend/internal/ws/client.go
package ws

import (
	"log"
	"sync"
	"time"

	"github.com/KOU050223/go-card/internal/game"
	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = 30 * time.Second

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

// Client はWebSocketクライアント接続を表します
type Client struct {
	hub                *Hub
	conn               *websocket.Conn
	send               chan *Message
	userID             string
	closed             bool
	mu                 sync.Mutex
	matchmakingService *game.MatchmakingService
	duelService        *game.DuelService
}

// closeSend はsendチャネルを安全に閉じます
func (c *Client) closeSend() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.closed {
		close(c.send)
		c.closed = true
	}
}

// isClosed はクライアントが閉じられているかチェックします
func (c *Client) isClosed() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.closed
}

// readPump はクライアントからのメッセージを読み取り、処理します
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var msg Message
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket読み取りエラー (ユーザー: %s): %v", c.userID, err)
			} else {
				log.Printf("WebSocket接続終了 (ユーザー: %s): %v", c.userID, err)
			}
			break
		}

		// メッセージログ
		log.Printf("メッセージ受信 (ユーザー: %s): タイプ=%s", c.userID, msg.Type)

		// 送信者IDを設定
		msg.UserID = c.userID

		// メッセージタイプに応じた処理
		c.handleMessage(&msg)
	}
}

// writePump はクライアントへのメッセージを送信し、pingを定期的に送ります
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hubがチャネルを閉じた
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// JSONエンコード
			err := c.conn.WriteJSON(message)
			if err != nil {
				log.Printf("WebSocket書き込みエラー: %v", err)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage はメッセージタイプに応じた処理を行います
func (c *Client) handleMessage(msg *Message) {
	switch msg.Type {
	case "test":
		log.Printf("テストメッセージ受信 (ユーザー: %s): %v", c.userID, msg.Content)
		// エコーバック
		c.send <- &Message{
			Type:    "testResponse",
			UserID:  c.userID,
			Content: "テストメッセージを受信しました",
		}
	case "findMatch":
		c.handleFindMatch(msg)
	case "cancelMatch":
		c.handleCancelMatch(msg)
	case "gameAction":
		c.handleGameAction(msg)
	case "ping":
		// ping応答
		c.send <- &Message{Type: "pong", UserID: c.userID}
	default:
		log.Printf("未知のメッセージタイプ: %s", msg.Type)
		// デフォルトはブロードキャスト
		c.hub.broadcast <- msg
	}
}

// handleFindMatch はマッチメイキングリクエストを処理します
func (c *Client) handleFindMatch(msg *Message) {
	if c.matchmakingService == nil {
		c.sendError("マッチメイキングサービスが利用できません")
		return
	}

	room, err := c.matchmakingService.FindMatch(c.userID)
	if err != nil {
		log.Printf("マッチメイキングエラー (ユーザー: %s): %v", c.userID, err)
		c.sendError(err.Error())
		return
	}

	// ルーム情報を送信
	c.send <- &Message{
		Type:    "roomJoined",
		UserID:  c.userID,
		Content: room,
	}

	// マッチングが完了した場合（2人揃った場合）は対戦準備
	if room.Status == "ready" || room.Status == "active" {
		log.Printf("[DEBUG] notifyGameReady: room.Status=%s, roomID=%s, players=%v", room.Status, room.ID, room.Players)
		c.notifyGameReady(room)
	}
}

// handleCancelMatch はマッチメイキングキャンセルを処理します
func (c *Client) handleCancelMatch(msg *Message) {
	if c.matchmakingService == nil {
		c.sendError("マッチメイキングサービスが利用できません")
		return
	}

	err := c.matchmakingService.CancelMatch(c.userID)
	if err != nil {
		log.Printf("マッチキャンセルエラー (ユーザー: %s): %v", c.userID, err)
		c.sendError(err.Error())
		return
	}

	c.send <- &Message{
		Type:   "matchCancelled",
		UserID: c.userID,
	}
}

// handleGameAction はゲームアクションを処理します
func (c *Client) handleGameAction(msg *Message) {
	if c.duelService == nil {
		c.sendError("ゲームサービスが利用できません")
		return
	}

	// ゲームアクションの詳細な処理は後で実装
	log.Printf("ゲームアクション受信 (ユーザー: %s): %v", c.userID, msg.Content)

	// 今は単純にブロードキャスト
	c.hub.broadcast <- msg
}

// sendError はエラーメッセージを送信します
func (c *Client) sendError(message string) {
	c.send <- &Message{
		Type:    "error",
		UserID:  c.userID,
		Content: map[string]string{"message": message},
	}
}

// notifyGameReady はゲーム準備完了を通知します
func (c *Client) notifyGameReady(room *game.Room) {
	// 同じルームの全プレイヤーにゲーム開始を通知
	for _, player := range room.Players {
		err := c.hub.SendToUser(player.UserID, &Message{
			Type:    "gameReady",
			UserID:  "",
			Content: room,
		})
		if err != nil {
			log.Printf("ゲーム準備通知エラー (ユーザー: %s): %v", player.UserID, err)
		}
	}
}
