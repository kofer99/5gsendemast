// Reine Rechenfunktionen – kein DOM, keine Zeit, gut testbar.
import { BUILDINGS } from '../data/buildings.js';
import { UPGRADES, UPGRADE_BY_ID } from '../data/upgrades.js';
import { PATENT_BY_ID } from '../data/patents.js';
import { PHASE_BY_ID, REGION_INDEX } from '../data/phases.js';

export const COST_GROWTH = 1.15;
export const ACHIEVEMENT_BONUS = 0.01;  // +1 % FP/s je Erfolg
export const TEAR_BONUS = 0.02;         // +2 % FP/s je Aluhut-Träne
export const ALUHUT_PENALTY = 0.1;      // −10 % FP/s je aktivem Aluhutträger
export const ALUHUT_PENALTY_MAX = 0.5;
export const OFFLINE_RATE = 0.5;
export const TEAR_DIVISOR = 4e9;        // Tränen = floor(sqrt(Gesamt-FP / TEAR_DIVISOR))

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

function applyEffect(m, e) {
  switch (e.type) {
    case 'building': m.building[e.building] = (m.building[e.building] || 1) * e.mult; break;
    case 'click': m.click *= e.mult; break;
    case 'clickCps': m.clickCps += e.pct; break;
    case 'global': m.global *= e.mult; break;
    case 'reach': m.reach *= e.mult; break;
    case 'goldenInterval': m.goldenInterval *= e.mult; break;
    case 'goldenDuration': m.goldenDuration *= e.mult; break;
    case 'aluhut': m.aluhutMult *= e.mult; break;
    case 'offline': m.offlineRate = Math.max(m.offlineRate, e.rate); break;
    case 'autoClick': m.autoClick += e.perSec; break;
    case 'achBonus': m.achBonus = Math.max(m.achBonus, e.value); break;
    case 'takeMult': m.takeMult *= e.mult; break;
  }
}

export function modifiers(s) {
  const m = {
    building: {}, click: 1, clickCps: 0, global: 1, reach: 1, goldenInterval: 1, goldenDuration: 1, aluhutMult: 1,
    offlineRate: OFFLINE_RATE, autoClick: 0, achBonus: ACHIEVEMENT_BONUS, takeMult: 1,
  };
  for (const id of s.upgrades) {
    const e = UPGRADE_BY_ID[id]?.effect;
    if (e) applyEffect(m, e);
  }
  for (const id of s.patents || []) {
    const e = PATENT_BY_ID[id]?.effect;
    if (e) applyEffect(m, e);
  }
  return m;
}

/** Summe der Übernahme-Boni (je nach Phase unterschiedlich hoch). */
export function takeoverBonus(s) {
  let sum = 0;
  for (const code of s.taken) sum += REGION_INDEX[code]?.phase.takeBonus || 0;
  return sum;
}

export function bonusMult(s, m = modifiers(s)) {
  return 1 + takeoverBonus(s) * m.takeMult + m.achBonus * s.achievements.length + TEAR_BONUS * (s.tears || 0);
}

/** FP/s einer einzelnen Anlage (inkl. aller dauerhaften Multiplikatoren). */
export function unitCps(s, m, b) {
  return b.cps * (m.building[b.id] || 1) * m.global * bonusMult(s, m);
}

export function rawCps(s, m) {
  let sum = 0;
  for (const b of BUILDINGS) sum += (s.owned[b.id] || 0) * b.cps * (m.building[b.id] || 1);
  return sum * m.global * bonusMult(s, m);
}

export function buffMult(s, now, key) {
  let x = 1;
  for (const b of s.buffs) if (b.until > now && b[key]) x *= b[key];
  return x;
}

export function aluhutPenalty(n) {
  return 1 - Math.min(ALUHUT_PENALTY_MAX, ALUHUT_PENALTY * n);
}

export function currentPhase(s) {
  return PHASE_BY_ID[s.phase] || PHASE_BY_ID[1];
}

/**
 * Kontrolle je Region der aktuellen Phase.
 * Lokale Anlagen wirken nur in ihrer Region (Überschuss verfällt).
 * Gebietsweite Anlagen füllen die verbleibenden Lücken proportional auf.
 * Die geerbte Region (eroberte Vorphase) zählt immer voll.
 */
export function computeControl(s, m, phase = currentPhase(s)) {
  const local = {};
  for (const r of phase.open) local[r.code] = 0;
  let national = 0;
  for (const b of BUILDINGS) {
    const reach = b.reach * m.reach;
    if (b.scope === 'national') {
      national += (s.owned[b.id] || 0) * reach;
    } else {
      const p = s.placed[b.id];
      if (p) for (const code in p) if (code in local) local[code] += p[code] * reach;
    }
  }
  const rem = {};
  let remTotal = 0;
  for (const r of phase.open) {
    rem[r.code] = Math.max(0, r.pop - local[r.code]);
    remTotal += rem[r.code];
  }
  const fill = remTotal > 0 ? Math.min(1, national / remTotal) : 0;
  const control = {};
  let controlled = 0;
  for (const r of phase.regions) {
    if (r.inherited) {
      control[r.code] = 1;
      controlled += r.pop;
      continue;
    }
    const covered = Math.min(r.pop, local[r.code]) + rem[r.code] * fill;
    control[r.code] = Math.min(1, covered / r.pop);
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
  const phase = currentPhase(s);
  const { control, controlled, local, fill, rem } = computeControl(s, mods, phase);
  return { mods, rawCps: raw, cps, perClick, control, controlled, local, fill, rem, phase, ratio: controlled / phase.total };
}

export function availableUpgrades(s, d) {
  return UPGRADES.filter((u) => !s.upgrades.includes(u.id) && u.unlock(s, d)).sort((a, b) => a.cost - b.cost);
}

/** Erst ab der passenden Phase; dann sichtbar, sobald besessen oder 30 % des Basispreises jemals verdient wurden. */
export function isBuildingVisible(s, b) {
  if (b.phase && s.phase < b.phase) return false;
  return b.index === 0 || (s.owned[b.id] || 0) > 0 || s.fpAll >= b.baseCost * 0.3;
}

export function isTaken(ratio) {
  return ratio >= 1 - 1e-9;
}

// ---------- Prestige ----------

/** Wie viele Tränen insgesamt hätte man bei diesem Gesamt-FP verdient? */
export function tearsFor(fpAll) {
  return Math.floor(Math.sqrt(Math.max(0, fpAll) / TEAR_DIVISOR));
}

/** Tränen, die ein Neustart jetzt zusätzlich bringen würde. */
export function pendingTears(s) {
  return Math.max(0, tearsFor(s.fpAll) - (s.tears || 0));
}

/** Gesamt-FP, ab dem die nächste Träne fällig wird. */
export function fpForTears(n) {
  return n * n * TEAR_DIVISOR;
}
