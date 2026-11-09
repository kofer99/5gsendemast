// Spiellogik: Ticks, Aktionen, Ereignisse. Kein DOM – die Oberfläche hört auf Events.
import { BUILDINGS, BUILDING_BY_ID } from '../data/buildings.js';
import { UPGRADE_BY_ID } from '../data/upgrades.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { PATENT_BY_ID } from '../data/patents.js';
import { PHASE_BY_ID, REGION_INDEX, LAST_PHASE, PRESTIGE_PHASE } from '../data/phases.js';
import { MAP_DE } from '../data/map-de.js';
import { newState } from './state.js';
import * as eco from './economy.js';

export const OFFLINE_MAX_SEC = 12 * 3600;
export const MAX_MARKERS = 400; // je Phase
const ALUHUT_LIFE = 60_000;
const INFLUENCER_LIFE = 45_000;
const GOLDEN_LIFE = 13_000;
const DEMO_LIFE = 50_000;
const DEMO_SIZE = 5;
const TRUPP_LIFE = 40_000;
const TRUPP_STEP = 8_000;   // so oft zieht der Wünschelruten-Trupp weiter
const TRUPP_HP = 3;
// Ab welcher Produktion die Sonderformen auftauchen und mit welcher Wahrscheinlichkeit (ein Würfelwurf je Spawn).
// Balancing der Ereignisse (DESIGN.md §4.7/§4.8, per Simulation abgestimmt am 09.11.2026).
// Ein normaler Aluhutträger bringt max(ALUHUT_REWARD_SEC Sek. Produktion, ALUHUT_REWARD_CLICKS Impulse).
export const ALUHUT_REWARD_SEC = 6;
export const ALUHUT_REWARD_CLICKS = 5;
// Belohnung je Figur als Vielfaches davon. Die Demo bringt zusätzlich DEMO_BONUS, wenn sie ganz aufgelöst ist.
export const ALUHUT_REWARD = { aluhut: 1, influencer: 4, trupp: 3, demo: 1 };
export const DEMO_BONUS = 3;
export const INAUGURATION_SEC = 5;          // Einweihungsbonus: Sekunden Produktion …
export const INAUGURATION_MAX_PRICE = 0.5;  // … aber höchstens dieser Anteil des Kaufpreises
export const GOLDEN_INTERVAL = [300, 600]; // Sekunden zwischen zwei Goldenen Masten
export const RAUSCH = { mult: 4, sec: 44 };
export const KLICKWAHN = { mult: 77, sec: 13 };
export const SPECIAL_ALUHUTS = {
  influencer: { minCps: 500,   from: 0,    to: 0.10 },
  trupp:      { minCps: 3000,  from: 0.10, to: 0.22 },
  demo:       { minCps: 20000, from: 0.22, to: 0.30 },
};

// Diese Felder überleben einen Prestige-Neustart.
const KEEP_ON_PRESTIGE = [
  'version', 'runId', 'startedAt', 'lastTick', 'playtime', 'fpAll', 'clicks', 'clickFp', 'manualPlaced',
  'achievements', 'aluhutConverted', 'goldenClicked', 'funklochSeen', 'offlineReturns', 'introSeen', 'settings',
  'nickname', 'phaseReached', 'universeDone', 'tears', 'tearsSpent', 'patents', 'prestiges', 'bestControlledAll',
  'demosDissolved', 'truppsCaught', 'test',
];

export class Game {
  /**
   * @param {object} state  Spielstand (wird direkt verändert)
   * @param {object} opts   now(): ms, random(): [0,1), pointIn(code): {x,y}
   */
  constructor(state, { now = () => Date.now(), random = Math.random, pointIn = null } = {}) {
    this.s = state;
    this.now = now;
    this.random = random;
    this.pointIn = pointIn || ((code) => {
      const sh = REGION_INDEX[code].phase.map.shapes[code];
      return { x: sh.cx, y: sh.cy };
    });
    this.listeners = {};
    this.aluhuts = [];
    this.goldens = [];
    this.nextId = 1;
    this.eventsEnabled = true;
    const t = now();
    this.nextAluhutAt = t + 40_000;
    this.nextGoldenAt = t + 90_000 + random() * 90_000;
    this.lastAchCheck = 0;
    this.autoClickAcc = 0;
    this.countMarkers();
    this.refresh();
  }

