// Spielstand: anlegen, speichern, laden, exportieren.
export const SAVE_KEY = 'sendemast.save';
export const SAVE_VERSION = 2;

function randomId() {
  const a = new Uint8Array(12);
  (globalThis.crypto || {}).getRandomValues?.(a);
  return Array.from(a, (x) => x.toString(16).padStart(2, '0')).join('');
}

export function newState(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    runId: randomId(),
    startedAt: now,
    lastTick: now,
    playtime: 0,
    fp: 0,          // aktuelles Guthaben
    fpRun: 0,       // in diesem Durchlauf verdient
    fpAll: 0,       // insgesamt verdient (über Prestige hinweg)
    clicks: 0,
    clickFp: 0,
    owned: {},      // { mast: 12, ... }
    placed: {},     // { mast: { BY: 3, NW: 9 } } – nur lokale Anlagen
    hand: [],       // gekaufte, noch nicht platzierte Anlagen
    markers: [],    // { b, s, x, y } – nur für die Darstellung
    manualPlaced: 0,
    upgrades: [],
    achievements: [],
    taken: [],      // übernommene Regionen (alle Phasen)
    phase: 1,       // aktuelle Eskalationsphase (1 Deutschland … 5 Universum)
    phaseReached: 1,// höchste je erreichte Phase (über Prestige hinweg, für Statistik)
    universeDone: false, // jemals das Universum erobert (bleibt über Prestige)
    universeRun: false,  // in diesem Durchlauf erobert
    tears: 0,       // Aluhut-Tränen insgesamt (Bonus bleibt auch nach dem Ausgeben)
    tearsSpent: 0,
    patents: [],
    prestiges: 0,
    bestControlledAll: 0,
    bestControlled: 0,
    aluhutConverted: 0,
    demosDissolved: 0,  // vollständig aufgelöste Aluhut-Demos
    truppsCaught: 0,    // gefangene Wünschelruten-Trupps
    goldenClicked: 0,
    funklochSeen: 0,
    offlineReturns: 0,
    buffs: [],      // { id, until, mult?, clickMult? }
    germanyDone: false,
    introSeen: false,
    settings: { autoPlace: false, buyAmount: 1 },
    nickname: '',
    test: false,    // von einer Testseite erzeugt (tests/seed.html, e2e) → nie in die Bestenliste
  };
}

/** Füllt fehlende Felder auf und migriert alte Versionen. */
export function normalize(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object') throw new Error('Kein gültiger Spielstand');
  const base = newState(now);
  const s = { ...base, ...raw, settings: { ...base.settings, ...(raw.settings || {}) } };
  for (const key of ['owned', 'placed']) if (typeof s[key] !== 'object' || !s[key]) s[key] = {};
  for (const key of ['hand', 'markers', 'upgrades', 'achievements', 'taken', 'buffs', 'patents']) if (!Array.isArray(s[key])) s[key] = [];
  for (const key of ['fp', 'fpRun', 'fpAll', 'clicks', 'playtime', 'lastTick', 'tears', 'tearsSpent', 'prestiges', 'demosDissolved', 'truppsCaught']) if (!Number.isFinite(s[key])) s[key] = base[key];
  // v1 → v2: Phasen. Alte Masten liegen alle in Phase 1. Der Wechsel nach Europa passiert beim nächsten Tick.
  if (!(s.phase >= 1 && s.phase <= 5)) s.phase = 1;
  s.phase = Math.floor(s.phase);
  if (!(s.phaseReached >= s.phase)) s.phaseReached = s.phase;
  for (const m of s.markers) if (!m.p) m.p = 1;
  // Ältere Stände kennen universeRun nicht: Wer gerade im eroberten Universum steht, soll den Abschlussdialog nicht noch einmal sehen.
  if (typeof s.universeRun !== 'boolean') s.universeRun = !!s.universeDone && s.phase === 5;
  if (!(s.bestControlledAll >= s.bestControlled)) s.bestControlledAll = s.bestControlled || 0;
  s.test = s.test === true;
  s.version = SAVE_VERSION;
  return s;
}

export function serialize(s) {
  return JSON.stringify(s);
}

export function saveState(s, storage = globalThis.localStorage) {
  try {
    storage.setItem(SAVE_KEY, serialize(s));
    return true;
  } catch {
    return false;
  }
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const txt = storage.getItem(SAVE_KEY);
    return txt ? normalize(JSON.parse(txt)) : null;
  } catch {
    return null;
  }
}

export function clearState(storage = globalThis.localStorage) {
  try { storage.removeItem(SAVE_KEY); } catch { /* egal */ }
}

// Export als Base64 (UTF-8-sicher)
export function exportState(s) {
  const bytes = new TextEncoder().encode(serialize(s));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return 'BAfG1:' + btoa(bin);
}

export function importState(text) {
  const t = String(text).trim().replace(/^BAfG1:/, '');
  const bin = atob(t);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return normalize(JSON.parse(new TextDecoder().decode(bytes)));
}
