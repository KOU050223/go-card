# backend/Dockerfile
# ビルドステージ
FROM golang:1.22-alpine AS builder

WORKDIR /app

# 依存関係のコピーとダウンロード
COPY go.mod go.sum ./
RUN go mod download

# ソースコードのコピー
COPY . .

# アプリケーションのビルド
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# 実行ステージ
FROM gcr.io/distroless/static:nonroot

WORKDIR /app

# ビルドステージからバイナリをコピー
COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations

# 非rootユーザーで実行
USER nonroot:nonroot

# ポート公開
EXPOSE 8080

# アプリケーション実行
CMD ["/app/server"]