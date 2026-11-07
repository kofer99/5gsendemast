// Kopfzeile, Ticker, Toasts, Dialoge, Tabs, Erfolge, Statistik.
import { NEWS } from '../data/news.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { BUILDING_BY_ID } from '../data/buildings.js';
import { TOTAL_POP } from '../data/states.js';
import { fmt, fmtInt, fmtPct, fmtDuration } from '../util/format.js';
import { icon } from './icons.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Kopfzeile & Kartenfuß ----------
export class Hud {
  constructor(game) {
    this.game = game;
    this.els = {
      controlled: $('controlled'), fp: $('fp'), cps: $('cps'), perClick: $('perclick'),
      covFill: $('coverage-fill'), covPct: $('coverage-pct'), hand: $('hand-info'), buffs: $('buffs'),
    };
    this.handKey = null;
    this.lastTitle = 0;
  }

  update(now) {
    const { s, d } = this.game;
    const e = this.els;
    e.controlled.textContent = fmtInt(d.controlled);
    e.fp.textContent = fmt(s.fp);
    e.cps.textContent = fmt(d.cps, { decimals: true });
    e.perClick.textContent = fmt(d.perClick, { decimals: true });
    const ratio = d.controlled / TOTAL_POP;
    e.covFill.style.width = Math.min(100, ratio * 100) + '%';
    e.covPct.textContent = fmtPct(ratio);
    this.updateHand();
    this.updateBuffs(now);
    if (now - this.lastTitle > 2000) {
      this.lastTitle = now;
      document.title = `${fmt(d.controlled)} kontrolliert – Projekt Sendemast`;
    }
  }

  updateHand() {
    const s = this.game.s;
    const key = s.hand.join(',') + '|' + s.settings.autoPlace;
    if (key === this.handKey) return;
    this.handKey = key;
    const el = this.els.hand;
    el.innerHTML = '';
    if (s.hand.length) {
      const counts = {};
      for (const id of s.hand) counts[id] = (counts[id] || 0) + 1;
      const txt = Object.entries(counts).map(([id, n]) => `${n}× ${BUILDING_BY_ID[id].name}`).join(', ');
      const line = document.createElement('span');
      line.className = 'hand-active';
      const national = s.hand.some((id) => BUILDING_BY_ID[id].scope === 'national');
      line.textContent = `IN DER HAND: ${txt} → AUF DIE KARTE KLICKEN (+ EINWEIHUNGSBONUS)`
        + (national ? ' · LANDESWEITE ANLAGEN WIRKEN ÜBERALL, DER ORT IST NUR OPTIK' : '');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'ALLE AUTOMATISCH PLATZIEREN';
      btn.addEventListener('click', () => this.game.autoPlaceHand());
      el.append(line, btn);
    } else {
      el.innerHTML = s.settings.autoPlace
        ? '<span>KLICK AUF KARTE = IMPULS · LEERTASTE = IMPULS (KAUFT NIE ETWAS)</span><span>AUTO-PLATZIERUNG AKTIV</span>'
        : '<span>KLICK AUF KARTE = IMPULS · LEERTASTE = IMPULS (KAUFT NIE ETWAS)</span><span>GEKAUFTE MASTEN SELBST AUFSTELLEN</span>';
    }
  }

  updateBuffs(now) {
    const buffs = this.game.s.buffs.filter((b) => b.until > now);
    const names = { rausch: 'FREQUENZRAUSCH ×7', klickwahn: 'KLICKWAHN ×777', funkloch: 'FUNKLOCH ×0,5' };
    const alu = this.game.aluhuts.length;
    const parts = buffs.map((b) => `<div class="buff${b.id === 'funkloch' ? ' bad' : ''}">${names[b.id] || b.id} · ${Math.ceil((b.until - now) / 1000)} s</div>`);
    if (alu) parts.push(`<div class="buff bad">${alu}× ALUHUT · SIGNAL −${Math.min(50, alu * 10)} %</div>`);
    const html = parts.join('');
    if (html !== this.buffHtml) { this.buffHtml = html; this.els.buffs.innerHTML = html; }
  }
}

// ---------- News-Ticker ----------
export class Ticker {
  constructor(el, game) {
    this.el = el;
    this.game = game;
    this.recent = [];
    el.addEventListener('animationend', () => this.next());
    this.next();
  }

