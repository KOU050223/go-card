INSERT INTO cards (name, description, attack_pts, defense_pts, image_url) VALUES
-- ──── キャラクター ───────────────────────────────────────────
('main.Gopher',
 'スタンダードなゴーファーくん。何かと頼りになる。',
 3, 2, NULL),

('Goroutine Gopher',
 '並行処理の達人。自ターンに 2 回行動できる。',
 2, 1, NULL),

('Garbage Collector',
 'お掃除担当。毎ターン自分の HP を 1 回復。',
 1, 4, NULL),

('Mutex Master',
 '同期の守護者。1 度だけ受けるダメージを 0 にする。',
 2, 3, NULL),

('Pointer Gopher',
 'ポインタの名手。任意ターゲットを指定して攻撃可能。',
 4, 1, NULL),

('Interface Illusionist',
 '型を偽装する奇術師。場に出たとき別カードに変身。',
 1, 3, NULL),

('Go Vet',
 'コード検査官。相手の隠し効果を無効化する。',
 2, 2, NULL),

-- ──── 魔法（spell 扱い：攻撃/防御 0） ───────────────────────
('panic()',
 '敵全体に 4 ダメージ。ただし自分も 2 ダメージを受ける。',
 0, 0, NULL),

('recover()',
 '自分の HP を全回復。ただし次のターン行動不可。',
 0, 0, NULL),

('defer()',
 '次ターン開始時にカードを 1 枚追加でドローする。',
 0, 0, NULL),

('import \"fireball\"',
 '直ちに 4 ダメージを与える炎の呪文。',
 0, 0, NULL),

('go()',
 'このカードを使用すると即座に追加行動を得る。',
 0, 0, NULL),

('select {}',
 '敵のランダムな行動 1 つを無効化する。',
 0, 0, NULL),

('type assertion',
 '相手ユニット 1 体のステータスを公開する。',
 0, 0, NULL),

-- ──── 装備・補助 ─────────────────────────────────────────
('sync.WaitGroup',
 '味方全員の行動を 1 ターン遅延させ、その後 ATK+1/DEF+1。',
 0, 0, NULL),

('context.WithCancel',
 '敵の継続効果を 1 つ打ち消す。',
 0, 0, NULL);
