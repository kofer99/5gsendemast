// Reine Rechenfunktionen – kein DOM, keine Zeit, gut testbar.
import { BUILDINGS } from '../data/buildings.js';
import { UPGRADES, UPGRADE_BY_ID } from '../data/upgrades.js';
import { STATES } from '../data/states.js';

export const COST_GROWTH = 1.15;
export const TAKEOVER_BONUS = 0.05;     // +5 % FP/s je übernommenem Bundesland
export const ACHIEVEMENT_BONUS = 0.01;  // +1 % FP/s je Erfolg
export const ALUHUT_PENALTY = 0.1;      // −10 % FP/s je aktivem Aluhutträger
export const ALUHUT_PENALTY_MAX = 0.5;

/** Gesamtkosten für n Stück, wenn bereits `owned` vorhanden sind. */
export function buildingCost(b, owned, n = 1) {
  if (n <= 0) return 0;
  const first = b.baseCost * COST_GROWTH ** owned;
  if (n === 1) return Math.ceil(first);
  return Math.ceil((first * (COST_GROWTH ** n - 1)) / (COST_GROWTH - 1));
}

/** Wie viele Stück sind mit `fp` bezahlbar? */
export function maxAffordable(b, owned, fp) {
  const first = b.baseCost * COST_GROWTH ** owned;
  if (fp < Math.ceil(first)) return 0;
  let n = Math.floor(Math.log((fp * (COST_GROWTH - 1)) / first + 1) / Math.log(COST_GROWTH));
  while (n > 0 && buildingCost(b, owned, n) > fp) n--;
  return n;
}

export function modifiers(s) {
  const m = { building: {}, click: 1, clickCps: 0, global: 1, reach: 1, goldenInterval: 1, goldenDuration: 1, aluhutMult: 1 };
  for (const id of s.upgrades) {
    const e = UPGRADE_BY_ID[id]?.effect;
    if (!e) continue;
    switch (e.type) {
      case 'building': m.building[e.building] = (m.building[e.building] || 1) * e.mult; break;
      case 'click': m.click *= e.mult; break;
      case 'clickCps': m.clickCps += e.pct; break;
      case 'global': m.global *= e.mult; break;
      case 'reach': m.reach *= e.mult; break;
      case 'goldenInterval': m.goldenInterval *= e.mult; break;
      case 'goldenDuration': m.goldenDuration *= e.mult; break;
      case 'aluhut': m.aluhutMult *= e.mult; break;
    }
  }
  return m;
}

export function bonusMult(s) {
  return 1 + TAKEOVER_BONUS * s.taken.length + ACHIEVEMENT_BONUS * s.achievements.length;
}

/** FP/s einer einzelnen Anlage (inkl. aller dauerhaften Multiplikatoren). */
export function unitCps(s, m, b) {
  return b.cps * (m.building[b.id] || 1) * m.global * bonusMult(s);
}

export function rawCps(s, m) {
  let sum = 0;
  for (const b of BUILDINGS) sum += (s.owned[b.id] || 0) * b.cps * (m.building[b.id] || 1);
  return sum * m.global * bonusMult(s);
}

export function buffMult(s, now, key) {
  let x = 1;
  for (const b of s.buffs) if (b.until > now && b[key]) x *= b[key];
  return x;
}

export function aluhutPenalty(n) {
  return 1 - Math.min(ALUHUT_PENALTY_MAX, ALUHUT_PENALTY * n);
}

/**
 * Kontrolle je Bundesland.
 * Lokale Anlagen wirken nur im eigenen Bundesland (Überschuss verfällt).
 * Nationale Anlagen füllen die verbleibenden Lücken proportional auf.
 */
export function computeControl(s, m) {
  const local = {};
  for (const st of STATES) local[st.code] = 0;
  let national = 0;
  for (const b of BUILDINGS) {
    const r = b.reach * m.reach;
    if (b.scope === 'national') {
      national += (s.owned[b.id] || 0) * r;
    } else {
      const p = s.placed[b.id];
      if (p) for (const code in p) if (code in local) local[code] += p[code] * r;
    }
  }
  const rem = {};
  let remTotal = 0;
  for (const st of STATES) {
    rem[st.code] = Math.max(0, st.pop - local[st.code]);
    remTotal += rem[st.code];
  }
  const fill = remTotal > 0 ? Math.min(1, national / remTotal) : 0;
  const control = {};
  let controlled = 0;
  for (const st of STATES) {
    const covered = Math.min(st.pop, local[st.code]) + rem[st.code] * fill;
    control[st.code] = Math.min(1, covered / st.pop);
    controlled += covered;
  }
  return { control, controlled, local, national, fill, rem };
}

/** Alle abgeleiteten Werte für einen Zeitpunkt. */
export function derive(s, now, activeAluhuts = 0) {
  const mods = modifiers(s);
  const raw = rawCps(s, mods);
  const cps = raw * buffMult(s, now, 'mult') * aluhutPenalty(activeAluhuts);
  const perClick = (mods.click + raw * mods.clickCps) * buffMult(s, now, 'clickMult');
  const { control, controlled, local, fill, rem } = computeControl(s, mods);
  return { mods, rawCps: raw, cps, perClick, control, controlled, local, fill, rem };
}

export function availableUpgrades(s, d) {
  return UPGRADES.filter((u) => !s.upgrades.includes(u.id) && u.unlock(s, d)).sort((a, b) => a.cost - b.cost);
}

/** Sichtbar, sobald besessen oder 30 % des Basispreises jemals verdient wurden. */
export function isBuildingVisible(s, b) {
  return b.index === 0 || (s.owned[b.id] || 0) > 0 || s.fpAll >= b.baseCost * 0.3;
}

export function isTaken(ratio) {
  return ratio >= 1 - 1e-9;
}
