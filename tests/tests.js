import { fmt, fmtInt, fmtPct, fmtDuration } from '../assets/js/util/format.js';
import * as eco from '../assets/js/core/economy.js';
import { Game } from '../assets/js/core/game.js';
import { newState, exportState, importState, normalize } from '../assets/js/core/state.js';
import { BUILDING_BY_ID } from '../assets/js/data/buildings.js';
import { STATES, TOTAL_POP } from '../assets/js/data/states.js';
import { UPGRADES } from '../assets/js/data/upgrades.js';
import { MAP_DE } from '../assets/js/data/map-de.js';
import { PHASES, PHASE_BY_ID } from '../assets/js/data/phases.js';
import * as portal from '../assets/js/data/portal.js';
import { ACHIEVEMENT_BY_ID } from '../assets/js/data/achievements.js';
import * as lb from '../assets/js/data/leaderboard-rules.js';
import { memoryStore } from '../functions/_lib/store.js';
import * as api from '../functions/_lib/handlers.js';

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, err: e.message }); }
}
const pending = [];
function atest(name, fn) {
  pending.push(fn().then(() => results.push({ name, ok: true }), (e) => results.push({ name, ok: false, err: e.message })));
}
function eq(a, b, msg = '') { if (a !== b) throw new Error(`${msg} erwartet ${JSON.stringify(b)}, bekommen ${JSON.stringify(a)}`); }
function near(a, b, eps = 1e-6, msg = '') { if (Math.abs(a - b) > eps * Math.max(1, Math.abs(b))) throw new Error(`${msg} erwartet ≈${b}, bekommen ${a}`); }
function ok(c, msg = 'Bedingung falsch') { if (!c) throw new Error(msg); }

function clock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms) => { t += ms; } };
}
function seeded(seed = 42) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}

// ---------- Format ----------
test('fmt kleine Zahlen', () => {
  eq(fmt(0), '0'); eq(fmt(999), '999'); eq(fmt(1234), '1.234'); eq(fmt(999999), '999.999');
  eq(fmt(0.1, { decimals: true }), '0,1'); eq(fmt(12.75, { decimals: true }), '12,7');
});
test('fmt große Zahlen', () => {
  eq(fmt(1e6), '1,00 Mio.'); eq(fmt(12_345_678), '12,3 Mio.'); eq(fmt(999_999_999), '999 Mio.');
  eq(fmt(1e9), '1,00 Mrd.'); eq(fmt(2.5e12), '2,50 Bio.'); eq(fmt(1e15), '1,00 Brd.');
  ok(fmt(1e80).includes('e'), 'wissenschaftlich');
});
test('fmtInt / fmtPct / fmtDuration', () => {
  eq(fmtInt(12483920.7), '12.483.920'); eq(fmtPct(0.149), '14,9 %'); eq(fmtPct(1), '100,0 %');
  eq(fmtDuration(59), '59 Sek.'); eq(fmtDuration(3725), '1 Std. 2 Min.');
});

// ---------- Ökonomie ----------
test('Kosten steigen um 15 %', () => {
  const b = BUILDING_BY_ID.mast;
  eq(eco.buildingCost(b, 0), 15);
  eq(eco.buildingCost(b, 1), Math.ceil(15 * 1.15));
  near(eco.buildingCost(b, 0, 10), Math.ceil(15 * (1.15 ** 10 - 1) / 0.15), 0);
});
test('maxAffordable passt zu buildingCost', () => {
  const b = BUILDING_BY_ID.tanne;
  for (const fp of [0, 99, 100, 1000, 12345, 1e6]) {
    const n = eco.maxAffordable(b, 3, fp);
    ok(eco.buildingCost(b, 3, n) <= fp || n === 0, `n=${n} zu teuer bei ${fp}`);
    ok(eco.buildingCost(b, 3, n + 1) > fp, `n+1 wäre bezahlbar bei ${fp}`);
  }
});
test('Upgrades & Boni multiplizieren', () => {
  const s = newState();
  s.owned.mast = 10;
  near(eco.rawCps(s, eco.modifiers(s)), 1);
  s.upgrades.push('mast_t1');
  near(eco.rawCps(s, eco.modifiers(s)), 2);
  s.taken.push('SL'); s.achievements.push('x');
  near(eco.rawCps(s, eco.modifiers(s)), 2 * 1.06);
});
test('Kontrolle: lokal begrenzt, national füllt Lücken', () => {
  const s = newState();
  s.owned.mast = 10; s.placed.mast = { SL: 10 };
  let c = eco.computeControl(s, eco.modifiers(s));
  near(c.control.SL, 10000 / 1e6); near(c.controlled, 10000);
  s.owned.mast = 3000; s.placed.mast = { SL: 3000 };            // 1,2 Mio > 1 Mio Einwohner
  c = eco.computeControl(s, eco.modifiers(s));
  eq(c.control.SL, 1); near(c.controlled, 1e6);
  s.owned.haarp = 10;                                            // 150 Mio national → alles voll
  c = eco.computeControl(s, eco.modifiers(s));
  for (const st of STATES) ok(eco.isTaken(c.control[st.code]), st.code);
  near(c.controlled, TOTAL_POP);
});
test('Alle Upgrade-IDs eindeutig', () => {
  eq(new Set(UPGRADES.map((u) => u.id)).size, UPGRADES.length);
});
test('Kartendaten vollständig', () => {
  for (const st of STATES) ok(MAP_DE.states[st.code]?.d?.length > 50, st.code);
});

