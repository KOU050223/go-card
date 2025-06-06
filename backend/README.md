# 環境構築手順 @KOU050223

```
cp .env.example .env
cd backend
migrate -path=./migrations -database="mysql://user:password@tcp(localhost:3306)/dbname" up
```


# パスワードを環境変数からロードする方法
DB_PASS=$(grep DB_PASS .env | cut -d '=' -f2)
migrate -path=./migrations -database="mysql://root:$DB_PASS@tcp(localhost:3306)/go_card_db" up

```
go run cmd/server/main.go cmd/server/config.go
go run ./cmd/server 
```

# DBのリセット・マイグレーション
```
DB_PASS=$(grep DB_PASS .env | cut -d '=' -f2)
migrate -path=./migrations -database="mysql://root:$DB_PASS@tcp(localhost:3306)/go_card_db" down
migrate -path=./migrations -database="mysql://root:$DB_PASS@tcp(localhost:3306)/go_card_db" up
```

```
mysql -u root -p
SHOW TABLES;
USE go_card_db;
SELECT * FROM matchmaking;
```

lsof -ti:8080