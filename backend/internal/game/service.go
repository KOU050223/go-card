// backend/internal/game/service.go
package game

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Card はカードの情報を表します
type Card struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	AttackPts  int    `json:"attackPts"`  // 攻撃力
	DefensePts int    `json:"defensePts"` // 防御力
}

// Player はゲームプレイヤーの情報を表します
type Player struct {
	UserID   string `json:"userId"`
	HP       int    `json:"hp"`
	MaxHP    int    `json:"maxHp"`
	Mana     int    `json:"mana"`
	MaxMana  int    `json:"maxMana"`
	Hand     []Card `json:"hand"`
	DeckSize int    `json:"deckSize"`
	PlayArea []Card `json:"playArea"` // プレイエリアに出ているカード
	// 必要なら防御力・ステータスなども
}

// Duel は対戦情報を表します
type Duel struct {
	ID        string    `json:"id"`
	Players   [2]Player `json:"players"`
	TurnCount int       `json:"turnCount"`
	ActiveIdx int       `json:"activeIdx"` // 手番プレイヤーのインデックス
	Status    string    `json:"status"`    // "waiting", "active", "finished"
	StartedAt time.Time `json:"startedAt"`
}

// GameAction はプレーヤーのアクションを表します
type GameAction struct {
	DuelID     string `json:"duelId"`
	PlayerID   string `json:"playerId"`
	ActionType string `json:"actionType"` // "play_card", "attack", "pass" など
	CardID     int    `json:"cardId,omitempty"`
	TargetID   int    `json:"targetId,omitempty"` // 攻撃対象のカードID
}

// GameError はゲームに関連するエラーを表します
type GameError struct {
	Message string
}

func (e *GameError) Error() string {
	return e.Message
}

// DuelService はゲームの対戦管理を担当します
type DuelService struct {
	duels    map[string]*Duel
	actions  chan GameAction
	cardPool []Card
	mu       sync.RWMutex
}

const (
	startHP    = 30
	startMana  = 1
	startHand  = 3
	maxManaCap = 10
)

// NewDuelService は新しい対戦サービスを作成します
func NewDuelService(cards []Card) *DuelService {
	ds := &DuelService{
		duels:    make(map[string]*Duel),
		actions:  make(chan GameAction, 100),
		cardPool: cards,
	}
	go ds.processActions()
	return ds
}

// processActions はゲームアクションを処理します
func (ds *DuelService) processActions() {
	for action := range ds.actions {
		ds.mu.Lock()
		duel, exists := ds.duels[action.DuelID]
		if !exists {
			ds.mu.Unlock()
			log.Printf("存在しない対戦ID: %s", action.DuelID)
			continue
		}

		// プレイヤーが対戦相手かどうか確認
		playerIdx := -1
		for i, p := range duel.Players {
			if p.UserID == action.PlayerID {
				playerIdx = i
				break
			}
		}

		if playerIdx == -1 {
			ds.mu.Unlock()
			log.Printf("プレイヤーが対戦に参加していません: %s", action.PlayerID)
			continue
		}

		// 自分のターンかどうか確認
		if playerIdx != duel.ActiveIdx {
			ds.mu.Unlock()
			log.Printf("プレイヤーのターンではありません: %s", action.PlayerID)
			continue
		}

		// アクションタイプに応じた処理
		switch action.ActionType {
		case "play_card":
			// カードをプレイするロジック
			// 1. プレイヤーの手札にカードがあるか確認
			// 2. カードをプレイエリアに移動
			// ...

		case "attack":
			// 攻撃ロジック
			// 1. 攻撃カードと対象カードの確認
			// 2. ダメージ計算と適用
			// ...

			// 例：攻撃カードの効果を適用
			ds.applyAttack(duel, playerIdx, action.CardID, action.TargetID)

		case "pass":
			// ターンを終了して次のプレイヤーへ
			duel.ActiveIdx = (duel.ActiveIdx + 1) % 2
			duel.TurnCount++
		}

		// 勝敗確認
		ds.checkGameEnd(duel)

		ds.mu.Unlock()
	}
}

