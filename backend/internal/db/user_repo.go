// backend/internal/db/user_repo.go
package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

// User はユーザー情報を表す構造体です
type User struct {
	ID        string    `db:"id" json:"id"`
	Username  string    `db:"username" json:"username"`
	Points    int       `db:"points" json:"points"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`
}

// UserRepository はユーザーに関連するDB操作を提供します
type UserRepository struct {
	db *sqlx.DB
}

// NewUserRepository は新しいUserRepositoryインスタンスを作成します
func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

// GetByID はユーザーIDに基づいてユーザーを取得します
func (r *UserRepository) GetByID(ctx context.Context, id string) (*User, error) {
	var user User
	query := `SELECT id, username, points, created_at, updated_at FROM users WHERE id = ?`
	err := r.db.GetContext(ctx, &user, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // ユーザーが見つからない場合
		}
		return nil, fmt.Errorf("ユーザー取得エラー: %w", err)
	}
	return &user, nil
}

// Create は新しいユーザーを作成します
func (r *UserRepository) Create(ctx context.Context, user *User) error {
	query := `
        INSERT INTO users (id, username, points, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?)
    `
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	_, err := r.db.ExecContext(ctx, query,
		user.ID, user.Username, user.Points, user.CreatedAt, user.UpdatedAt)
	if err != nil {
		return fmt.Errorf("ユーザー作成エラー: %w", err)
	}
	return nil
}

// Update はユーザー情報を更新します
func (r *UserRepository) Update(ctx context.Context, user *User) error {
	query := `
        UPDATE users 
        SET username = ?, points = ?, updated_at = ?
        WHERE id = ?
    `
	user.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, query,
		user.Username, user.Points, user.UpdatedAt, user.ID)
	if err != nil {
		return fmt.Errorf("ユーザー更新エラー: %w", err)
	}
	return nil
}
