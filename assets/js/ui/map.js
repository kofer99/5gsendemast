// SVG-Karte: Bundesländer, Masten, Effekte, Aluhutträger & Goldene Masten.
import { MAP_DE } from '../data/map-de.js';
import { STATES, STATE_BY_CODE } from '../data/states.js';
import { BUILDING_BY_ID } from '../data/buildings.js';
import { GLYPH, icon } from './icons.js';
import { fmt, fmtPct } from '../util/format.js';
import { isTaken } from '../core/economy.js';

const NS = 'http://www.w3.org/2000/svg';
// Große Flächen zuerst, Stadtstaaten zuletzt (liegen innerhalb anderer Länder).
const DRAW_ORDER = ['BY', 'BW', 'NW', 'NI', 'HE', 'RP', 'SN', 'TH', 'ST', 'BB', 'MV', 'SH', 'SL', 'BE', 'HB', 'HH'];
const ENCLAVES = { BB: ['BE'], NI: ['HB', 'HH'], SH: ['HH'] };
const LABELS = { Berlin: [8, -8], Hamburg: [8, -6], München: [8, 4], Köln: [-44, -8], Frankfurt: [8, 4], Stuttgart: [8, 4], Leipzig: [8, 4], Dresden: [8, 4], Hannover: [8, 4] };
const MAX_FLOATS = 24;

const [, , VW, VH] = MAP_DE.viewBox;
// Logarithmisch, damit 400 und 650.000 Menschen beide sinnvoll aussehen.
const coverageRadius = (reach) => Math.max(9, 4 * Math.log10(reach) - 2);
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

export class MapView {
  constructor(frame, tooltip) {
    this.frame = frame;
    this.tooltip = tooltip;
    this.paths = {};
    this.lastFill = {};
    this.entities = new Map();
    this.floats = 0;
    this.build();
  }

  build() {
    const svg = el('svg', { viewBox: MAP_DE.viewBox.join(' '), role: 'img', 'aria-label': 'Karte Deutschlands mit den 16 Bundesländern. Klicken sendet einen Strahlungsimpuls.' });
    svg.innerHTML = `
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="rgba(61,255,138,0.42)"/>
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(182,255,210,0.55)" stroke-width="2"/>
        </pattern>
      </defs>`;
    this.svg = svg;
    const gStates = el('g', { class: 'states' });
    for (const code of DRAW_ORDER) {
      const p = el('path', { d: MAP_DE.states[code].d, class: 'state', 'data-code': code });
      this.paths[code] = p;
      gStates.append(p);
    }
    svg.append(gStates);

    // Abdeckung + Masten
    this.gMarkers = el('g', { class: 'markers' });
    svg.append(this.gMarkers);

    // Städte
    const gCities = el('g', { class: 'cities' });
    for (const c of MAP_DE.cities) {
      if (!LABELS[c.name]) continue;
      const g = el('g', { class: 'city' });
      g.append(el('circle', { cx: c.x, cy: c.y, r: 2.4 }));
      const t = el('text', { x: c.x + LABELS[c.name][0], y: c.y + LABELS[c.name][1] });
      t.textContent = c.name === 'Berlin' ? 'BERLIN · BAfG-ZENTRALE' : c.name.toUpperCase();
      g.append(t);
      gCities.append(g);
    }
    svg.append(gCities);

    // Bielefeld (gibt es nicht)
    const bf = MAP_DE.bielefeld;
    this.gBielefeld = el('g', { class: 'bielefeld' });
    this.gBielefeld.append(el('circle', { cx: bf.x, cy: bf.y, r: 9 }));
    this.bielefeldText = el('text', { x: bf.x - 70, y: bf.y + 24 });
    this.bielefeldText.textContent = 'BIELEFELD? [NICHT GEFUNDEN]';
    this.gBielefeld.append(this.bielefeldText);
    svg.append(this.gBielefeld);

    // Radar über Berlin
    const be = MAP_DE.cities.find((c) => c.name === 'Berlin');
    const R = 110;
    // Reine Deko: Radar der (fiktiven) BAfG-Zentrale in Berlin – ohne Spielfunktion.
    const radar = el('g', { class: 'radar', style: `transform-origin:${be.x}px ${be.y}px` });
    radar.append(el('circle', { cx: be.x, cy: be.y, r: R, fill: 'none', stroke: 'rgba(61,255,138,0.18)', 'vector-effect': 'non-scaling-stroke' }));
    const a = (deg) => [be.x + R * Math.cos((deg * Math.PI) / 180), be.y + R * Math.sin((deg * Math.PI) / 180)];
    const [x1, y1] = a(-90); const [x2, y2] = a(-55);
    radar.append(el('path', { d: `M${be.x} ${be.y} L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`, fill: 'rgba(61,255,138,0.13)' }));
    svg.append(radar);

    this.gFx = el('g', { class: 'fx' });
    svg.append(this.gFx);

    this.overlay = document.createElement('div');
    this.overlay.className = 'map-overlay';
    this.frame.append(svg, this.overlay);
  }

