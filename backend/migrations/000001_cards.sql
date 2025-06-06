CREATE TABLE IF NOT EXISTS cards (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(50)  NOT NULL,
  attack_pts  INT          NOT NULL,
  defense_pts INT          NOT NULL,
  mana_cost   INT          NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(64) PRIMARY KEY,   -- Firebase UID
  username   VARCHAR(50) NOT NULL,
  points     INT         DEFAULT 0,
  created_at DATETIME    NOT NULL,
  updated_at DATETIME    NOT NULL
);

CREATE TABLE IF NOT EXISTS user_cards (
  uid      VARCHAR(64) NOT NULL,
  card_id  INT         NOT NULL,
  qty      INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (uid, card_id),
  FOREIGN KEY (uid)     REFERENCES users(id),
  FOREIGN KEY (card_id) REFERENCES cards(id)
);