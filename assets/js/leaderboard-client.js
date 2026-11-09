// Bestenliste im Browser: Anmeldung (nur Spitzname, lokal gemerkt), Melden, Laden, Löschen.
// Auf localhost mit ?mock=1 laufen die echten Server-Handler mit einem Speicher im Browser (für Tests und Screenshots).
import { entryFromState } from './data/leaderboard-rules.js';

export const REG_KEY = 'sendemast.lb'; // { name } – nur der Spitzname, sonst nichts
const API = '/api';

export function getRegistration() {
  try { const r = JSON.parse(localStorage.getItem(REG_KEY) || 'null'); return r && typeof r.name === 'string' ? r : null; } catch { return null; }
}
export function setRegistration(name) {
  try { localStorage.setItem(REG_KEY, JSON.stringify({ name })); } catch { /* egal */ }
}
export function clearRegistration() {
  try { localStorage.removeItem(REG_KEY); } catch { /* egal */ }
}

// ---------- Transport ----------
let mock = null;
const useMock = () => (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  && new URLSearchParams(location.search).has('mock');

async function mockFetch(path, init = {}) {
  if (!mock) {
    const [{ memoryStore }, h] = await Promise.all([import('/functions/_lib/store.js'), import('/functions/_lib/handlers.js')]);
    const store = memoryStore();
    const now = Math.floor(Date.now() / 1000);
    // Beispielwerte, damit die Liste nicht leer ist
    const demo = [
      ['Reptilia_88', 1504702678414903, 9e16, 5, 60000, 3 * 86400], ['FunkFrieda', 1504702678414903, 4e15, 5, 40000, 9 * 86400],
      ['Mastmeister', 9.1e10, 3e13, 4, 20000, 86400], ['Tannenbaum', 2.4e9, 2e12, 3, 12000, 2 * 86400],
      ['Bielefelder', 5.1e8, 8e10, 2, 6000, 12 * 86400], ['Oma_Gisela', 4.2e7, 1e9, 1, 2400, 3600],
    ];
    let i = 0;
    for (const [name, score, fpAll, phase, playtime, ago] of demo) {
      await store.upsert({ name, nameKey: name.toLowerCase(), runId: String(++i).padStart(24, 'f'), score, fpAll, phase, playtime }, 'demo' + i, now - ago);
    }
    mock = { store, h };
  }
  const req = new Request(new URL(API + path, location.origin), init);
  const { store, h } = mock;
  if (path.startsWith('/leaderboard')) return h.getLeaderboard({ request: req, store });
  if (init.method === 'DELETE') return h.deleteScore({ request: req, store });
  return h.postScore({ request: req, store, salt: 'mock' });
}

async function call(path, init) {
  const res = useMock() ? await mockFetch(path, init) : await fetch(API + path, init);
  let data = null;
  try { data = await res.json(); } catch { /* keine JSON-Antwort */ }
  return { status: res.status, ok: res.ok, data: data || {} };
}

// ---------- API ----------
export async function fetchBoard(range = 'all') {
  return call(`/leaderboard?range=${range === 'week' ? 'week' : 'all'}`);
}

/** Meldet den Bestwert aus dem Spielstand. */
export async function submit(s, name) {
  return call('/score', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entryFromState(s, name)),
  });
}

export async function removeEntry(runId) {
  return call('/score', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ runId }) });
}

/**
 * Im Spiel: meldet den Bestwert automatisch, aber nur, wenn man sich auf der Bestenlisten-Seite eingetragen hat.
 * Höchstens alle `minGapMs`, Fehler werden still ignoriert. onResult(res) bei Erfolg.
 */
export function autoSubmitter(getState, { minGapMs = 5 * 60_000, onResult } = {}) {
  let last = 0;
  let lastScore = -1;
  return async function maybeSubmit(force = false) {
    const reg = getRegistration();
    if (!reg || !navigator.onLine) return null;
    const s = getState();
    if (s.test) return null; // Test-Spielstand (Seed/e2e) – nie melden
    const now = Date.now();
    if (!force && now - last < minGapMs) return null;
    if (!force && Math.floor(s.bestControlledAll || 0) === lastScore) return null;
    last = now;
    try {
      const res = await submit(s, reg.name);
      if (res.ok) { lastScore = Math.floor(s.bestControlledAll || 0); onResult?.(res.data); }
      // Name vergeben oder ungültig → auf der Bestenlisten-Seite neu eintragen. Andere Fehler (z. B. Plausibilität) ändern nichts.
      if (res.status === 409 || res.data?.error === 'name') clearRegistration();
      return res;
    } catch {
      return null;
    }
  };
}
