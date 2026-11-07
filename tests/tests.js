import { fmt, fmtInt, fmtPct, fmtDuration } from '../assets/js/util/format.js';
import * as eco from '../assets/js/core/economy.js';
import { Game } from '../assets/js/core/game.js';
import { newState, exportState, importState, normalize } from '../assets/js/core/state.js';
import { BUILDING_BY_ID } from '../assets/js/data/buildings.js';
import { STATES, TOTAL_POP } from '../assets/js/data/states.js';
import { UPGRADES } from '../assets/js/data/upgrades.js';
import { MAP_DE } from '../assets/js/data/map-de.js';

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, err: e.message }); }
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
test('Goldener Mast wirkt', () => {
  const c = clock();
  const s = newState(c.now()); s.owned.tanne = 10;
  const g = new Game(s, { now: c.now, random: () => 0.3 });
  const gm = g.spawnGolden();
  const eff = g.clickGolden(gm.id);
  eq(eff.id, 'rausch'); near(g.d.cps, 10 * 7);
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

// ---------- Ausgabe ----------
const failed = results.filter((r) => !r.ok);
document.getElementById('out').innerHTML = results
  .map((r) => (r.ok ? `✔ ${r.name}` : `<span class="fail">✘ ${r.name}: ${r.err}</span>`))
  .join('\n') + `\n\n${results.length - failed.length}/${results.length} bestanden`;
document.title = failed.length ? `FAIL ${failed.length}` : `PASS ${results.length}`;