  on(type, fn) { (this.listeners[type] ||= []).push(fn); }
  emit(type, payload) { for (const fn of this.listeners[type] || []) fn(payload); }

  get phase() { return eco.currentPhase(this.s); }

  refresh() {
    this.d = eco.derive(this.s, this.now(), this.aluhuts.length);
    return this.d;
  }

  earn(x) {
    if (!(x > 0)) return;
    this.s.fp += x;
    this.s.fpRun += x;
    this.s.fpAll += x;
  }

  countMarkers() {
    this.markerCount = {};
    for (const m of this.s.markers) this.markerCount[m.p] = (this.markerCount[m.p] || 0) + 1;
  }

  /** Beim Start aufrufen: rechnet die Abwesenheit nach. */
  applyOffline() {
    const t = this.now();
    const sec = (t - this.s.lastTick) / 1000;
    this.s.lastTick = t;
    if (sec < 60) return null;
    return this.grantOffline(sec, false);
  }

  grantOffline(sec, notify = true) {
    this.s.buffs = this.s.buffs.filter((b) => b.until > this.now());
    const d = this.refresh();
    const gain = d.rawCps * d.mods.offlineRate * Math.min(sec, OFFLINE_MAX_SEC);
    this.earn(gain);
    if (gain > 0) this.s.offlineReturns++;
    this.refresh();
    const info = { seconds: sec, gain, rate: d.mods.offlineRate };
    if (gain > 0 && notify) this.emit('offline', info);
    return info;
  }

  tick() {
    const t = this.now();
    const dt = (t - this.s.lastTick) / 1000;
    this.s.lastTick = t;
    if (dt <= 0) return;
    if (dt > 60) { // Standby / Tab lange eingefroren → wie offline behandeln
      this.grantOffline(dt);
      return;
    }
    this.s.playtime += dt;
    const before = this.s.buffs.length;
    this.s.buffs = this.s.buffs.filter((b) => b.until > t);
    if (this.s.buffs.length !== before) this.emit('buffs', this.s.buffs);
    let d = this.refresh();
    this.earn(d.cps * dt);
    if (d.mods.autoClick > 0) {
      const x = d.perClick * d.mods.autoClick * dt;
      this.earn(x);
      this.s.clickFp += x;
      this.autoClickAcc += dt;
      if (this.autoClickAcc >= 1) { this.autoClickAcc = 0; this.emit('autoPulse', {}); }
    }
    if (this.eventsEnabled) this.updateEvents(t);
    d = this.refresh();
    this.checkTakeovers(d);
    if (t - this.lastAchCheck >= 1000) {
      this.lastAchCheck = t;
      this.checkAchievements();
    }
  }

  // ---------- Aktionen ----------

  click(x, y) {
    const amount = this.d.perClick;
    this.earn(amount);
    this.s.clicks++;
    this.s.clickFp += amount;
    this.emit('pulse', { x, y, amount });
    return amount;
  }

  buy(id, n = 1) {
    const b = BUILDING_BY_ID[id];
    if (!b || (b.phase && this.s.phase < b.phase)) return false;
    const owned = this.s.owned[id] || 0;
    if (n === 'max') n = eco.maxAffordable(b, owned, this.s.fp);
    if (!(n >= 1)) return false;
    const cost = eco.buildingCost(b, owned, n);
    if (cost > this.s.fp) return false; // genau n Stück oder gar nichts – kein stiller Teilkauf
    this.s.fp -= cost;
    this.s.owned[id] = owned + n;
    if (!b.fixed && !this.s.settings.autoPlace && n === 1) {
      this.s.hand.push(id);
    } else {
      for (let i = 0; i < n; i++) this.autoPlace(id);
    }
    this.refresh();
    this.emit('bought', { id, n, cost });
    this.emit('hand', this.s.hand);
    return true;
  }

  buyUpgrade(id) {
    const u = UPGRADE_BY_ID[id];
    if (!u || this.s.upgrades.includes(id) || this.s.fp < u.cost || !u.unlock(this.s, this.d)) return false;
    this.s.fp -= u.cost;
    this.s.upgrades.push(id);
    this.refresh();
    this.emit('upgrade', u);
    return true;
  }

