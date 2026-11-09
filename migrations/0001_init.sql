CREATE TABLE IF NOT EXISTS scores (run_id TEXT PRIMARY KEY, name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE, score REAL NOT NULL, fp_all REAL NOT NULL, phase INTEGER NOT NULL, playtime INTEGER NOT NULL, ip_hash TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores (score DESC, fp_all DESC);
CREATE INDEX IF NOT EXISTS idx_scores_updated ON scores (updated_at);
CREATE INDEX IF NOT EXISTS idx_scores_ip ON scores (ip_hash, updated_at);
