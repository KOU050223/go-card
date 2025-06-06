package db

import (
	"context"
	"time"

	"github.com/jmoiron/sqlx"
)

type DuelEntry struct {
	ID        string    `db:"id"`
	Player1ID string    `db:"player1_id"`
	Player2ID string    `db:"player2_id"`
	Status    string    `db:"status"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

type DuelRepository struct {
	db *sqlx.DB
}

func NewDuelRepository(db *sqlx.DB) *DuelRepository {
	return &DuelRepository{db: db}
}

func (r *DuelRepository) InsertDuel(ctx context.Context, duelID, player1ID, player2ID string) error {
	_, err := r.db.ExecContext(ctx, `INSERT INTO duels (id, player1_id, player2_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`, duelID, player1ID, player2ID, "active")
	return err
}