  /** Darf in dieser Region gerade gebaut werden? (aktuelle Phase, nicht geerbt) */
  canPlaceIn(code) {
    const r = this.phase.byCode[code];
    return !!r && !r.inherited;
  }

  /** Mast aus der Hand in eine Region setzen (Klick auf die Karte). */
  placeFromHand(code, x, y) {
    if (!this.s.hand.length || !this.canPlaceIn(code)) return false;
    const id = this.s.hand.shift();
    this.place(id, code, { x, y });
    this.s.manualPlaced++;
    const before = this.d;
    // Höchstens der halbe Preis der Anlage, sonst lohnt es sich, endlos billige Funkmasten zu kaufen und einzuweihen.
    const b = BUILDING_BY_ID[id];
    const price = eco.buildingCost(b, Math.max(0, (this.s.owned[id] || 1) - 1));
    const bonus = Math.max(before.basePerClick * 3, Math.min(before.rawCps * INAUGURATION_SEC, price * INAUGURATION_MAX_PRICE));
    this.earn(bonus);
    this.refresh();
    this.emit('inauguration', { id, code, x, y, amount: bonus });
    this.emit('hand', this.s.hand);
    return true;
  }

  autoPlaceHand() {
    while (this.s.hand.length) this.autoPlace(this.s.hand.shift());
    this.refresh();
    this.emit('hand', this.s.hand);
  }

  setAutoPlace(on) {
    this.s.settings.autoPlace = !!on;
    if (on) this.autoPlaceHand();
  }

  autoPlace(id) {
    const b = BUILDING_BY_ID[id];
    let code;
    let pt;
    if (b.fixed === 'bielefeld') {
      code = 'NW';
      pt = { x: MAP_DE.bielefeld.x + (this.random() - 0.5) * 14, y: MAP_DE.bielefeld.y + (this.random() - 0.5) * 14 };
    } else if (b.scope === 'national') {
      code = this.pickWeighted(this.phase.open, (r) => Math.sqrt(r.pop)).code;
      pt = this.pointIn(code);
    } else {
      code = this.weakestRegion();
      pt = this.pointIn(code);
    }
    this.place(id, code, pt);
  }

  place(id, code, pt) {
    const b = BUILDING_BY_ID[id];
    if (b.scope === 'local') {
      const p = (this.s.placed[id] ||= {});
      p[code] = (p[code] || 0) + 1;
    }
    const phaseId = REGION_INDEX[code].phase.id;
    if ((this.markerCount[phaseId] || 0) < MAX_MARKERS) {
      const m = { b: id, s: code, p: phaseId, x: Math.round(pt.x * 10) / 10, y: Math.round(pt.y * 10) / 10 };
      this.s.markers.push(m);
      this.markerCount[phaseId] = (this.markerCount[phaseId] || 0) + 1;
      this.emit('marker', m);
    }
  }

  /** Region mit dem geringsten Kontrollanteil (bei Gleichstand: mehr Einwohner zuerst). */
  weakestRegion() {
    const { control } = eco.computeControl(this.s, this.d.mods);
    let best = null;
    for (const r of this.phase.open) {
      if (!best || control[r.code] < control[best.code] - 1e-12) best = r;
    }
    return best.code;
  }

  /** Alter Name, bleibt für Tests und Simulation. */
  weakestState() { return this.weakestRegion(); }

  pickWeighted(list, weight) {
    const total = list.reduce((a, x) => a + weight(x), 0);
    let r = this.random() * total;
    for (const x of list) {
      r -= weight(x);
      if (r <= 0) return x;
    }
    return list[list.length - 1];
  }

  // ---------- Ereignisse: Aluhutträger & Goldener Mast ----------

  maxAluhuts() {
    return Math.min(4, 1 + Math.floor(Math.log10(Math.max(1, this.d.controlled)) / 2.5));
  }

