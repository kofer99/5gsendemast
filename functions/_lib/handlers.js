// Logik der Bestenlisten-API, unabhängig vom Speicher (siehe store.js).
// Läuft in Cloudflare Workers und – für Tests – im Browser. Nur Web-Standard-APIs (Request, Response, crypto.subtle).
import {
  checkEntry, RUN_ID_RE, RATE_LIMIT_SEC, NEW_ENTRIES_PER_DAY, TOP_N, WEEK_SEC,
} from '../../assets/js/data/leaderboard-rules.js';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...headers } });
}

/**
 * IP-Prüfsumme: SHA-256(IP + Tagesdatum + geheimes Salz), gekürzt. Die IP selbst wird nie gespeichert.
 * Durch das Tagesdatum lassen sich Einträge verschiedener Tage nicht verknüpfen.
 */
export async function ipHash(ip, salt, now) {
  const day = new Date(now * 1000).toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${ip || 'unbekannt'}|${day}|${salt || 'bitte-IP_SALT-setzen'}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const clientIp = (request) => request.headers.get('cf-connecting-ip') || '';
const nowSec = () => Math.floor(Date.now() / 1000);

/** GET /api/leaderboard?range=week|all */
export async function getLeaderboard({ request, store, now = nowSec() }) {
  const url = new URL(request.url);
  const range = url.searchParams.get('range') === 'week' ? 'week' : 'all';
  const since = range === 'week' ? now - WEEK_SEC : 0;
  const [entries, total] = await Promise.all([store.top(since, TOP_N), store.count(since)]);
  return json(
    { range, total, entries: entries.map((e, i) => ({ rank: i + 1, ...e })) },
    200,
    { 'cache-control': 'public, max-age=30' },
  );
}

/** POST /api/score – Eintrag anlegen oder verbessern. */
export async function postScore({ request, store, salt, now = nowSec() }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid', reason: 'Kein gültiges JSON.' }, 400); }
  const check = checkEntry(body);
  if (!check.ok) return json({ error: check.field === 'name' ? 'name' : 'invalid', field: check.field, reason: check.reason }, 400);
  const e = check.entry;
  const ip = await ipHash(clientIp(request), salt, now);

  const last = await store.lastSubmitByIp(ip);
  if (last != null && now - last < RATE_LIMIT_SEC) {
    return json({ error: 'rate', reason: 'Bitte höchstens eine Meldung pro Minute.', retryAfter: RATE_LIMIT_SEC - (now - last) }, 429);
  }
  const owner = await store.ownerOfName(e.nameKey);
  if (owner && owner !== e.runId) return json({ error: 'taken', reason: 'Dieser Name ist schon vergeben.' }, 409);
  const existing = await store.get(e.runId);
  if (!existing && (await store.newEntriesByIp(ip, now - 86400)) >= NEW_ENTRIES_PER_DAY) {
    return json({ error: 'rate', reason: 'Zu viele neue Einträge von diesem Anschluss. Bitte morgen wieder.' }, 429);
  }
  await store.upsert(e, ip, now);
  const saved = await store.get(e.runId);
  const [rankAll, rankWeek] = await Promise.all([store.rank(saved, 0), store.rank(saved, now - WEEK_SEC)]);
  return json({ ok: true, rank: rankAll, rankWeek, score: saved.score, name: saved.name });
}

/** DELETE /api/score – eigenen Eintrag löschen (Recht auf Löschung). Body: { runId } */
export async function deleteScore({ request, store }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  if (typeof body?.runId !== 'string' || !RUN_ID_RE.test(body.runId)) return json({ error: 'invalid' }, 400);
  await store.remove(body.runId);
  return json({ ok: true });
}
