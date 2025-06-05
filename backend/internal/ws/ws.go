package ws

import (
	"github.com/gorilla/websocket"
	"github.com/jmoiron/sqlx"
)

func handleWS(conn *websocket.Conn, db *sqlx.DB, uid string) error {
	for {
		var msg ClientMessage
		if err := conn.ReadJSON(&msg); err != nil {
			return err
		}
		// 例: 攻撃カードを受信
		//   -> DB から相手 HP を更新
		//   -> 結果を双方に Push
	}
}