  updateEvents(t) {
    const goneA = this.aluhuts.filter((a) => a.until <= t);
    if (goneA.length) {
      this.aluhuts = this.aluhuts.filter((a) => a.until > t);
      goneA.forEach((a) => this.emit('aluhutLeave', a));
    }
    const goneG = this.goldens.filter((g) => g.until <= t);
    if (goneG.length) {
      this.goldens = this.goldens.filter((g) => g.until > t);
      goneG.forEach((g) => this.emit('goldenLeave', g));
    }
    this.moveTrupps(t);
    if (t >= this.nextAluhutAt) {
      this.nextAluhutAt = t + (30 + this.random() * 60) * 1000;
      if (this.d.controlled >= 2000 && this.aluhuts.length < this.maxAluhuts()) this.spawnAluhut(t);
    }
    if (t >= this.nextGoldenAt) {
      const [lo, hi] = GOLDEN_INTERVAL;
      this.nextGoldenAt = t + (lo + this.random() * (hi - lo)) * 1000 * this.d.mods.goldenInterval;
      if (this.s.fpAll >= 150 && !this.goldens.length) this.spawnGolden(t);
    }
  }

  /** Wählt die Region für einen neuen Aluhutträger (gewichtet nach Kontrolle und Größe). */
  aluhutRegion() {
    const ctrl = this.d.control;
    let candidates = this.phase.open.filter((r) => ctrl[r.code] > 0);
    // Zu Beginn einer neuen Phase ist oft noch nichts abgedeckt – dann tauchen sie überall auf.
    if (!candidates.length && this.s.phase > 1) candidates = this.phase.open;
    if (!candidates.length) return null;
    return this.pickWeighted(candidates, (x) => Math.max(ctrl[x.code], 0.05) * Math.sqrt(x.pop));
  }

  /** Welche Sonderform? Ein Würfelwurf, erst ab 500 FP/s (wie früher beim Influencer). */
  rollAluhutKind() {
    const cps = this.d.rawCps;
    if (cps < SPECIAL_ALUHUTS.influencer.minCps) return 'aluhut';
    const roll = this.random();
    for (const [kind, k] of Object.entries(SPECIAL_ALUHUTS)) {
      if (cps >= k.minCps && roll >= k.from && roll < k.to) return kind;
    }
    return 'aluhut';
  }

  spawnAluhut(t = this.now(), kind = null) {
    const r = this.aluhutRegion();
    if (!r) return null;
    kind ||= this.rollAluhutKind();
    // Eine Demo kommt nur, wenn gerade niemand sonst protestiert (sonst wäre sofort −50 %).
    if (kind === 'demo') return this.aluhuts.length ? this.spawnAluhut(t, 'aluhut') : this.spawnDemo(t, r);
    if (kind === 'trupp') return this.spawnTrupp(t, r);
    const influencer = kind === 'influencer';
    const pt = this.pointIn(r.code);
    const a = {
      id: this.nextId++, code: r.code, p: this.s.phase, x: pt.x, y: pt.y,
      kind, hp: influencer ? 10 : 1, maxHp: influencer ? 10 : 1,
      until: t + (influencer ? INFLUENCER_LIFE : ALUHUT_LIFE),
    };
    this.aluhuts.push(a);
    this.refresh();
    this.emit('aluhutSpawn', a);
    return a;
  }

  /** Aluhut-Demo: fünf Figuren in einer Region. Jede kostet 10 %, wer alle überzeugt, bekommt eine Prämie. */
  spawnDemo(t = this.now(), r = this.aluhutRegion()) {
    if (!r) return null;
    const group = this.nextId++;
    const members = [];
    for (let i = 0; i < DEMO_SIZE; i++) {
      const pt = this.pointIn(r.code);
      const a = {
        id: this.nextId++, code: r.code, p: this.s.phase, x: pt.x, y: pt.y,
        kind: 'demo', group, hp: 1, maxHp: 1, until: t + DEMO_LIFE,
      };
      this.aluhuts.push(a);
      members.push(a);
    }
    this.refresh();
    for (const a of members) this.emit('aluhutSpawn', a);
    this.emit('demoSpawn', { group, code: r.code, name: r.name, members });
    return members[0];
  }

  /** Wünschelruten-Trupp: braucht drei Klicks und zieht alle 8 Sekunden in eine andere Region weiter. */
  spawnTrupp(t = this.now(), r = this.aluhutRegion()) {
    if (!r) return null;
    const pt = this.pointIn(r.code);
    const a = {
      id: this.nextId++, code: r.code, p: this.s.phase, x: pt.x, y: pt.y,
      kind: 'trupp', hp: TRUPP_HP, maxHp: TRUPP_HP, until: t + TRUPP_LIFE, nextMove: t + TRUPP_STEP, step: TRUPP_STEP,
    };
    this.aluhuts.push(a);
    this.refresh();
    this.emit('aluhutSpawn', a);
    return a;
  }

