// backend/internal/ws/hub.go
package ws

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/KOU050223/go-card/internal/game"
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

	// ゲームサービス
	matchmakingService *game.MatchmakingService
	duelService        *game.DuelService
}

// Message はクライアント間で送受信されるメッセージを表します
type Message struct {
	Type    string      `json:"type"`
	UserID  string      `json:"userId,omitempty"`
	Content interface{} `json:"content,omitempty"`
}

// NewHub は新しいHub構造体を作成します
func NewHub() *Hub {
	hub := &Hub{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message),
	}

	// ゲームサービスを初期化
	hub.matchmakingService = game.NewMatchmakingService()
	hub.duelService = game.NewDuelService()

	// マッチング完了時のコールバックを設定
	hub.matchmakingService.SetMatchCallback(hub.onMatchFound)

	// 定期的なクリーンアップタスクを開始
	go hub.startCleanupTask()

	return hub
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
				oldClient.closeSend()
				delete(h.clients, client.userID)
			}

			// サービスへの参照を設定
			client.matchmakingService = h.matchmakingService
			client.duelService = h.duelService

			h.clients[client.userID] = client
			h.mu.Unlock()
			log.Printf("ユーザー %s が接続しました。接続数: %d", client.userID, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, exists := h.clients[client.userID]; exists {
				// マッチメイキングからも削除
				if h.matchmakingService != nil {
					h.matchmakingService.CancelMatch(client.userID)
				}

				client.closeSend()
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
					client.closeSend()
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

// onMatchFound はマッチング完了時に呼ばれるコールバック関数です
func (h *Hub) onMatchFound(roomID string, players []game.MatchmakingRequest) {
	log.Printf("マッチング完了コールバック: ルーム %s", roomID)

	// 対戦を作成
	duelID, err := h.duelService.CreateDuel(players[0].UserID, players[1].UserID)
	if err != nil {
		log.Printf("対戦作成エラー: %v", err)
		return
	}

	// マッチしたプレイヤーにゲーム開始を通知
	gameStartMessage := &Message{
		Type: "gameStart",
		Content: map[string]interface{}{
			"roomId":  roomID,
			"duelId":  duelID,
			"players": players,
			"message": "ゲームが開始されました",
		},
	}

	for _, player := range players {
		err := h.SendToUser(player.UserID, gameStartMessage)
		if err != nil {
			log.Printf("ゲーム開始通知エラー (ユーザー: %s): %v", player.UserID, err)
		}
	}

	// ルームのゲームを開始状態にする
	err = h.matchmakingService.StartGame(roomID)
	if err != nil {
		log.Printf("ルームゲーム開始エラー: %v", err)
	}
}

// startCleanupTask は定期的なクリーンアップタスクを開始します
func (h *Hub) startCleanupTask() {
	ticker := time.NewTicker(30 * time.Second) // 30秒ごとにクリーンアップ
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if h.matchmakingService != nil {
				h.matchmakingService.CleanupExpiredRooms(5 * time.Minute) // 5分以上古いルームを削除
			}
		}
	}
}

// GetDuelService returns the duel service managed by the hub.
func (h *Hub) GetDuelService() *game.DuelService {
	return h.duelService
}
