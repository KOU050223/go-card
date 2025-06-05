// backend/internal/ws/hub.go
package ws

import (
	"fmt"
	"log"
	"sync"
)

// Hub はWebSocketクライアントを管理します
type Hub struct {
	// 接続中のクライアントマップ（userID -> client）
	clients map[string]*Client

	// クライアントの登録用チャネル
	register chan *Client

	// クライアントの登録解除用チャネル
	unregister chan *Client

	// ブロードキャストメッセージチャネル
	broadcast chan *Message

	// マップの同時アクセス防止用ミューテックス
	mu sync.RWMutex
}

// Message はクライアント間で送受信されるメッセージを表します
type Message struct {
	Type    string      `json:"type"`
	UserID  string      `json:"userId,omitempty"`
	Content interface{} `json:"content,omitempty"`
}

// NewHub は新しいHub構造体を作成します
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message),
	}
}

// Run はHubのメインループを開始します
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			// 既存の接続があれば切断
			if oldClient, exists := h.clients[client.userID]; exists {
				log.Printf("ユーザー %s の既存接続を切断します", client.userID)
				close(oldClient.send)
				delete(h.clients, client.userID)
			}
			h.clients[client.userID] = client
			h.mu.Unlock()
			log.Printf("ユーザー %s が接続しました。接続数: %d", client.userID, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, exists := h.clients[client.userID]; exists {
				close(client.send)
				delete(h.clients, client.userID)
				log.Printf("ユーザー %s が切断しました。接続数: %d", client.userID, len(h.clients))
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			log.Printf("ブロードキャスト: %v", message.Type)
			h.mu.RLock()
			for userID, client := range h.clients {
				select {
				case client.send <- message:
					// メッセージが送信キューに追加された
				default:
					// クライアント送信バッファが一杯
					close(client.send)
					delete(h.clients, userID)
					log.Printf("ユーザー %s への送信に失敗しました", userID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// SendToUser は特定のユーザーにメッセージを送信します
func (h *Hub) SendToUser(userID string, message *Message) error {
	h.mu.RLock()
	client, exists := h.clients[userID]
	h.mu.RUnlock()

	if !exists {
		return fmt.Errorf("ユーザー %s は接続していません", userID)
	}

	select {
	case client.send <- message:
		return nil
	default:
		return fmt.Errorf("ユーザー %s への送信バッファが一杯です", userID)
	}
}

// BroadcastMessage はすべてのクライアントにメッセージを送信します
func (h *Hub) BroadcastMessage(message *Message) {
	h.broadcast <- message
}
