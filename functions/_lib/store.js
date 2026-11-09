// Speicher der Bestenliste. d1Store = Cloudflare D1 (Produktion), memoryStore = Tests.
// Beide haben dieselben Methoden. Zeiten in Sekunden (Unix).

// Die SQL-Texte stehen gesammelt hier, damit tools/check_sql.py sie gegen SQLite prüfen kann.
export const SQL = {
  byRun: 'SELECT run_id, name, name_key, score, fp_all, phase, playtime, ip_hash, created_at, updated_at FROM scores WHERE run_id = ?1',
  byName: 'SELECT run_id FROM scores WHERE name_key = ?1',
  lastByIp: 'SELECT MAX(updated_at) AS t FROM scores WHERE ip_hash = ?1',
  newByIp: 'SELECT COUNT(*) AS n FROM scores WHERE ip_hash = ?1 AND created_at >= ?2',
  upsert: `INSERT INTO scores (run_id, name, name_key, score, fp_all, phase, playtime, ip_hash, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
    ON CONFLICT(run_id) DO UPDATE SET
      name = excluded.name, name_key = excluded.name_key,
      score = MAX(scores.score, excluded.score), fp_all = MAX(scores.fp_all, excluded.fp_all),
      phase = MAX(scores.phase, excluded.phase), playtime = MAX(scores.playtime, excluded.playtime),
      ip_hash = excluded.ip_hash, updated_at = excluded.updated_at`,
  top: `SELECT name, score, fp_all, phase, updated_at FROM scores WHERE updated_at >= ?1
    ORDER BY score DESC, fp_all DESC, created_at ASC LIMIT ?2`,
  rankOf: `SELECT COUNT(*) + 1 AS r FROM scores
    WHERE updated_at >= ?1 AND (score > ?2 OR (score = ?2 AND fp_all > ?3) OR (score = ?2 AND fp_all = ?3 AND created_at < ?4))`,
  remove: 'DELETE FROM scores WHERE run_id = ?1',
  purgeIp: `UPDATE scores SET ip_hash = '' WHERE updated_at < ?1 AND ip_hash != ''`,
  count: 'SELECT COUNT(*) AS n FROM scores WHERE updated_at >= ?1',
};

const row = (r) => r && {
  runId: r.run_id, name: r.name, nameKey: r.name_key, score: r.score, fpAll: r.fp_all, phase: r.phase,
  playtime: r.playtime, ipHash: r.ip_hash, createdAt: r.created_at, updatedAt: r.updated_at,
};

export function d1Store(db) {
  const one = (sql, ...args) => db.prepare(sql).bind(...args).first();
  return {
    async get(runId) { return row(await one(SQL.byRun, runId)); },
    async ownerOfName(key) { return (await one(SQL.byName, key))?.run_id ?? null; },
    async lastSubmitByIp(ipHash) { return (await one(SQL.lastByIp, ipHash))?.t ?? null; },
    async newEntriesByIp(ipHash, since) { return (await one(SQL.newByIp, ipHash, since))?.n ?? 0; },
    async upsert(e, ipHash, now) {
      await db.prepare(SQL.upsert).bind(e.runId, e.name, e.nameKey, e.score, e.fpAll, e.phase, e.playtime, ipHash, now).run();
    },
    async top(since, limit) {
      const { results } = await db.prepare(SQL.top).bind(since, limit).all();
      return results.map((r) => ({ name: r.name, score: r.score, fpAll: r.fp_all, phase: r.phase, updatedAt: r.updated_at }));
    },
    async rank(e, since) { return (await one(SQL.rankOf, since, e.score, e.fpAll, e.createdAt))?.r ?? null; },
    async count(since) { return (await one(SQL.count, since))?.n ?? 0; },
    async remove(runId) { await db.prepare(SQL.remove).bind(runId).run(); },
    async purgeIpHashes(before) { await db.prepare(SQL.purgeIp).bind(before).run(); },
  };
}

/** Gleiches Verhalten im Speicher – für Tests im Browser (tests/tests.js). */
export function memoryStore() {
  const rows = new Map();
  const sorted = (since) => [...rows.values()].filter((r) => r.updatedAt >= since)
    .sort((a, b) => b.score - a.score || b.fpAll - a.fpAll || a.createdAt - b.createdAt);
  return {
    rows,
    async get(runId) { return rows.get(runId) ? { ...rows.get(runId) } : null; },
    async ownerOfName(key) { for (const r of rows.values()) if (r.nameKey === key) return r.runId; return null; },
    async lastSubmitByIp(ipHash) {
      let t = null;
      for (const r of rows.values()) if (r.ipHash === ipHash && (t == null || r.updatedAt > t)) t = r.updatedAt;
      return t;
    },
    async newEntriesByIp(ipHash, since) { return [...rows.values()].filter((r) => r.ipHash === ipHash && r.createdAt >= since).length; },
    async upsert(e, ipHash, now) {
      const old = rows.get(e.runId);
      rows.set(e.runId, old ? {
        ...old, name: e.name, nameKey: e.nameKey, score: Math.max(old.score, e.score), fpAll: Math.max(old.fpAll, e.fpAll),
        phase: Math.max(old.phase, e.phase), playtime: Math.max(old.playtime, e.playtime), ipHash, updatedAt: now,
      } : { ...e, ipHash, createdAt: now, updatedAt: now });
    },
    async top(since, limit) {
      return sorted(since).slice(0, limit).map((r) => ({ name: r.name, score: r.score, fpAll: r.fpAll, phase: r.phase, updatedAt: r.updatedAt }));
    },
    async rank(e, since) { return sorted(since).findIndex((r) => r.runId === e.runId) + 1 || null; },
    async count(since) { return sorted(since).length; },
    async remove(runId) { rows.delete(runId); },
    async purgeIpHashes(before) { for (const r of rows.values()) if (r.updatedAt < before) r.ipHash = ''; },
  };
}