// ---------- Spiel ----------
test('Klicken, Kaufen, Hand, Platzieren', () => {
  const c = clock();
  const g = new Game(newState(c.now()), { now: c.now, random: seeded() });
  for (let i = 0; i < 15; i++) g.click(0, 0);
  eq(g.s.fp, 15);
  ok(g.buy('mast'), 'Kauf');
  eq(g.s.fp, 0); eq(g.s.hand.length, 1);
  near(g.d.controlled, 0);
  ok(g.placeFromHand('BY', 300, 600), 'Platzieren');
  eq(g.s.hand.length, 0); eq(g.s.placed.mast.BY, 1);
  near(g.d.controlled, 1000);
  ok(g.s.fp > 0, 'Einweihungsbonus');
});
test('Kein stiller Teilkauf bei ×10', () => {
  const c = clock();
  const s = newState(c.now()); s.fp = 100; s.settings.autoPlace = true;
  const g = new Game(s, { now: c.now, random: seeded() });
  eq(g.buy('mast', 10), false, 'zu teuer → nichts kaufen');
  eq(s.owned.mast || 0, 0); eq(s.fp, 100);
  s.fp = eco.buildingCost(BUILDING_BY_ID.mast, 0, 10);
  eq(g.buy('mast', 10), true); eq(s.owned.mast, 10); near(s.fp, 0);
});
test('Auto-Platzieren nimmt schwächstes Land', () => {
  const c = clock();
  const s = newState(c.now()); s.fp = 1e6; s.settings.autoPlace = true;
  const g = new Game(s, { now: c.now, random: seeded() });
  g.buy('tanne', 16);
  eq(Object.keys(s.placed.tanne).length, 16, 'jedes Land eins');
});
test('Tick produziert FP über die Zeit', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.tanne = 10;
  const g = new Game(s, { now: c.now, random: seeded() });
  g.eventsEnabled = false;
  g.lastAchCheck = Infinity; // Erfolgs-Boni hier ausklammern
  for (let i = 0; i < 100; i++) { c.advance(100); g.tick(); }
  near(s.fp, 100, 1e-6);
});
test('Offline: 50 %, max. 12 h', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.tanne = 10;
  c.advance(24 * 3600 * 1000);
  const g = new Game(s, { now: c.now, random: seeded() });
  const off = g.applyOffline();
  near(off.gain, 10 * 0.5 * 12 * 3600);
});
test('Übernahme gibt Bonus und Event', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.toaster = 2; s.placed.toaster = { HB: 2 };
  const g = new Game(s, { now: c.now, random: seeded() });
  let got = null; g.on('takeover', (st) => { got = st.code; });
  c.advance(100); g.tick();
  eq(got, 'HB'); ok(s.taken.includes('HB'));
});
test('Aluhut: Strafe und Belohnung', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.tanne = 10; s.placed.tanne = { BY: 10 };
  const g = new Game(s, { now: c.now, random: seeded() });
  const a = g.spawnAluhut();
  near(g.d.cps, g.d.rawCps * 0.9);
  const fp0 = s.fp; g.hitAluhut(a.id);
  ok(s.fp > fp0); eq(g.aluhuts.length, 0); eq(s.aluhutConverted, 1);
});
test('Aluhut-Demo: fünf Figuren, −50 %, Prämie beim Auflösen', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.tanne = 10; s.placed.tanne = { BY: 10 };
  const g = new Game(s, { now: c.now, random: seeded() });
  let dissolved = null; g.on('demoDissolved', (x) => { dissolved = x; });
  g.spawnDemo();
  eq(g.aluhuts.length, 5); near(g.d.cps, g.d.rawCps * 0.5);
  const ids = g.aluhuts.map((a) => a.id);
  for (const id of ids.slice(0, 4)) g.hitAluhut(id);
  eq(dissolved, null, 'noch nicht aufgelöst');
  const fp0 = s.fp; g.hitAluhut(ids[4]);
  ok(dissolved && dissolved.reward > 0, 'Prämie'); eq(s.demosDissolved, 1); eq(s.aluhutConverted, 5);
  ok(s.fp - fp0 >= 3 * 6 * g.d.rawCps, 'Prämie mind. 3 × 6 s Produktion');
});
test('Demo kommt nicht, wenn schon jemand protestiert', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.tanne = 10; s.placed.tanne = { BY: 10 };
  const g = new Game(s, { now: c.now, random: seeded() });
  g.spawnAluhut(c.now(), 'aluhut');
  g.spawnAluhut(c.now(), 'demo');
  eq(g.aluhuts.length, 2); ok(g.aluhuts.every((a) => a.kind === 'aluhut'));
});
test('Wünschelruten-Trupp: wandert und braucht drei Klicks', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.tanne = 10; s.placed.tanne = { BY: 10 };
  const g = new Game(s, { now: c.now, random: seeded(7) });
  let moves = 0; g.on('aluhutMove', () => { moves++; });
  const a = g.spawnTrupp();
  for (let i = 0; i < 9; i++) { c.advance(1000); g.tick(); }
  ok(moves >= 1, 'ist weitergezogen');
  g.hitAluhut(a.id); g.hitAluhut(a.id);
  eq(g.aluhuts.length, 1, 'nach zwei Klicks noch da');
  g.hitAluhut(a.id);
  eq(g.aluhuts.length, 0); eq(s.truppsCaught, 1);
});
test('Sonderformen erst ab genug FP/s', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.tanne = 10; s.placed.tanne = { BY: 10 };
  const g = new Game(s, { now: c.now, random: () => 0.25 });
  eq(g.rollAluhutKind(), 'aluhut', 'bei 10 FP/s nie Demo');
  s.owned.reptil = 10; g.refresh();
  eq(g.rollAluhutKind(), 'demo', 'Wurf 0,25 bei viel FP/s = Demo');
});
test('Synergie: Kirchturm +1 % je Tanne', () => {
  const s = newState(); s.owned.kirche = 15; s.owned.tanne = 20;
  const before = eco.rawCps(s, eco.modifiers(s));
  s.upgrades.push('syn_kirche_tanne');
  const m = eco.modifiers(s);
  near(eco.synergyMult(s, m, 'kirche'), 1.2);
  near(eco.rawCps(s, m) - before, 15 * 8 * 0.2);
  near(eco.unitCps(s, m, BUILDING_BY_ID.kirche), 8 * 1.2);
});
test('Bundesland-Upgrade erst nach Übernahme', () => {
  const s = newState();
  const u = UPGRADES.find((x) => x.id === 'land_HB');
  ok(u, 'existiert'); ok(!u.unlock(s), 'gesperrt');
  s.taken.push('HB'); ok(u.unlock(s), 'frei');
  eq(UPGRADES.filter((x) => x.id.startsWith('land_')).length, 16);
});
test('Prestige behält Demo- und Trupp-Statistik', () => {
  const c = clock();
  const s = newState(c.now()); s.phase = 4; s.fpAll = 1e12; s.demosDissolved = 2; s.truppsCaught = 3;
  const g = new Game(s, { now: c.now, random: seeded() });
  ok(g.prestige() > 0); eq(s.demosDissolved, 2); eq(s.truppsCaught, 3); eq(s.phase, 1);
});
test('Universum nach Prestige erneut erobert → wieder Abschlussdialog', () => {
  const c = clock();
  const s = newState(c.now()); s.phase = 5; s.fpAll = 1e15;
  const g = new Game(s, { now: c.now, random: seeded() });
  let n = 0; g.on('universe', () => { n++; });
  g.completePhase(); g.completePhase();
  eq(n, 1, 'nur einmal je Durchlauf'); ok(s.universeDone && s.universeRun);
  g.prestige();
  ok(s.universeDone, 'bleibt für immer'); ok(!s.universeRun, 'neuer Durchlauf');
  s.phase = 5; g.completePhase();
  eq(n, 2);
});
test('Portal: Dienstgrad aus dem Spielstand', () => {
  eq(portal.RANKS[portal.rankIndex(null)].id, 'anw', 'ohne Spielstand');
  const s = newState();
  eq(portal.rankIndex(s), 0);
  s.achievements.push('state_1'); eq(portal.RANKS[portal.rankIndex(s)].id, 'sek');
  s.phaseReached = 3; eq(portal.RANKS[portal.rankIndex(s)].id, 'amtr');
  s.universeDone = true; eq(portal.RANKS[portal.rankIndex(s)].id, 'praes');
  eq(portal.ASSESSMENTS.length, portal.RANKS.length, 'eine Beurteilung je Dienstgrad');
});
test('Portal: Rundschreiben verweisen auf echte Erfolge', () => {
  // Jede Freischaltung muss auf einen existierenden Erfolg zeigen, sonst bleibt sie für immer gesperrt.
  const s = newState(); s.achievements = Object.keys(ACHIEVEMENT_BY_ID); s.phaseReached = 5;
  for (const c of portal.CIRCULARS) ok(portal.isOpen(c, s), `${c.nr} lässt sich freischalten`);
  ok(portal.CIRCULARS.some((c) => !portal.isOpen(c, newState())), 'zu Beginn ist etwas gesperrt');
  eq(new Set(portal.CIRCULARS.map((c) => c.nr)).size, portal.CIRCULARS.length, 'Nummern eindeutig');
});
test('Portal: Kalenderwoche', () => {
  eq(portal.isoWeek(new Date(2026, 10, 9)), 46);
  eq(portal.isoWeek(new Date(2026, 0, 1)), 1);
  eq(portal.isoWeek(new Date(2027, 0, 1)), 53);
});
atest('Musik: europäische Stücke erst ab Phase 2', async () => {
  const { SONGS, playlistFor, Synthwave } = await import('../assets/js/audio/synthwave.js');
  const eu = SONGS.filter((x) => x.from === 2).map((x) => x.country).sort();
  eq(eu.join(','), 'Finnland,Frankreich,Italien,Polen');
  eq(playlistFor(1).length, 6); eq(playlistFor(2).length, 10); eq(playlistFor(5).length, 10);
  ok(playlistFor(1).every((i) => SONGS[i].from === 1), 'Phase 1 nur die ersten sechs');
  for (let k = 0; k < 20; k++) { const m = new Synthwave({ intensity: 1 }); ok(SONGS[m.songIdx].from === 1, 'Start in Phase 1 nie europäisch'); }
  const m = new Synthwave({ intensity: 1 }); const seen = new Set();
  for (let k = 0; k < 12; k++) { m.next(); seen.add(m.songIdx); }
  eq(seen.size, 6, 'Phase 1: Playlist durchläuft genau sechs Stücke');
  m.setIntensity(2); for (let k = 0; k < 12; k++) { m.next(); seen.add(m.songIdx); }
  eq(seen.size, 10, 'ab Phase 2 alle zehn');
  ok(SONGS.every((x) => x.seconds > 90), 'kein Stück kürzer als 1,5 Min.');
});
test('Goldener Mast wirkt', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.tanne = 10;
  const g = new Game(s, { now: c.now, random: () => 0.3 });
  const gm = g.spawnGolden();
  const eff = g.clickGolden(gm.id);
  eq(eff.id, 'rausch'); near(g.d.cps, 10 * 4);
});
test('Export/Import Rundreise (mit Umlauten)', () => {
  const s = newState(); s.nickname = 'Jürgen-Ü'; s.fp = 123.5;
  const back = importState(exportState(s));
  eq(back.nickname, 'Jürgen-Ü'); eq(back.fp, 123.5);
});
test('normalize repariert kaputte Felder', () => {
  const s = normalize({ fp: 'kaputt', owned: null, settings: { autoPlace: true } });
  eq(s.fp, 0); ok(typeof s.owned === 'object'); eq(s.settings.autoPlace, true); eq(s.settings.buyAmount, 1);
});

