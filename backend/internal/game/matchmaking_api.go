// backend/internal/game/matchmaking_api.go
package game

import (
	"net/http"

	"github.com/KOU050223/go-card/internal/db"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type MatchmakingAPI struct {
	Repo *db.MatchmakingRepository
}

func NewMatchmakingAPI(repo *db.MatchmakingRepository) *MatchmakingAPI {
	return &MatchmakingAPI{Repo: repo}
}

// POST /api/matchmaking/join
func (api *MatchmakingAPI) Join(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("uid").(string)

	// 既にwaitingの他ユーザーがいればマッチング成立
	other, err := api.Repo.FindWaitingExcept(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "DB検索エラー")
	}
	if other != nil {
		duelID := uuid.New().String()
		err = api.Repo.UpdateMatched(ctx, userID, other.UserID, duelID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "マッチング更新エラー")
		}
		return c.JSON(http.StatusOK, map[string]interface{}{"status": "matched", "duelId": duelID})
	}
	// 自分をwaitingで登録
	err = api.Repo.InsertWaiting(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "マッチング登録エラー")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"status": "waiting"})
}

// POST /api/matchmaking/cancel
func (api *MatchmakingAPI) Cancel(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("uid").(string)
	err := api.Repo.Cancel(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "キャンセル失敗")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"status": "cancelled"})
}

// GET /api/matchmaking/status
func (api *MatchmakingAPI) Status(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("uid").(string)
	entry, err := api.Repo.GetByUserID(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "状態取得失敗")
	}
	if entry == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{"status": "none"})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"status": entry.Status, "duelId": entry.DuelID.String})
}
