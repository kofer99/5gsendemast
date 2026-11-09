-- Bestenliste (DESIGN.md §5). Ausführen: wrangler d1 migrations apply sendemast-db --remote
CREATE TABLE IF NOT EXISTS scores (
  run_id      TEXT PRIMARY KEY,        -- zufällige ID je Spielstand (aus dem Save, nie öffentlich angezeigt)
  name        TEXT NOT NULL,           -- Spitzname, wie eingegeben
  name_key    TEXT NOT NULL UNIQUE,    -- Spitzname klein geschrieben (eindeutig)
  score       REAL NOT NULL,           -- höchste Zahl kontrollierter Menschen/Lebewesen
  fp_all      REAL NOT NULL,           -- Funkpunkte insgesamt (bei Gleichstand)
  phase       INTEGER NOT NULL,        -- höchste erreichte Phase (1–5)
  playtime    INTEGER NOT NULL,        -- Spielzeit in Sekunden
  ip_hash     TEXT NOT NULL,           -- SHA-256(IP + Tag + Salz), gekürzt, nie die IP selbst
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores (score DESC, fp_all DESC);
CREATE INDEX IF NOT EXISTS idx_scores_updated ON scores (updated_at);
CREATE INDEX IF NOT EXISTS idx_scores_ip ON scores (ip_hash, updated_at);