// ---------- Phasen ----------
test('Regionen: Codes eindeutig, Karten vollständig, Einwohner passen', () => {
  const seen = new Set();
  for (const p of PHASES) {
    for (const r of p.regions) {
      ok(!seen.has(r.code), 'doppelter Code ' + r.code);
      seen.add(r.code);
      ok(p.map.shapes[r.code]?.d?.length > 20, `Form fehlt: ${p.name}/${r.code}`);
      ok(r.pop > 0, 'Einwohner ' + r.code);
      if (!r.inherited) ok(r.gag, 'Gag fehlt: ' + r.code);
    }
    eq(p.regions.filter((r) => r.inherited).length, p.id === 1 ? 0 : 1, 'eine geerbte Region in ' + p.name);
    if (p.id > 1) near(p.regions.find((r) => r.inherited).pop, PHASE_BY_ID[p.id - 1].total);
  }
  near(PHASE_BY_ID[1].total, TOTAL_POP);
});
test('Spätere Anlagen erst in ihrer Phase', () => {
  const s = newState(); s.fpAll = 1e20;
  eq(eco.isBuildingVisible(s, BUILDING_BY_ID.euro), false);
  s.phase = 2;
  eq(eco.isBuildingVisible(s, BUILDING_BY_ID.euro), true);
  eq(eco.isBuildingVisible(s, BUILDING_BY_ID.sat), false);
});
test('Phasenwechsel: Deutschland → Europa', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.haarp = 10;                // 150 Mio. national → Deutschland voll
  const g = new Game(s, { now: c.now, random: seeded() });
  let ev = null; g.on('phase', (e) => { ev = e; });
  c.advance(100); g.tick();
  eq(s.phase, 2); eq(ev?.to.id, 2); eq(s.taken.length, 16);
  eq(g.d.control.DEU, 1);
  // 150 Mio. Reichweite füllen jetzt die europäischen Lücken
  near(g.d.controlled, TOTAL_POP + 150e6, 1e-6);
  eq(g.placeFromHand('BY', 0, 0), false, 'Phase-1-Land nicht mehr bebaubar');
  s.hand.push('mast');
  eq(g.placeFromHand('DEU', 0, 0), false, 'geerbte Region nicht bebaubar');
  ok(g.placeFromHand('VAT', 0, 0), 'Vatikan bebaubar');
  c.advance(100); g.tick();
  ok(s.taken.includes('VAT'), 'Vatikan mit einem Mast übernommen');
});
test('Übernahme-Bonus hängt von der Phase ab', () => {
  const s = newState(); s.taken = ['SL', 'VAT'];
  near(eco.takeoverBonus(s), 0.05 + 0.02);
});
test('Prestige: erst nach der Welt, setzt zurück, behält Tränen', () => {
  const c = clock();
  const s = newState(c.now());
  s.phase = 3; s.fpAll = eco.fpForTears(12) + 1; s.owned.mast = 50; s.achievements = ['click_1']; s.upgrades = ['mast_t1'];
  const g = new Game(s, { now: c.now, random: seeded() });
  eq(g.canPrestige(), false, 'Phase 3 reicht nicht');
  s.phase = 4;
  ok(g.canPrestige(), 'Phase 4 reicht');
  eq(g.prestige(), 12);
  eq(s.tears, 12); eq(s.phase, 1); eq(s.owned.mast, undefined); eq(s.upgrades.length, 0);
  eq(s.achievements[0], 'click_1'); eq(s.prestiges, 1); ok(s.fpAll > 0);
  eq(eco.pendingTears(s), 0);
  near(eco.bonusMult(s), 1 + 0.01 + 12 * eco.TEAR_BONUS);
});
test('Tränen: Kubikwurzel der Gesamt-FP', () => {
  eq(eco.tearsFor(0), 0);
  for (const n of [1, 5, 14, 47, 100]) {
    eq(eco.tearsFor(eco.fpForTears(n)), n, `genau ${n}`);
    eq(eco.tearsFor(eco.fpForTears(n) * 0.999), n - 1, `knapp unter ${n}`);
  }
  // Achtfache FP → doppelte Tränen
  eq(eco.tearsFor(eco.fpForTears(10) * 8), 20);
});
test('Patente kaufen und Startpaket', () => {
  const c = clock();
  const s = newState(c.now()); s.tears = 5;
  const g = new Game(s, { now: c.now, random: seeded() });
  ok(g.buyPatent('start')); ok(g.buyPatent('gold'));
  ok(g.buyPatent('night'), 'Nachtschicht kostet 2'); eq(g.buyPatent('auto'), false, 'zu teuer');
  eq(s.tearsSpent, 4);
  near(g.d.mods.goldenInterval, 0.9);
  near(eco.bonusMult(s), 1 + 5 * eco.TEAR_BONUS, 1e-9, 'ausgegebene Tränen behalten Bonus');
  s.phase = 4; s.fpAll = eco.fpForTears(8);
  g.prestige();
  eq(s.owned.mast, 10); eq(s.owned.tanne, 5);
  eq(Object.values(s.placed.mast).reduce((a, b) => a + b, 0), 10, 'Startmasten platziert');
});
test('Alter Spielstand (v1) wird migriert', () => {
  const s = normalize({ version: 1, fp: 5, taken: ['SL'], germanyDone: false, markers: [{ b: 'mast', s: 'SL', x: 1, y: 2 }] });
  eq(s.phase, 1); eq(s.markers[0].p, 1); eq(s.tears, 0); ok(Array.isArray(s.patents));
});

