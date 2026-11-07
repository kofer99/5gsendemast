// Spiellogik: Ticks, Aktionen, Ereignisse. Kein DOM – die Oberfläche hört auf Events.
import { BUILDINGS, BUILDING_BY_ID } from '../data/buildings.js';
import { UPGRADE_BY_ID } from '../data/upgrades.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { STATES, STATE_BY_CODE } from '../data/states.js';
import { MAP_DE } from '../data/map-de.js';
import * as eco from './economy.js';

export const OFFLINE_RATE = 0.5;
export const OFFLINE_MAX_SEC = 12 * 3600;
export const MAX_MARKERS = 400;
const ALUHUT_LIFE = 60_000;
const INFLUENCER_LIFE = 45_000;
const GOLDEN_LIFE = 13_000;

export class Game {
  /**
   * @param {object} state  Spielstand (wird direkt verändert)
   * @param {object} opts   now(): ms, random(): [0,1), pointIn(code): {x,y}
   */
  constructor(state, { now = () => Date.now(), random = Math.random, pointIn = null } = {}) {
    this.s = state;
    this.now = now;
    this.random = random;
    this.pointIn = pointIn || ((code) => ({ x: MAP_DE.states[code].cx, y: MAP_DE.states[code].cy }));
    this.listeners = {};
    this.aluhuts = [];
    this.goldens = [];
    this.nextId = 1;
    this.eventsEnabled = true;
    const t = now();
    this.nextAluhutAt = t + 40_000;
    this.nextGoldenAt = t + 90_000 + random() * 90_000;
    this.lastAchCheck = 0;
    this.refresh();
  }

  on(type, fn) { (this.listeners[type] ||= []).push(fn); }
  emit(type, payload) { for (const fn of this.listeners[type] || []) fn(payload); }

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
    const gain = d.rawCps * OFFLINE_RATE * Math.min(sec, OFFLINE_MAX_SEC);
    this.earn(gain);
    if (gain > 0) this.s.offlineReturns++;
    this.refresh();
    const info = { seconds: sec, gain };
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
    if (!b) return false;
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

  /** Mast aus der Hand in ein Bundesland setzen (Klick auf die Karte). */
  placeFromHand(code, x, y) {
    if (!this.s.hand.length || !STATE_BY_CODE[code]) return false;
    const id = this.s.hand.shift();
    this.place(id, code, { x, y });
    this.s.manualPlaced++;
    const before = this.d;
    const bonus = Math.max(before.rawCps * 5, before.perClick * 3);
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
      code = this.pickWeighted(STATES, (st) => st.pop).code;
      pt = this.pointIn(code);
    } else {
      code = this.weakestState();
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
    if (this.s.markers.length < MAX_MARKERS) {
      const m = { b: id, s: code, x: Math.round(pt.x * 10) / 10, y: Math.round(pt.y * 10) / 10 };
      this.s.markers.push(m);
      this.emit('marker', m);
    }
  }

  /** Bundesland mit dem geringsten Kontrollanteil (bei Gleichstand: mehr Einwohner zuerst). */
  weakestState() {
    const { control } = eco.computeControl(this.s, this.d.mods);
    let best = null;
    for (const st of STATES) {
      if (!best || control[st.code] < control[best.code] - 1e-12) best = st;
    }
    return best.code;
  }

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
    if (t >= this.nextAluhutAt) {
      this.nextAluhutAt = t + (30 + this.random() * 60) * 1000;
      if (this.d.controlled >= 2000 && this.aluhuts.length < this.maxAluhuts()) this.spawnAluhut(t);
    }
    if (t >= this.nextGoldenAt) {
      this.nextGoldenAt = t + (120 + this.random() * 180) * 1000 * this.d.mods.goldenInterval;
      if (this.s.fpAll >= 150 && !this.goldens.length) this.spawnGolden(t);
    }
  }

  spawnAluhut(t = this.now()) {
    const ctrl = this.d.control;
    const candidates = STATES.filter((st) => ctrl[st.code] > 0);
    if (!candidates.length) return null;
    const st = this.pickWeighted(candidates, (x) => ctrl[x.code] * x.pop);
    const influencer = this.d.rawCps >= 500 && this.random() < 0.15;
    const pt = this.pointIn(st.code);
    const a = {
      id: this.nextId++, code: st.code, x: pt.x, y: pt.y,
      kind: influencer ? 'influencer' : 'aluhut',
      hp: influencer ? 10 : 1, maxHp: influencer ? 10 : 1,
      until: t + (influencer ? INFLUENCER_LIFE : ALUHUT_LIFE),
    };
    this.aluhuts.push(a);
    this.refresh();
    this.emit('aluhutSpawn', a);
    return a;
  }

  hitAluhut(id) {
    const a = this.aluhuts.find((x) => x.id === id);
    if (!a) return null;
    a.hp--;
    if (a.hp > 0) { this.emit('aluhutHit', a); return a; }
    this.aluhuts = this.aluhuts.filter((x) => x.id !== id);
    this.s.aluhutConverted++;
    const d = this.refresh();
    const reward = Math.max(d.rawCps * 30, d.perClick * 10) * (a.kind === 'influencer' ? 10 : 1) * d.mods.aluhutMult;
    this.earn(reward);
    this.emit('aluhutConverted', { ...a, reward });
    return a;
  }

  spawnGolden(t = this.now()) {
    const st = this.pickWeighted(STATES, (x) => x.pop);
    const pt = this.pointIn(st.code);
    const g = { id: this.nextId++, x: pt.x, y: pt.y, until: t + GOLDEN_LIFE };
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
      this.addBuff({ id: 'rausch', mult: 7, until: t + 77_000 * dur });
      effect = { id: 'rausch', title: 'FREQUENZRAUSCH!', text: `FP/Sek. ×7 für ${Math.round(77 * dur)} Sek.` };
    } else if (r < 0.9) {
      const gain = Math.min(this.s.fp * 0.15, this.d.rawCps * 900) + 13;
      this.earn(gain);
      effect = { id: 'fund', title: 'GLÜCKSFUND!', amount: gain };
    } else {
      this.addBuff({ id: 'klickwahn', clickMult: 777, until: t + 13_000 * dur });
      effect = { id: 'klickwahn', title: 'KLICKWAHN!', text: `Impulse ×777 für ${Math.round(13 * dur)} Sek.` };
    }
    this.refresh();
    this.emit('golden', { ...effect, x: g.x, y: g.y });
    this.emit('buffs', this.s.buffs);
    return effect;
  }

  addBuff(buff) {
    this.s.buffs = this.s.buffs.filter((b) => b.id !== buff.id);
    this.s.buffs.push(buff);
  }

  // ---------- Fortschritt ----------

  checkTakeovers(d) {
    if (d.controlled > this.s.bestControlled) this.s.bestControlled = d.controlled;
    let changed = false;
    for (const st of STATES) {
      if (!this.s.taken.includes(st.code) && eco.isTaken(d.control[st.code])) {
        this.s.taken.push(st.code);
        changed = true;
        this.emit('takeover', st);
      }
    }
    if (changed) this.refresh();
    if (this.s.taken.length >= STATES.length && !this.s.germanyDone) {
      this.s.germanyDone = true;
      this.emit('germany', {});
    }
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
}

export { BUILDINGS };