  next() {
    const { s, d } = this.game;
    const pool = NEWS.filter((n, i) => !this.recent.includes(i) && (!n.when || n.when(s, d)));
    const factChance = 0.18;
    const facts = pool.filter((n) => n.fact);
    const jokes = pool.filter((n) => !n.fact);
    const list = facts.length && (Math.random() < factChance || !jokes.length) ? facts : jokes;
    const item = list[Math.floor(Math.random() * list.length)] || NEWS[0];
    this.recent.push(NEWS.indexOf(item));
    if (this.recent.length > 12) this.recent.shift();

    const el = this.el;
    el.classList.remove('run');
    el.classList.toggle('fact', !!item.fact);
    el.textContent = item.fact ? `+++ ${item.text} → MEHR ERFAHREN +++` : `+++ ${item.text} +++`;
    el.href = item.fact ? '/geheimakte/' : '#';
    el.tabIndex = item.fact ? 0 : -1;
    if (reducedMotion()) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.next(), 9000);
      return;
    }
    const track = el.parentElement.clientWidth;
    const w = el.scrollWidth;
    el.style.setProperty('--from', track + 'px');
    el.style.setProperty('--to', -w + 'px');
    el.style.setProperty('--dur', ((track + w) / 90).toFixed(1) + 's');
    void el.offsetWidth;
    el.classList.add('run');
  }
}

// ---------- Toasts ----------
export function toast(title, text = '', kind = '') {
  const box = $('toasts');
  while (box.children.length >= 4) box.firstElementChild.remove();
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  const b = document.createElement('b');
  b.textContent = title;
  t.append(b);
  if (text) {
    const s = document.createElement('span');
    s.textContent = text;
    t.append(s);
  }
  box.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, 4500);
}

// ---------- Dialog ----------
/**
 * @param {{title:string, body:(string|Node)[], actions:{label:string,value:string,primary?:boolean,danger?:boolean}[]}} opts
 *   body: Strings werden als Absätze (Text, kein HTML) eingefügt, Nodes direkt.
 */
export function dialog({ title, body = [], actions = [{ label: 'OK', value: 'ok', primary: true }] }) {
  const dlg = $('dialog');
  $('dialog-title').textContent = title;
  const bodyEl = $('dialog-body');
  bodyEl.innerHTML = '';
  for (const part of body) {
    if (typeof part === 'string') {
      const p = document.createElement('p');
      p.textContent = part;
      bodyEl.append(p);
    } else bodyEl.append(part);
  }
  const act = $('dialog-actions');
  act.innerHTML = '';
  for (const a of actions) {
    const b = document.createElement('button');
    b.className = 'btn' + (a.primary ? ' btn-primary' : '') + (a.danger ? ' btn-danger' : '');
    if (a.primary) b.style.fontSize = '24px';
    b.value = a.value;
    b.textContent = a.label;
    act.append(b);
  }
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => resolve(dlg.returnValue || 'cancel'), { once: true });
    dlg.returnValue = '';
    dlg.showModal();
    act.querySelector('.btn-primary, .btn')?.focus();
  });
}

// ---------- Tabs ----------
export function setupTabs(onChange) {
  const tabs = [...document.querySelectorAll('.tab')];
  const select = (tab) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    }
    onChange?.(tab.getAttribute('aria-controls'));
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      n.focus();
      select(n);
    });
  });
}

// ---------- Erfolge ----------
export function renderAchievements(el, s) {
  const key = s.achievements.length;
  if (el.dataset.key === String(key)) return;
  el.dataset.key = String(key);
  el.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'section-label';
  head.textContent = `${s.achievements.length}/${ACHIEVEMENTS.length} ERFOLGE · JE +1 % FP/SEK.`;
  el.append(head);
  const list = document.createElement('div');
  list.className = 'ach-list';
  for (const a of ACHIEVEMENTS) {
    const done = s.achievements.includes(a.id);
    const row = document.createElement('div');
    row.className = 'ach' + (done ? ' done' : '');
    row.innerHTML = icon(done ? 'check' : 'lock', 20) + '<div><b></b><span></span></div>';
    row.querySelector('b').textContent = a.name;
    row.querySelector('span').textContent = a.desc;
    list.append(row);
  }
  el.append(list);
}

// ---------- Statistik ----------
export function renderStats(el, game) {
  const { s, d } = game;
  const totalOwned = Object.values(s.owned).reduce((a, b) => a + b, 0);
  const rows = [
    ['Spielzeit', fmtDuration(s.playtime)],
    ['Kontrollierte Menschen', fmtInt(d.controlled)],
    ['Bestwert', fmtInt(s.bestControlled)],
    ['Bundesländer übernommen', `${s.taken.length}/16`],
    ['Funkpunkte (aktuell)', fmt(s.fp)],
    ['Funkpunkte (insgesamt)', fmt(s.fpAll)],
    ['FP/Sek. (ohne Effekte)', fmt(d.rawCps, { decimals: true })],
    ['Impulse gesendet', fmtInt(s.clicks)],
    ['FP durch Impulse', fmt(s.clickFp)],
    ['Anlagen', fmtInt(totalOwned)],
    ['Von Hand platziert', fmtInt(s.manualPlaced)],
    ['Aluhutträger überzeugt', fmtInt(s.aluhutConverted)],
    ['Goldene Masten', fmtInt(s.goldenClicked)],
    ['Erfolge', `${s.achievements.length}/${ACHIEVEMENTS.length}`],
  ];
  el.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
}