// ---------- Bestenliste ----------
test('Bestenliste: Einwohner je Phase stimmen mit den Karten überein', () => {
  for (const p of PHASES) near(lb.PHASE_TOTALS[p.id], p.total, 1e-12, p.name);
});
test('Bestenliste: Namensprüfung', () => {
  for (const n of ['Funk_Frieda', 'Jürgen-99', 'abc', 'X'.repeat(16)]) ok(lb.checkName(n).ok, n);
  for (const n of ['ab', 'X'.repeat(17), 'mit leer', 'a.b', 'www.de', '<b>', '']) ok(!lb.checkName(n).ok, `abgelehnt: ${n}`);
  for (const n of ['Admin', 'B_A_f_G', 'Hitler88', 'F1ck3r', 'N4zi']) ok(!lb.checkName(n).ok, `gesperrt: ${n}`);
  eq(lb.nameKey('FunkFrieda'), 'funkfrieda');
});
test('Bestenliste: Plausibilität', () => {
  const base = { name: 'Testkraft', runId: 'a'.repeat(24), score: 5e7, fpAll: 1e9, phase: 1, playtime: 3000 };
  ok(lb.checkEntry(base).ok, 'gültig');
  eq(lb.checkEntry({ ...base, score: 9e7 }).field, 'score', 'mehr als Deutschland');
  eq(lb.checkEntry({ ...base, phase: 2, score: 1e7 }).field, 'score', 'Phase 2, aber weniger als Deutschland');
  eq(lb.checkEntry({ ...base, phase: 3, score: 1e9, playtime: 600 }).field, 'playtime', 'zu schnell');
  ok(lb.checkEntry({ ...base, phase: 5, score: lb.PHASE_TOTALS[4] * 2, playtime: 80 * 60 }).ok, 'Phase 5 nach 80 Min. ok');
  eq(lb.checkEntry({ ...base, phase: 5, score: Math.floor(lb.PHASE_TOTALS[5]), playtime: 80 * 60 }).field, 'playtime', 'Universum in 80 Min.');
  eq(lb.checkEntry({ ...base, runId: 'xyz' }).field, 'runId');
  eq(lb.checkEntry({ ...base, fpAll: Infinity }).field, 'fpAll');
  eq(lb.checkEntry({ ...base, phase: 2.5 }).field, 'phase');
  eq(lb.checkEntry(null).ok, false);
});
test('Bestenliste: Eintrag aus dem Spielstand ist gültig', () => {
  const s = newState(); s.runId = 'c'.repeat(24); s.bestControlledAll = 8.2e9; s.phaseReached = 4; s.phase = 1; s.fpAll = 3.3e12; s.playtime = 4 * 3600 + 0.7;
  const e = lb.entryFromState(s, 'Testkraft');
  eq(e.phase, 4, 'höchste Phase, nicht die aktuelle'); eq(e.playtime, 14400);
  ok(lb.checkEntry(e).ok, 'Server würde annehmen');
  ok(/^[0-9a-f]{24}$/.test(newState().runId), 'Spielstand-ID passt zum Format');
});

