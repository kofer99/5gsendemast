// Balancing-Simulation: gieriger Spieler, der aktiv klickt und immer den besten Kauf wählt.
// Parameter (URL): cps = Klicks/Sek., h = Stunden, ev = 1/0 Ereignisse (Goldene Masten, Aluhüte sofort angeklickt),
//                  manual = 1/0 Masten von Hand platzieren (mit Einweihungsbonus).
import { Game } from '../assets/js/core/game.js';
import { newState } from '../assets/js/core/state.js';
import { BUILDINGS } from '../assets/js/data/buildings.js';
import { TOTAL_POP } from '../assets/js/data/states.js';
import { MAP_DE } from '../assets/js/data/map-de.js';
import * as eco from '../assets/js/core/economy.js';
import { fmt, fmtDuration } from '../assets/js/util/format.js';

const params = new URLSearchParams(location.search);
const CLICKS_PER_SEC = Number(params.get('cps') ?? 3);
const HOURS = Number(params.get('h') ?? 3);
const EVENTS = params.get('ev') !== '0';
const MANUAL = params.get('manual') !== '0';

let t = 0;
const s = newState(0);
s.settings.autoPlace = !MANUAL;
const g = new Game(s, { now: () => t, random: Math.random });
g.eventsEnabled = EVENTS;
if (EVENTS) {
  g.on('goldenSpawn', (gm) => queueMicrotask(() => g.clickGolden(gm.id)));
  g.on('aluhutSpawn', (a) => queueMicrotask(() => { for (let i = 0; i < a.maxHp; i++) g.hitAluhut(a.id); }));
}

function candidates() {
  const d = g.d;
  const m = d.mods;
  const list = [];
  for (const b of BUILDINGS) {
    if (!eco.isBuildingVisible(s, b)) continue;
    const cost = eco.buildingCost(b, s.owned[b.id] || 0);
    list.push({ kind: 'b', id: b.id, cost, gain: eco.unitCps(s, m, b) * (1 + CLICKS_PER_SEC * m.clickCps) });
  }
  for (const u of eco.availableUpgrades(s, d)) {
    const e = u.effect;
    let gain = 0;
    if (e.type === 'building') {
      const b = BUILDINGS.find((x) => x.id === e.building);
      gain = (s.owned[b.id] || 0) * eco.unitCps(s, m, b);
    } else if (e.type === 'global') gain = d.rawCps * (e.mult - 1);
    else if (e.type === 'click') gain = CLICKS_PER_SEC * m.click * (e.mult - 1);
    else if (e.type === 'clickCps') gain = CLICKS_PER_SEC * d.rawCps * e.pct;
    else if (e.type === 'reach') gain = d.rawCps * (e.mult - 1); // Heuristik: Reichweite bringt Übernahme-Boni
    else if (EVENTS && (e.type === 'goldenInterval' || e.type === 'goldenDuration' || e.type === 'aluhut')) gain = d.rawCps * 0.05;
    else continue;
    list.push({ kind: 'u', id: u.id, cost: u.cost, gain });
  }
  return list;
}

const milestones = [];
const seen = new Set();
function mark(key, label) {
  if (seen.has(key)) return;
  seen.add(key);
  milestones.push(`${fmtDuration(t / 1000).padEnd(16)} ${label}`);
}
g.on('takeover', (st) => mark('take_' + st.code, `Übernommen: ${st.name} (${s.taken.length}/16)`));
g.on('upgrade', (u) => { if (u.effect.type === 'reach') mark(u.id, `Upgrade: ${u.name}`); });
g.on('bought', ({ id }) => mark('first_' + id, `Erste Anlage: ${id}`));

const pctNow = () => g.d.controlled / TOTAL_POP;
const jumps = [];
function track(label, fn) {
  const before = pctNow();
  const ok = fn();
  if (ok) jumps.push({ label, at: t, delta: pctNow() - before, from: before });
  return ok;
}

const snapshots = [];
const END = HOURS * 3600 * 1000;
let clickAcc = 0;
for (t = 1000; t <= END; t += 1000) {
  g.tick();
  clickAcc += CLICKS_PER_SEC;
  while (clickAcc >= 1) { g.click(0, 0); clickAcc--; }
  for (let guard = 0; guard < 50; guard++) {
    const list = candidates();
    if (!list.length) break;
    list.sort((a, b) => b.gain / b.cost - a.gain / a.cost);
    const best = list[0];
    if (best.cost > s.fp) break;
    const okBuy = track(best.id, () => {
      const r = best.kind === 'b' ? g.buy(best.id, 1) : g.buyUpgrade(best.id);
      while (r && s.hand.length) {
        const code = g.weakestState();
        g.placeFromHand(code, MAP_DE.states[code].cx, MAP_DE.states[code].cy);
      }
      return r;
    });
    if (!okBuy) break;
  }
  const pct = pctNow();
  for (const p of [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) if (pct >= p - 1e-9) mark('p' + p, `Deutschland ${Math.round(p * 100)} % kontrolliert`);
  if (t % (15 * 60 * 1000) === 0) {
    snapshots.push(`${fmtDuration(t / 1000).padEnd(16)} FP/s ${fmt(g.d.rawCps).padEnd(12)} kontrolliert ${(pct * 100).toFixed(1).padStart(5)} %   ${JSON.stringify(s.owned)}`);
  }
}

const top = jumps.sort((a, b) => b.delta - a.delta).slice(0, 8)
  .map((j) => `${fmtDuration(j.at / 1000).padEnd(16)} +${(j.delta * 100).toFixed(1).padStart(5)} %-Punkte (von ${(j.from * 100).toFixed(1)} %) durch ${j.label}`);

document.getElementById('out').textContent =
  `Klicks/Sek.: ${CLICKS_PER_SEC}, Ereignisse: ${EVENTS ? 'an' : 'aus'}, Platzieren: ${MANUAL ? 'von Hand' : 'automatisch'}, Dauer: ${HOURS} h\n\n`
  + `MEILENSTEINE\n${milestones.join('\n')}\n\nGRÖSSTE SPRÜNGE DURCH EINEN EINZELNEN KAUF\n${top.join('\n')}\n\nVERLAUF\n${snapshots.join('\n')}`;
document.title = 'SIM DONE';