// applyAttack は攻撃カードの効果を適用します
func (ds *DuelService) applyAttack(duel *Duel, attackerIdx, cardID, targetID int) {
	// 攻撃側プレイヤー
	attacker := &duel.Players[attackerIdx]

	// 防御側プレイヤー
	defenderIdx := (attackerIdx + 1) % 2
	defender := &duel.Players[defenderIdx]

	// 攻撃カードを見つける
	var attackCard *Card
	for i := range attacker.PlayArea {
		if attacker.PlayArea[i].ID == cardID {
			attackCard = &attacker.PlayArea[i]
			break
		}
	}

	if attackCard == nil {
		log.Printf("攻撃カードが見つかりません: %d", cardID)
		return
	}

	// 対象カードがある場合（カード対カードの攻撃）
	if targetID > 0 {
		var targetCard *Card
		for i := range defender.PlayArea {
			if defender.PlayArea[i].ID == targetID {
				targetCard = &defender.PlayArea[i]
				break
			}
		}

		if targetCard != nil {
			// カード対カードの戦闘
			damage := attackCard.AttackPts - targetCard.DefensePts
			if damage > 0 {
				// 対象カードを破壊
				// カードをプレイエリアから削除する処理
				// ...

				log.Printf("カード %s が破壊されました", targetCard.Name)
			}
		}
	} else {
		// プレイヤーへの直接攻撃
		defender.HP -= attackCard.AttackPts
		log.Printf("プレイヤー %s に %d ダメージ", defender.UserID, attackCard.AttackPts)
	}
}

// checkGameEnd はゲーム終了条件をチェックします
func (ds *DuelService) checkGameEnd(duel *Duel) {
	for i, player := range duel.Players {
		if player.HP <= 0 {
			duel.Status = "finished"
			log.Printf("ゲーム終了: プレイヤー %s の勝利", duel.Players[(i+1)%2].UserID)
			return
		}
	}

	// ターン数が上限に達した場合も終了
	if duel.TurnCount >= 30 {
		duel.Status = "finished"
		log.Printf("ゲーム終了: ターン制限に達しました")
	}
}

// CreateDuel は新しい対戦を作成します
// CreateDuel creates a new duel and returns its generated ID.
func (ds *DuelService) CreateDuel(player1ID, player2ID string) (string, error) {
	duelID := uuid.New().String()
	if err := ds.CreateDuelWithID(duelID, player1ID, player2ID); err != nil {
		return "", err
	}
	return duelID, nil
}

// 開始手札３枚をランダム抽出
func (s *DuelService) newPlayer(uid string) *Player {
	p := &Player{
		UserID:   uid,
		HP:       startHP,
		MaxHP:    startHP,
		Mana:     startMana,
		MaxMana:  maxManaCap,
		Hand:     make([]Card, 0, startHand),
		PlayArea: make([]Card, 0),
		DeckSize: 30,
	}
	for i := 0; i < startHand && len(s.cardPool) > 0; i++ {
		idx := rand.Intn(len(s.cardPool))
		p.Hand = append(p.Hand, s.cardPool[idx])
	}
	return p
}

// CreateDuelWithID creates a new duel using the provided ID.
func (s *DuelService) CreateDuelWithID(id, p1, p2 string) error {
	duel := &Duel{
		ID:        id,
		Players:   [2]Player{*s.newPlayer(p1), *s.newPlayer(p2)},
		TurnCount: 1,
		ActiveIdx: 0,
		Status:    "active",
	}
	s.mu.Lock()
	s.duels[id] = duel
	s.mu.Unlock()
	return nil
}

// GetDuel は対戦情報を取得します
func (ds *DuelService) GetDuel(duelID string) (*Duel, error) {
	ds.mu.RLock()
	defer ds.mu.RUnlock()

	duel, exists := ds.duels[duelID]
	if !exists {
		return nil, errors.New("対戦が見つかりません")
	}

	return duel, nil
}

// SubmitAction はプレイヤーのアクションを処理します
func (ds *DuelService) SubmitAction(action GameAction) error {
	ds.mu.RLock()
	_, exists := ds.duels[action.DuelID]
	ds.mu.RUnlock()

	if !exists {
		return fmt.Errorf("対戦 %s が見つかりません", action.DuelID)
	}

	// チャネルにアクションを送信（非同期処理）
	ds.actions <- action

	return nil
}
