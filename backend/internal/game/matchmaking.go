// backend/internal/game/matchmaking.go
package game

import (
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

// MatchmakingRequest はマッチメイキングリクエストを表します
type MatchmakingRequest struct {
	UserID    string    `json:"userId"`
	Timestamp time.Time `json:"timestamp"`
}

// Room はゲームルームを表します
type Room struct {
	ID        string               `json:"id"`
	Players   []MatchmakingRequest `json:"players"`
	Status    string               `json:"status"` // "waiting", "ready", "active"
	CreatedAt time.Time            `json:"createdAt"`
	UpdatedAt time.Time            `json:"updatedAt"`
}

// MatchmakingService はマッチメイキングを管理します
type MatchmakingService struct {
	waitingQueue []MatchmakingRequest
	rooms        map[string]*Room
	userToRoom   map[string]string // userID -> roomID のマッピング
	mu           sync.RWMutex
	onMatch      func(roomID string, players []MatchmakingRequest) // マッチング完了時のコールバック
}

// NewMatchmakingService は新しいマッチメイキングサービスを作成します
func NewMatchmakingService() *MatchmakingService {
	return &MatchmakingService{
		waitingQueue: make([]MatchmakingRequest, 0),
		rooms:        make(map[string]*Room),
		userToRoom:   make(map[string]string),
	}
}

// SetMatchCallback はマッチング完了時のコールバックを設定します
func (ms *MatchmakingService) SetMatchCallback(callback func(roomID string, players []MatchmakingRequest)) {
	ms.onMatch = callback
}

// FindMatch はプレイヤーをマッチメイキングキューに追加します
func (ms *MatchmakingService) FindMatch(userID string) (*Room, error) {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	// 既にキューやルームにいるかチェック
	if roomID, exists := ms.userToRoom[userID]; exists {
		if room, ok := ms.rooms[roomID]; ok {
			return room, nil
		}
		// ルームが存在しない場合はマッピングを削除
		delete(ms.userToRoom, userID)
	}

	// キューに既にいるかチェック
	for _, req := range ms.waitingQueue {
		if req.UserID == userID {
			return nil, errors.New("already in matchmaking queue")
		}
	}

	// 新しいリクエストを作成
	request := MatchmakingRequest{
		UserID:    userID,
		Timestamp: time.Now(),
	}

	// キューに追加
	ms.waitingQueue = append(ms.waitingQueue, request)
	log.Printf("ユーザー %s をマッチメイキングキューに追加しました。キュー内人数: %d", userID, len(ms.waitingQueue))

	// マッチング処理
	room := ms.tryMatch()
	if room != nil {
		return room, nil
	}

	// まだマッチしていない場合は待機ルームを作成
	waitingRoom := ms.createWaitingRoom(request)
	return waitingRoom, nil
}

// tryMatch はマッチングを試行します
func (ms *MatchmakingService) tryMatch() *Room {
	if len(ms.waitingQueue) < 2 {
		return nil
	}

	// 最初の2人をマッチング
	player1 := ms.waitingQueue[0]
	player2 := ms.waitingQueue[1]

	// キューから削除
	ms.waitingQueue = ms.waitingQueue[2:]

	// ルーム作成
	roomID := uuid.New().String()
	room := &Room{
		ID:        roomID,
		Players:   []MatchmakingRequest{player1, player2},
		Status:    "ready",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	ms.rooms[roomID] = room
	ms.userToRoom[player1.UserID] = roomID
	ms.userToRoom[player2.UserID] = roomID

	log.Printf("マッチング成功: ルーム %s でプレイヤー %s と %s", roomID, player1.UserID, player2.UserID)

	// コールバック実行
	if ms.onMatch != nil {
		go ms.onMatch(roomID, []MatchmakingRequest{player1, player2})
	}

	return room
}

// createWaitingRoom は待機ルームを作成します
func (ms *MatchmakingService) createWaitingRoom(request MatchmakingRequest) *Room {
	roomID := uuid.New().String()
	room := &Room{
		ID:        roomID,
		Players:   []MatchmakingRequest{request},
		Status:    "waiting",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	ms.rooms[roomID] = room
	ms.userToRoom[request.UserID] = roomID

	log.Printf("待機ルーム %s を作成しました (プレイヤー: %s)", roomID, request.UserID)
	return room
}

// CancelMatch はマッチメイキングをキャンセルします
func (ms *MatchmakingService) CancelMatch(userID string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	// キューから削除
	for i, req := range ms.waitingQueue {
		if req.UserID == userID {
			ms.waitingQueue = append(ms.waitingQueue[:i], ms.waitingQueue[i+1:]...)
			log.Printf("ユーザー %s をマッチメイキングキューから削除しました", userID)
			return nil
		}
	}

	// ルームから削除
	if roomID, exists := ms.userToRoom[userID]; exists {
		room := ms.rooms[roomID]
		if room != nil && room.Status == "waiting" {
			delete(ms.rooms, roomID)
			delete(ms.userToRoom, userID)
			log.Printf("待機ルーム %s を削除しました (プレイヤー: %s)", roomID, userID)
			return nil
		}
		return errors.New("cannot cancel: game already started")
	}

	return errors.New("user not in queue or room")
}

// GetRoom はルーム情報を取得します
func (ms *MatchmakingService) GetRoom(roomID string) (*Room, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	room, exists := ms.rooms[roomID]
	if !exists {
		return nil, errors.New("room not found")
	}

	return room, nil
}

// GetUserRoom はユーザーが所属するルームを取得します
func (ms *MatchmakingService) GetUserRoom(userID string) (*Room, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	roomID, exists := ms.userToRoom[userID]
	if !exists {
		return nil, errors.New("user not in any room")
	}

	room, exists := ms.rooms[roomID]
	if !exists {
		// 無効なマッピングを削除
		delete(ms.userToRoom, userID)
		return nil, errors.New("room not found")
	}

	return room, nil
}

// StartGame はルームのゲームを開始します
func (ms *MatchmakingService) StartGame(roomID string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	room, exists := ms.rooms[roomID]
	if !exists {
		return errors.New("room not found")
	}

	if len(room.Players) != 2 {
		return errors.New("room must have exactly 2 players")
	}

	if room.Status != "ready" {
		return fmt.Errorf("room status must be 'ready', current: %s", room.Status)
	}

	room.Status = "active"
	room.UpdatedAt = time.Now()

	log.Printf("ルーム %s のゲームを開始しました", roomID)
	return nil
}

// CleanupExpiredRooms は期限切れのルームをクリーンアップします
func (ms *MatchmakingService) CleanupExpiredRooms(maxAge time.Duration) {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	now := time.Now()
	toDelete := make([]string, 0)

	for roomID, room := range ms.rooms {
		if now.Sub(room.CreatedAt) > maxAge && room.Status == "waiting" {
			toDelete = append(toDelete, roomID)
		}
	}

	for _, roomID := range toDelete {
		room := ms.rooms[roomID]
		for _, player := range room.Players {
			delete(ms.userToRoom, player.UserID)
		}
		delete(ms.rooms, roomID)
		log.Printf("期限切れルーム %s を削除しました", roomID)
	}
}

// GetQueueStatus はキューの状態を取得します
func (ms *MatchmakingService) GetQueueStatus() map[string]interface{} {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	return map[string]interface{}{
		"queueSize":    len(ms.waitingQueue),
		"totalRooms":   len(ms.rooms),
		"activeRooms":  ms.countRoomsByStatus("active"),
		"waitingRooms": ms.countRoomsByStatus("waiting"),
	}
}

// countRoomsByStatus は指定されたステータスのルーム数をカウントします
func (ms *MatchmakingService) countRoomsByStatus(status string) int {
	count := 0
	for _, room := range ms.rooms {
		if room.Status == status {
			count++
		}
	}
	return count
}
