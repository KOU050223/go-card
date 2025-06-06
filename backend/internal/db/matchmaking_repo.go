// backend/internal/db/matchmaking_repo.go
package db

import (
	"context"
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"
)

type MatchmakingStatus string

const (
	StatusWaiting   MatchmakingStatus = "waiting"
	StatusMatched   MatchmakingStatus = "matched"
	StatusCancelled MatchmakingStatus = "cancelled"
)

type MatchmakingEntry struct {
	ID        int64             `db:"id"`
	UserID    string            `db:"user_id"`
	Status    MatchmakingStatus `db:"status"`
	DuelID    sql.NullString    `db:"duel_id"`
	CreatedAt time.Time         `db:"created_at"`
	UpdatedAt time.Time         `db:"updated_at"`
}

type MatchmakingRepository struct {
	db *sqlx.DB
}

func NewMatchmakingRepository(db *sqlx.DB) *MatchmakingRepository {
	return &MatchmakingRepository{db: db}
}

func (r *MatchmakingRepository) InsertWaiting(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx, `INSERT INTO matchmaking (user_id, status) VALUES (?, ?)`, userID, StatusWaiting)
	return err
}

func (r *MatchmakingRepository) FindWaitingExcept(ctx context.Context, exceptUserID string) (*MatchmakingEntry, error) {
	var entry MatchmakingEntry
	err := r.db.GetContext(ctx, &entry, `SELECT * FROM matchmaking WHERE status = ? AND user_id != ? ORDER BY created_at ASC LIMIT 1`, StatusWaiting, exceptUserID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &entry, err
}

func (r *MatchmakingRepository) UpdateMatched(ctx context.Context, userID1, userID2, duelID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE matchmaking SET status = ?, duel_id = ? WHERE user_id IN (?, ?)`, StatusMatched, duelID, userID1, userID2)
	return err
}

func (r *MatchmakingRepository) GetByUserID(ctx context.Context, userID string) (*MatchmakingEntry, error) {
	var entry MatchmakingEntry
	err := r.db.GetContext(ctx, &entry, `SELECT * FROM matchmaking WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`, userID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &entry, err
}

func (r *MatchmakingRepository) Cancel(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE matchmaking SET status = ? WHERE user_id = ?`, StatusCancelled, userID)
	return err
}
