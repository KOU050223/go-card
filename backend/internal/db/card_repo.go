// backend/internal/db/card_repo.go
package db

import (
	"context"

	"github.com/KOU050223/go-card/internal/model"
	"github.com/jmoiron/sqlx"
)

type CardRepository struct {
	db *sqlx.DB
}

func NewCardRepository(db *sqlx.DB) *CardRepository { return &CardRepository{db: db} }

func (r *CardRepository) GetAll(ctx context.Context) ([]model.Card, error) {
	var cards []model.Card
	err := r.db.SelectContext(ctx, &cards,
		`SELECT id, name, attack_pts, defense_pts FROM cards`)
	return cards, err
}

func (r *CardRepository) GetByIDs(ctx context.Context, ids []int) ([]model.Card, error) {
	query, args, _ := sqlx.In(
		`SELECT id, name, attack_pts, defense_pts FROM cards WHERE id IN (?)`, ids)

	query = r.db.Rebind(query)

	var cards []model.Card
	if err := r.db.SelectContext(ctx, &cards, query, args...); err != nil {
		return nil, err
	}
	return cards, nil
}