  attach(game) {
    this.game = game;
    for (const m of game.s.markers) this.addMarker(m, false);

    this.svg.addEventListener('click', (e) => {
      const pt = this.toSvg(e.clientX, e.clientY);
      const code = e.target.closest?.('[data-code]')?.dataset.code;
      if (code && game.s.hand.length) game.placeFromHand(code, pt.x, pt.y);
      else game.click(pt.x, pt.y);
    });
    this.svg.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const code = e.target.closest?.('[data-code]')?.dataset.code;
      if (!code) { this.hideTip(); return; }
      this.showStateTip(code, e.clientX, e.clientY);
    });
    this.svg.addEventListener('pointerleave', () => this.hideTip());

    game.on('marker', (m) => this.addMarker(m, true));
    game.on('pulse', ({ x, y, amount }) => { this.ripple(x, y); this.float(x, y, '+' + fmt(amount, { decimals: true })); });
    game.on('inauguration', ({ x, y, amount, id }) => {
      this.ripple(x, y);
      this.float(x, y, `${BUILDING_BY_ID[id].name.toUpperCase()} EINGEWEIHT +${fmt(amount)}`, true);
    });
    game.on('aluhutSpawn', (a) => this.addEntity(a, 'aluhut'));
    game.on('aluhutLeave', (a) => this.removeEntity(a.id));
    game.on('aluhutHit', (a) => this.updateEntity(a));
    game.on('aluhutConverted', (a) => { this.removeEntity(a.id); this.float(a.x, a.y, `ÜBERZEUGT +${fmt(a.reward)}`, true); });
    game.on('goldenSpawn', (g) => this.addEntity(g, 'golden'));
    game.on('goldenLeave', (g) => this.removeEntity(g.id));
    game.on('golden', (g) => {
      this.float(g.x, g.y, g.amount != null ? `${g.title} +${fmt(g.amount)}` : g.title, true);
    });
    game.on('takeover', (st) => {
      const p = this.paths[st.code];
      p.classList.remove('flash');
      void p.getBBox();
      p.classList.add('flash');
      setTimeout(() => p.classList.remove('flash'), 1500);
    });
  }

  toSvg(cx, cy) {
    const p = new DOMPoint(cx, cy).matrixTransform(this.svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }

  /** Zufälliger Punkt innerhalb eines Bundeslands (für Auto-Platzierung & Ereignisse). */
  randomPoint(code) {
    const path = this.paths[code];
    try {
      const bb = path.getBBox();
      const excl = (ENCLAVES[code] || []).map((c) => this.paths[c]);
      for (let i = 0; i < 80; i++) {
        const x = bb.x + Math.random() * bb.width;
        const y = bb.y + Math.random() * bb.height;
        const pt = new DOMPoint(x, y);
        if (path.isPointInFill(pt) && !excl.some((p) => p.isPointInFill(pt))) return { x, y };
      }
    } catch { /* SVG noch nicht gerendert */ }
    return { x: MAP_DE.states[code].cx, y: MAP_DE.states[code].cy };
  }

  addMarker(m, animate) {
    const b = BUILDING_BY_ID[m.b];
    if (!b) return;
    const outer = el('g', { class: `mk ${b.scope}`, transform: `translate(${m.x} ${m.y})` });
    const inner = el('g', { class: 'mk-inner' + (animate ? ' pop' : '') });
    if (b.scope === 'local') inner.append(el('circle', { class: 'cov', r: coverageRadius(b.reach * (this.game?.d.mods.reach || 1)) }));
    inner.append(el('path', { d: GLYPH[b.icon] || GLYPH.mast }));
    outer.append(inner);
    this.gMarkers.append(outer);
  }

  ripple(x, y) {
    if (this.gFx.childElementCount > 12) return;
    const c = el('circle', { class: 'ripple', cx: x, cy: y, r: 12 });
    this.gFx.append(c);
    setTimeout(() => c.remove(), 850);
  }

  float(x, y, text, big = false) {
    if (this.floats >= MAX_FLOATS) return;
    this.floats++;
    const s = document.createElement('span');
    s.className = 'float' + (big ? ' big' : '');
    s.textContent = text;
    s.style.left = (x / VW) * 100 + '%';
    s.style.top = (y / VH) * 100 + '%';
    this.overlay.append(s);
    setTimeout(() => { s.remove(); this.floats--; }, 1150);
  }

  addEntity(obj, type) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ent ' + (type === 'golden' ? 'golden' : obj.kind);
    b.style.left = (obj.x / VW) * 100 + '%';
    b.style.top = (obj.y / VH) * 100 + '%';
    if (type === 'golden') {
      b.innerHTML = icon('golden', 26) + '<span class="ent-label">GOLDENER MAST</span>';
      b.setAttribute('aria-label', 'Goldener Mast – schnell anklicken!');
      b.addEventListener('click', (e) => { e.stopPropagation(); this.game.clickGolden(obj.id); this.removeEntity(obj.id); });
    } else {
      const label = obj.kind === 'influencer' ? 'TELEGRAM-INFLUENCER' : 'ALUHUT – SIGNAL −10 %';
      b.innerHTML = icon('aluhut', 26) + `<span class="ent-label">${label}</span>` + (obj.maxHp > 1 ? '<span class="hp"><span></span></span>' : '');
      b.setAttribute('aria-label', obj.kind === 'influencer'
        ? 'Telegram-Influencer überzeugen (mehrmals klicken)'
        : 'Aluhutträger mit Gratis-WLAN überzeugen');
      b.addEventListener('click', (e) => { e.stopPropagation(); this.game.hitAluhut(obj.id); });
    }
    this.overlay.append(b);
    this.entities.set(obj.id, b);
    this.updateEntity(obj);
  }

  updateEntity(obj) {
    const b = this.entities.get(obj.id);
    if (!b) return;
    const hp = b.querySelector('.hp > span');
    if (hp) hp.style.width = (obj.hp / obj.maxHp) * 100 + '%';
    if (obj.hp < obj.maxHp) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
  }

  removeEntity(id) {
    const b = this.entities.get(id);
    if (b) { b.remove(); this.entities.delete(id); }
  }

  update(d, s) {
    for (const st of STATES) {
      const c = d.control[st.code];
      const taken = s.taken.includes(st.code) || isTaken(c);
      const key = taken ? 'T' : c.toFixed(3);
      if (this.lastFill[st.code] === key) continue;
      this.lastFill[st.code] = key;
      const p = this.paths[st.code];
      p.classList.toggle('taken', taken);
      p.style.fill = taken ? 'url(#hatch)' : `rgba(61,255,138,${(0.04 + 0.4 * c).toFixed(3)})`;
    }
    const found = (s.owned.haarp || 0) > 0;
    if (found !== this.bielefeldFound) {
      this.bielefeldFound = found;
      this.gBielefeld.classList.toggle('found', found);
      this.bielefeldText.textContent = found ? 'BIELEFELD [BESTÄTIGT]' : 'BIELEFELD? [NICHT GEFUNDEN]';
    }
    this.frame.classList.toggle('placing', s.hand.length > 0);
    if (this.tipCode) this.showStateTip(this.tipCode);
  }

  showStateTip(code, x, y) {
    const st = STATE_BY_CODE[code];
    const d = this.game.d;
    const c = d.control[code];
    const masts = Object.values(this.game.s.placed).reduce((sum, p) => sum + (p[code] || 0), 0);
    this.tipCode = code;
    if (x != null) { this.tipX = x; this.tipY = y; }
    const t = this.tooltip;
    t.innerHTML = `<b>${st.name}</b>
      <div class="tip-row"><span>Einwohner</span><span>${fmt(st.pop)}</span></div>
      <div class="tip-row"><span>Kontrolliert</span><span>${fmtPct(c)}</span></div>
      <div class="tip-row"><span>· durch Anlagen im Land</span><span>${fmt(Math.min(st.pop, d.local[code]))}</span></div>
      <div class="tip-row"><span>· durch landesweite Anlagen</span><span>${fmt(d.rem[code] * d.fill)}</span></div>
      <div class="tip-row"><span>Lokale Anlagen vor Ort</span><span>${masts}</span></div>
      ${this.game.s.taken.includes(code) ? `<div class="tip-flavor">ÜBERNOMMEN – ${st.gag}</div>` : ''}
      ${this.game.s.hand.length ? '<div class="amber">Klicken, um den Mast hier aufzustellen</div>' : ''}`;
    t.hidden = false;
    const w = t.offsetWidth; const h = t.offsetHeight;
    t.style.left = Math.min(window.innerWidth - w - 8, this.tipX + 16) + 'px';
    t.style.top = Math.min(window.innerHeight - h - 8, this.tipY + 16) + 'px';
  }

  hideTip() {
    if (!this.tipCode) return;
    this.tipCode = null;
    this.tooltip.hidden = true;
  }
}