const post = (body, ip = '1.2.3.4') => new Request('https://x/api/score', {
  method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
});
const entry = (over = {}) => ({ name: 'Anna', runId: 'a'.repeat(24), score: 5e7, fpAll: 1e9, phase: 1, playtime: 3000, ...over });

atest('Bestenliste-API: melden, verbessern, Rang', async () => {
  const store = memoryStore();
  let r = await api.postScore({ request: post(entry()), store, salt: 's', now: 1000 });
  eq(r.status, 200); eq((await r.json()).rank, 1);
  r = await api.postScore({ request: post(entry({ name: 'Bert', runId: 'b'.repeat(24), score: 8e7 }), '5.6.7.8'), store, salt: 's', now: 1010 });
  eq((await r.json()).rank, 1, 'Bert vorn');
  // schlechterer Wert senkt nichts, Umbenennen geht
  r = await api.postScore({ request: post(entry({ name: 'Anna2', score: 1 })), store, salt: 's', now: 1100 });
  const d = await r.json();
  eq(d.score, 5e7, 'Bestwert bleibt'); eq(d.name, 'Anna2'); eq(d.rank, 2);
  r = await api.getLeaderboard({ request: new Request('https://x/api/leaderboard?range=all'), store, now: 1200 });
  const b = await r.json();
  eq(b.total, 2); eq(b.entries[0].name, 'Bert'); eq(b.entries[1].rank, 2);
  ok(!('runId' in b.entries[0]) && !('ipHash' in b.entries[0]), 'keine IDs/Prüfsummen öffentlich');
  r = await api.getLeaderboard({ request: new Request('https://x/api/leaderboard?range=week'), store, now: 1100 + 8 * 86400 });
  eq((await r.json()).total, 0, 'nach 8 Tagen nicht mehr in „diese Woche“');
});
atest('Bestenliste-API: Missbrauchsschutz', async () => {
  const store = memoryStore();
  await api.postScore({ request: post(entry()), store, salt: 's', now: 1000 });
  let r = await api.postScore({ request: post(entry()), store, salt: 's', now: 1030 });
  eq(r.status, 429, 'zweite Meldung nach 30 s');
  r = await api.postScore({ request: post(entry({ runId: 'b'.repeat(24) }), '9.9.9.9'), store, salt: 's', now: 2000 });
  eq(r.status, 409, 'Name vergeben');
  r = await api.postScore({ request: post(entry({ runId: 'b'.repeat(24), name: 'ANNA' }), '9.9.9.9'), store, salt: 's', now: 2100 });
  eq(r.status, 409, 'auch in anderer Schreibweise');
  r = await api.postScore({ request: post(entry({ name: 'Admin', runId: 'c'.repeat(24) }), '8.8.8.8'), store, salt: 's', now: 2200 });
  eq(r.status, 400); eq((await r.json()).error, 'name');
  r = await api.postScore({ request: new Request('https://x/api/score', { method: 'POST', body: '{kaputt' }), store, salt: 's', now: 2300 });
  eq(r.status, 400);
  // höchstens 5 neue Einträge pro Tag je Anschluss
  let t = 10000;
  for (let i = 0; i < 5; i++) {
    r = await api.postScore({ request: post(entry({ name: 'Spam' + i, runId: String(i).repeat(24) }), '7.7.7.7'), store, salt: 's', now: t += 100 });
    eq(r.status, 200, 'Eintrag ' + i);
  }
  r = await api.postScore({ request: post(entry({ name: 'Spam9', runId: '9'.repeat(24) }), '7.7.7.7'), store, salt: 's', now: t += 100 });
  eq(r.status, 429, 'sechster neuer Eintrag');
  // IP-Prüfsumme: keine Klar-IP, wechselt täglich
  const h1 = await api.ipHash('7.7.7.7', 's', 1000); const h2 = await api.ipHash('7.7.7.7', 's', 1000 + 86400);
  ok(/^[0-9a-f]{32}$/.test(h1) && h1 !== h2, 'Prüfsumme 32 Hex-Zeichen, täglich anders');
  ok(![...store.rows.values()].some((x) => x.ipHash.includes('7.7')), 'keine IP gespeichert');
});
test('Bestenliste: IP wird vor dem Hashen gekürzt', () => {
  eq(api.anonymizeIp('203.0.113.77'), '203.0.113.0');
  eq(api.anonymizeIp('2001:db8:85a3:8d3:1319:8a2e:370:7348'), '2001:db8:85a3::');
  eq(api.anonymizeIp('2001:db8::1'), '2001:db8:0::');
  eq(api.anonymizeIp('2001:DB8:abcd:12::'), '2001:db8:abcd::');
  eq(api.anonymizeIp(''), ''); eq(api.anonymizeIp('kaputt'), ''); eq(api.anonymizeIp('::1'), '0:0:0::');
});
atest('Bestenliste-API: gleiches Netz = gleiche Prüfsumme, nach 24 h gelöscht', async () => {
  eq(await api.ipHash('203.0.113.5', 's', 1000), await api.ipHash('203.0.113.200', 's', 1000), 'gleiches /24');
  ok(await api.ipHash('203.0.113.5', 's', 1000) !== await api.ipHash('203.0.114.5', 's', 1000), 'anderes Netz');
  const store = memoryStore();
  await api.postScore({ request: post(entry()), store, salt: 's', now: 1000 });
  ok(store.rows.get('a'.repeat(24)).ipHash !== '', 'frisch: Prüfsumme da');
  await api.postScore({ request: post(entry({ name: 'Bert', runId: 'b'.repeat(24) }), '9.9.9.9'), store, salt: 's', now: 1000 + 86400 + 1 });
  eq(store.rows.get('a'.repeat(24)).ipHash, '', 'nach 24 h gelöscht');
  ok(store.rows.get('b'.repeat(24)).ipHash !== '', 'neuer Eintrag behält seine');
  const r = await api.postScore({ request: post(entry({ score: 6e7 })), store, salt: 's', now: 1000 + 86400 + 100 });
  eq(r.status, 200, 'gelöschte Prüfsumme blockiert nichts');
});
test('Bestenliste: Test-Spielstände (Seeds) sind ausgeschlossen', () => {
  const s = newState(); s.runId = 'd'.repeat(24); s.bestControlledAll = 5e7; s.playtime = 100; s.test = true;
  const e = lb.entryFromState(s, 'Testkraft');
  eq(e.test, true, 'Merkmal wird mitgesendet');
  eq(lb.checkEntry(e).field, 'test', 'Server lehnt ab');
  ok(lb.checkEntry({ ...e, test: false }).ok, 'ohne Merkmal gültig');
  eq(normalize({ ...s }).test, true, 'bleibt beim Laden');
  eq(normalize({ ...s, test: 'ja' }).test, false, 'nur echtes true zählt');
  eq(newState().test, false);
  const c = clock(); s.phase = 4; s.fpAll = 1e13;
  const g = new Game(s, { now: c.now, random: seeded() });
  g.prestige(); eq(s.test, true, 'bleibt über Prestige');
});
atest('Bestenliste: Spiel meldet Test-Spielstand nie automatisch', async () => {
  const { autoSubmitter } = await import('../assets/js/leaderboard-client.js');
  const s = newState(); s.test = true; s.bestControlledAll = 1e6;
  let old; try { old = localStorage.getItem('sendemast.lb'); localStorage.setItem('sendemast.lb', JSON.stringify({ name: 'Testkraft' })); } catch { return; }
  try {
    const r = await autoSubmitter(() => s)(true);
    eq(r, null, 'nichts gesendet');
  } finally {
    if (old == null) localStorage.removeItem('sendemast.lb'); else localStorage.setItem('sendemast.lb', old);
  }
});
atest('Bestenliste-API: Austragen', async () => {
  const store = memoryStore();
  await api.postScore({ request: post(entry()), store, salt: 's', now: 1000 });
  const del = (body) => new Request('https://x/api/score', { method: 'DELETE', body: JSON.stringify(body) });
  eq((await api.deleteScore({ request: del({ runId: 'zz' }), store })).status, 400);
  eq((await api.deleteScore({ request: del({ runId: 'a'.repeat(24) }), store })).status, 200);
  eq(store.rows.size, 0);
});

// ---------- Ausgabe ----------
await Promise.all(pending);
const failed = results.filter((r) => !r.ok);
document.getElementById('out').innerHTML = results
  .map((r) => (r.ok ? `✔ ${r.name}` : `<span class="fail">✘ ${r.name}: ${r.err}</span>`))
  .join('\n') + `\n\n${results.length - failed.length}/${results.length} bestanden`;
document.title = failed.length ? `FAIL ${failed.length}` : `PASS ${results.length}`;
