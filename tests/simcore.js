// Gemeinsamer Kern der Balancing-Simulationen (sim.js, sim-prestige.js).
// Gieriger Spieler: klickt aktiv, kauft immer den Kauf mit dem besten Verhältnis Gewinn/Preis,
// reagiert nach `react` Sekunden auf Goldene Masten und Aluhutträger (alle Sonderformen).
import { Game } from '../assets/js/core/game.js';
import { newState } from '../assets/js/core/state.js';
import { BUILDINGS, BUILDING_BY_ID } from '../assets/js/data/buildings.js';
import { PATENTS } from '../assets/js/data/patents.js';
import { UPGRADES } from '../assets/js/data/upgrades.js';
import * as eco from '../assets/js/core/economy.js';

/** Zum Vergleich: Upgrades nach Präfix abschalten (z. B. ['syn_', 'land_']). Wirkt auf das ganze Modul. */
export function disableUpgrades(prefixes) {
  for (let i = UPGRADES.length - 1; i >= 0; i--) if (prefixes.some((p) => UPGRADES[i].id.startsWith(p))) UPGRADES.splice(i, 1);
}

export function createSim({ cps = 3, events = true, manual = true, react = 2, seed = null } = {}) {
  const clock = { t: 0 };
  const random = seed == null ? Math.random : seeded(seed);
  const s = newState(0);
  s.settings.autoPlace = !manual;
  const g = new Game(s, { now: () => clock.t, random });
  g.eventsEnabled = events;
  const todo = []; // { at, fn } – Reaktionen auf Ereignisse
  if (events) {
    g.on('goldenSpawn', (gm) => todo.push({ at: clock.t + react * 1000, fn: () => g.clickGolden(gm.id) }));
    g.on('aluhutSpawn', (a) => todo.push({
      at: clock.t + react * 1000,
      fn: () => { for (let i = 0; i < a.maxHp; i++) g.hitAluhut(a.id); },
    }));
  }

  /** Gewinn eines Upgrades: exakt per Probekauf, wo es um FP/s geht. */
  function upgradeGain(u, d) {
    const e = u.effect;
    if (e.type === 'building' || e.type === 'global' || e.type === 'synergy') {
      s.upgrades.push(u.id);
      const after = eco.rawCps(s, eco.modifiers(s));
      s.upgrades.pop();
      return after - d.rawCps;
    }
    if (e.type === 'click') return cps * d.mods.click * (e.mult - 1);
    if (e.type === 'clickCps') return cps * d.rawCps * e.pct;
    if (e.type === 'reach') return d.rawCps * (e.mult - 1); // Heuristik: Reichweite bringt Übernahme-Boni
    if (events && (e.type === 'goldenInterval' || e.type === 'goldenDuration' || e.type === 'aluhut')) return d.rawCps * 0.05;
    return null;
  }

  function candidates() {
    const d = g.d;
    const m = d.mods;
    const list = [];
    for (const b of BUILDINGS) {
      if (!eco.isBuildingVisible(s, b)) continue;
      const cost = eco.buildingCost(b, s.owned[b.id] || 0);
      // Grenzgewinn inkl. Synergien, die diese Anlage bei anderen auslöst
      s.owned[b.id] = (s.owned[b.id] || 0) + 1;
      const after = eco.rawCps(s, m);
      if (--s.owned[b.id] === 0) delete s.owned[b.id];
      list.push({ kind: 'b', id: b.id, cost, gain: (after - d.rawCps) * (1 + cps * m.clickCps) });
    }
    for (const u of eco.availableUpgrades(s, d)) {
      const gain = upgradeGain(u, d);
      if (gain == null) continue;
      list.push({ kind: 'u', id: u.id, cost: u.cost, gain });
    }
    return list;
  }

  function placeHand() {
    while (s.hand.length) {
      const code = g.weakestRegion();
      const pt = g.pointIn(code);
      g.placeFromHand(code, pt.x, pt.y);
    }
  }

  /** Kauft so lange, bis der beste Kauf nicht mehr bezahlbar ist. onBuy(label, deltaRatio, fromRatio) optional. */
  function shop(onBuy) {
    for (let guard = 0; guard < 50; guard++) {
      const list = candidates();
      if (!list.length) break;
      list.sort((a, b) => b.gain / b.cost - a.gain / a.cost);
      const best = list[0];
      if (best.cost > s.fp) break;
      const before = g.d.ratio;
      const phase = s.phase;
      const okBuy = best.kind === 'b' ? g.buy(best.id, 1) : g.buyUpgrade(best.id);
      if (okBuy) placeHand();
      if (!okBuy) break;
      onBuy?.(`${best.id} (P${phase})`, g.d.ratio - before, before);
    }
  }

  /** Eine Sekunde Spielzeit: Tick, Klicks, Reaktionen, Einkäufe. */
  let clickAcc = 0;
  function step(onBuy) {
    clock.t += 1000;
    g.tick();
    clickAcc += cps;
    while (clickAcc >= 1) { g.click(0, 0); clickAcc--; }
    for (let i = todo.length - 1; i >= 0; i--) {
      if (todo[i].at <= clock.t) { const { fn } = todo[i]; todo.splice(i, 1); fn(); }
    }
    shop(onBuy);
  }

  /** Patente: immer das billigste noch fehlende kaufen, solange Tränen reichen. */
  function buyPatents() {
    const bought = [];
    for (const p of PATENTS) {
      if (!s.patents.includes(p.id) && g.buyPatent(p.id)) bought.push(p.id);
    }
    return bought;
  }

  function prestige() {
    todo.length = 0;
    const gained = g.prestige();
    placeHand();
    return gained;
  }

  return { g, s, clock, step, shop, buyPatents, prestige, BUILDING_BY_ID };
}

function seeded(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}