  moveTrupps(t) {
    for (const a of this.aluhuts) {
      if (a.kind !== 'trupp' || t < a.nextMove) continue;
      a.nextMove = t + TRUPP_STEP;
      const r = this.pickWeighted(this.phase.open, (x) => Math.sqrt(x.pop));
      const pt = this.pointIn(r.code);
      a.code = r.code; a.x = pt.x; a.y = pt.y;
      this.emit('aluhutMove', a);
    }
  }

  hitAluhut(id) {
    const a = this.aluhuts.find((x) => x.id === id);
    if (!a) return null;
    a.hp--;
    if (a.hp > 0) { this.emit('aluhutHit', a); return a; }
    this.aluhuts = this.aluhuts.filter((x) => x.id !== id);
    this.s.aluhutConverted++;
    const d = this.refresh();
    const base = Math.max(d.rawCps * ALUHUT_REWARD_SEC, d.basePerClick * ALUHUT_REWARD_CLICKS) * d.mods.aluhutMult;
    const reward = base * (ALUHUT_REWARD[a.kind] || 1);
    this.earn(reward);
    this.emit('aluhutConverted', { ...a, reward });
    if (a.kind === 'trupp') {
      this.s.truppsCaught = (this.s.truppsCaught || 0) + 1;
      this.emit('truppCaught', { ...a, reward });
    }
    // Letzte Figur einer Demo überzeugt → Versammlung aufgelöst, Prämie obendrauf.
    if (a.kind === 'demo' && !this.aluhuts.some((x) => x.group === a.group)) {
      const bonus = base * DEMO_BONUS;
      this.earn(bonus);
      this.s.demosDissolved = (this.s.demosDissolved || 0) + 1;
      this.emit('demoDissolved', { ...a, reward: bonus });
    }
    return a;
  }

  spawnGolden(t = this.now()) {
    const r = this.pickWeighted(this.phase.open, (x) => Math.sqrt(x.pop));
    const pt = this.pointIn(r.code);
    const g = { id: this.nextId++, p: this.s.phase, x: pt.x, y: pt.y, until: t + GOLDEN_LIFE };
    this.goldens.push(g);
    this.emit('goldenSpawn', g);
    return g;
  }

  clickGolden(id) {
    const g = this.goldens.find((x) => x.id === id);
    if (!g) return null;
    this.goldens = this.goldens.filter((x) => x.id !== id);
    this.s.goldenClicked++;
    const t = this.now();
    const dur = this.d.mods.goldenDuration;
    const r = this.random();
    let effect;
    if (r < 0.08 && this.s.goldenClicked > 3) {
      this.addBuff({ id: 'funkloch', mult: 0.5, until: t + 30_000 });
      this.s.funklochSeen++;
      effect = { id: 'funkloch', title: 'FUNKLOCH!', text: 'Produktion ×0,5 für 30 Sek. Typisch Deutschland.' };
    } else if (r < 0.5) {
      this.addBuff({ id: 'rausch', mult: RAUSCH.mult, until: t + RAUSCH.sec * 1000 * dur });
      effect = { id: 'rausch', title: 'FREQUENZRAUSCH!', text: `FP/Sek. ×${RAUSCH.mult} für ${Math.round(RAUSCH.sec * dur)} Sek.` };
    } else if (r < 0.9) {
      const gain = Math.min(this.s.fp * 0.15, this.d.rawCps * 900) + 13;
      this.earn(gain);
      effect = { id: 'fund', title: 'GLÜCKSFUND!', amount: gain };
    } else {
      this.addBuff({ id: 'klickwahn', clickMult: KLICKWAHN.mult, until: t + KLICKWAHN.sec * 1000 * dur });
      effect = { id: 'klickwahn', title: 'KLICKWAHN!', text: `Impulse ×${KLICKWAHN.mult} für ${Math.round(KLICKWAHN.sec * dur)} Sek.` };
    }
    this.refresh();
    this.emit('golden', { ...effect, x: g.x, y: g.y, p: g.p });
    this.emit('buffs', this.s.buffs);
    return effect;
  }

