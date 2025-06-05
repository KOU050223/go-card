// backend/internal/db/mysql.go
package db

import (
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

// NewMySQL はMySQLデータベースへの接続を作成します
func NewMySQL(user, password, instanceConnectionName, dbName string) (*sqlx.DB, error) {
	var dsn string

	// 環境変数によってローカル開発とCloud SQLを切り替え
	if os.Getenv("DB_LOCAL") == "true" || instanceConnectionName == "" {
		// ローカル開発用TCP接続
		host := os.Getenv("DB_HOST")
		if host == "" {
			host = "localhost"
		}
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "3306"
		}
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
			user, password, host, port, dbName)
	} else {
		// Cloud SQL Unix socket DSN
		dsn = fmt.Sprintf("%s:%s@unix(/cloudsql/%s)/%s?parseTime=true",
			user, password, instanceConnectionName, dbName)
	}

	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("MySQL接続エラー: %w", err)
	}

	// 接続プール設定
	db.SetMaxIdleConns(5)
	db.SetMaxOpenConns(10)

	return db, nil
}
