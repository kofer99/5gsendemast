// Regeln der Bestenliste (DESIGN.md §5). Wird vom Browser UND von den Cloudflare Pages Functions importiert,
// deshalb ohne DOM, ohne weitere Imports und ohne Cloudflare-APIs.

// Einwohner je Phase (= kontrollierbar am Ende der Phase). Ein Unit-Test prüft sie gegen data/phases.js.
export const PHASE_TOTALS = { 1: 84600000, 2: 747904854, 3: 7678414896.3, 4: 102678414903.3, 5: 1504702678414903.2 };
export const PHASE_NAMES = { 1: 'Deutschland', 2: 'Europa', 3: 'Welt', 4: 'Orbit & Mond', 5: 'Universum' };

// Mindest-Spielzeit (Sekunden), um eine Phase zu erreichen. Großzügig: etwa ein Drittel
// des schnellsten simulierten Durchlaufs (tests/sim.html, alles angeklickt). Spielzeit zählt über Prestige weiter.
export const MIN_PLAYTIME = { 1: 0, 2: 20 * 60, 3: 40 * 60, 4: 60 * 60, 5: 75 * 60 };
export const MIN_PLAYTIME_UNIVERSE = 90 * 60;

export const MAX_FP_ALL = 1e22;           // weit über allem, was Simulationen mit vielen Neustarts erreichen
export const MAX_PLAYTIME = 10 * 365 * 86400;
export const NAME_RE = /^[A-Za-z0-9ÄÖÜäöüß_-]{3,16}$/;
export const RUN_ID_RE = /^[0-9a-f]{24}$/;

// Gesperrte Namensbestandteile. Geprüft wird kleingeschrieben, ohne - und _, mit Zahlen als Buchstaben (0→o, 1→i …).
// Bewusst kurz gehalten; bei Bedarf ergänzen. Löschen geht immer per `wrangler d1 execute`.
const BLOCK = [
  'arsch', 'fick', 'fotze', 'hure', 'wichs', 'schlampe', 'spast', 'schwuchtel', 'neger', 'nigg', 'kanake', 'zigeuner',
  'nazi', 'hitler', 'heilh', 'siegheil', 'nsdap', 'holocaust', 'auschwitz', 'kkk',
  'fuck', 'shit', 'cunt', 'bitch', 'whore', 'rape', 'vergewalt', 'porn', 'penis', 'vagina', 'pimmel', 'muschi',
];
// Namen, die nach offizieller Stelle aussehen
const RESERVED = ['admin', 'moderator', 'mod', 'support', 'system', 'bafg', 'praesident', 'präsident', 'presse', '5gsendemast', 'sendemast'];

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b' };

/** Schlüssel für die Eindeutigkeit (Groß/Klein egal). */
export function nameKey(name) {
  return String(name).toLowerCase();
}

/** { ok: true } oder { ok: false, reason } – reason ist ein deutscher Text für die Anzeige. */
export function checkName(name) {
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    return { ok: false, reason: '3 bis 16 Zeichen: Buchstaben, Ziffern, - und _.' };
  }
  const plain = nameKey(name).replace(/[-_]/g, '');
  const unleet = plain.replace(/[0134578]/g, (d) => LEET[d]);
  if (RESERVED.includes(plain) || RESERVED.includes(unleet)) return { ok: false, reason: 'Dieser Name ist für die Behördenleitung reserviert.' };
  if (BLOCK.some((w) => plain.includes(w) || unleet.includes(w))) return { ok: false, reason: 'Dieser Name wurde von der Poststelle abgelehnt.' };
  return { ok: true };
}

/**
 * Prüft einen Eintrag auf Form und Plausibilität.
 * body: { name, runId, score, fpAll, phase, playtime }
 * Ergebnis: { ok: true, entry } oder { ok: false, reason, field }
 */
export function checkEntry(body) {
  if (!body || typeof body !== 'object') return { ok: false, field: 'body', reason: 'Ungültige Anfrage.' };
  const name = checkName(body.name);
  if (!name.ok) return { ok: false, field: 'name', reason: name.reason };
  if (typeof body.runId !== 'string' || !RUN_ID_RE.test(body.runId)) return { ok: false, field: 'runId', reason: 'Ungültige Einsatz-ID.' };
  const phase = body.phase;
  if (!Number.isInteger(phase) || phase < 1 || phase > 5) return { ok: false, field: 'phase', reason: 'Ungültige Phase.' };
  const { score, fpAll, playtime } = body;
  if (!Number.isFinite(score) || score < 0) return { ok: false, field: 'score', reason: 'Ungültiger Wert.' };
  if (!Number.isFinite(fpAll) || fpAll < 0 || fpAll > MAX_FP_ALL) return { ok: false, field: 'fpAll', reason: 'Ungültige Funkpunkte.' };
  if (!Number.isFinite(playtime) || playtime < 0 || playtime > MAX_PLAYTIME) return { ok: false, field: 'playtime', reason: 'Ungültige Spielzeit.' };
  // Plausibilität: Wert passt zur Phase, Phase passt zur Spielzeit.
  if (score > PHASE_TOTALS[phase] * 1.000001) return { ok: false, field: 'score', reason: 'Mehr kontrolliert, als es gibt.' };
  if (phase > 1 && score < PHASE_TOTALS[phase - 1] * 0.999) return { ok: false, field: 'score', reason: 'Wert passt nicht zur Phase.' };
  if (playtime < MIN_PLAYTIME[phase]) return { ok: false, field: 'playtime', reason: 'Zu schnell für diese Phase.' };
  if (phase === 5 && score >= PHASE_TOTALS[5] * 0.999999 && playtime < MIN_PLAYTIME_UNIVERSE) {
    return { ok: false, field: 'playtime', reason: 'Zu schnell für das Universum.' };
  }
  return {
    ok: true,
    entry: { name: body.name, nameKey: nameKey(body.name), runId: body.runId, score, fpAll, phase, playtime: Math.floor(playtime) },
  };
}

/** Werte, die der Browser aus dem Spielstand meldet. */
export function entryFromState(s, name) {
  return {
    name,
    runId: s.runId,
    score: Math.floor(s.bestControlledAll || 0),
    fpAll: Math.floor(s.fpAll || 0),
    phase: Math.max(1, Math.min(5, s.phaseReached || s.phase || 1)),
    playtime: Math.floor(s.playtime || 0),
  };
}

export const RATE_LIMIT_SEC = 60;       // höchstens eine Meldung pro Minute je IP-Prüfsumme
export const NEW_ENTRIES_PER_DAY = 5;   // höchstens 5 neue Einträge pro Tag je IP-Prüfsumme
export const TOP_N = 100;
export const WEEK_SEC = 7 * 86400;