  addBuff(buff) {
    this.s.buffs = this.s.buffs.filter((b) => b.id !== buff.id);
    this.s.buffs.push(buff);
  }

  /** Ereignisse der alten Phase verschwinden beim Phasenwechsel. */
  clearEvents() {
    for (const a of this.aluhuts) this.emit('aluhutLeave', a);
    for (const g of this.goldens) this.emit('goldenLeave', g);
    this.aluhuts = [];
    this.goldens = [];
  }

  // ---------- Fortschritt ----------

  checkTakeovers(d) {
    if (d.controlled > this.s.bestControlled) this.s.bestControlled = d.controlled;
    if (d.controlled > this.s.bestControlledAll) this.s.bestControlledAll = d.controlled;
    const phase = this.phase;
    let changed = false;
    for (const r of phase.open) {
      if (!this.s.taken.includes(r.code) && eco.isTaken(d.control[r.code])) {
        this.s.taken.push(r.code);
        changed = true;
        this.emit('takeover', { ...r, phase });
      }
    }
    if (changed) this.refresh();
    if (phase.open.every((r) => this.s.taken.includes(r.code))) this.completePhase();
  }

  completePhase() {
    const from = this.phase;
    if (from.id >= LAST_PHASE) {
      // universeRun gilt für diesen Durchlauf, universeDone für immer (Erfolg, Statistik).
      if (!this.s.universeRun) {
        this.s.universeRun = true;
        this.s.universeDone = true;
        this.emit('universe', { phase: from });
      }
      return;
    }
    const to = PHASE_BY_ID[from.id + 1];
    this.s.phase = to.id;
    this.s.phaseReached = Math.max(this.s.phaseReached || 1, to.id);
    // Was noch in der Hand liegt, wird im neuen Gebiet aufgestellt.
    this.clearEvents();
    this.refresh();
    if (this.s.hand.length) this.autoPlaceHand();
    this.emit('phase', { from, to });
  }

  checkAchievements() {
    let changed = false;
    for (const a of ACHIEVEMENTS) {
      if (!this.s.achievements.includes(a.id) && a.check(this.s, this.d)) {
        this.s.achievements.push(a.id);
        changed = true;
        this.emit('achievement', a);
      }
    }
    if (changed) this.refresh();
  }

  // ---------- Prestige ----------

  canPrestige() {
    return this.s.phase > PRESTIGE_PHASE && eco.pendingTears(this.s) >= 1;
  }

  /** Neustart nach Weltherrschaft: alles weg außer Tränen, Patenten, Erfolgen und Statistik. */
  prestige() {
    if (!this.canPrestige()) return false;
    const gained = eco.pendingTears(this.s);
    const keep = {};
    for (const k of KEEP_ON_PRESTIGE) keep[k] = this.s[k];
    const fresh = newState(this.now());
    for (const k of Object.keys(this.s)) delete this.s[k];
    Object.assign(this.s, fresh, keep);
    this.s.tears = (keep.tears || 0) + gained;
    this.s.prestiges = (keep.prestiges || 0) + 1;
    this.s.lastTick = this.now();
    this.clearEvents();
    this.countMarkers();
    // Start-Patente anwenden
    for (const id of this.s.patents) {
      const e = PATENT_BY_ID[id]?.effect;
      if (e?.type !== 'start') continue;
      if (e.fp) this.earnStart(e.fp);
      if (e.owned) {
        for (const [bid, n] of Object.entries(e.owned)) {
          this.s.owned[bid] = (this.s.owned[bid] || 0) + n;
          for (let i = 0; i < n; i++) this.autoPlace(bid);
        }
      }
    }
    this.refresh();
    this.emit('prestige', { gained, tears: this.s.tears });
    return gained;
  }

  /** Startgeld zählt nicht als verdient (sonst gäbe es Tränen aus dem Nichts). */
  earnStart(x) {
    this.s.fp += x;
  }

  buyPatent(id) {
    const p = PATENT_BY_ID[id];
    if (!p || this.s.patents.includes(id)) return false;
    if ((this.s.tears || 0) - (this.s.tearsSpent || 0) < p.cost) return false;
    this.s.tearsSpent = (this.s.tearsSpent || 0) + p.cost;
    this.s.patents.push(id);
    this.refresh();
    this.emit('patent', p);
    return true;
  }
}

export { BUILDINGS };
