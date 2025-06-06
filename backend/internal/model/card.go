// internal/model/card.go
package model

type Card struct {
	ID         int    `db:"id"   json:"id"`
	Name       string `db:"name" json:"name"`
	AttackPts  int    `db:"attack_pts"  json:"attackPts"`
	DefensePts int    `db:"defense_pts" json:"defensePts"`
}
