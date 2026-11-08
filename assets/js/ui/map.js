// SVG-Karten: eine Ebene je Phase (Deutschland, Europa, Welt, Orbit, Universum).
// Jede Ebene hat eigene Regionen, Masten, Effekte, Aluhutträger & Goldene Masten.
// Inaktive Ebenen bleiben im DOM (visibility: hidden), damit Zufallspunkte per isPointInFill funktionieren.
import { MAP_DE } from '../data/map-de.js';
import { PHASES, PHASE_BY_ID, REGION_INDEX } from '../data/phases.js';
import { BUILDING_BY_ID } from '../data/buildings.js';
import { GLYPH, icon } from './icons.js';
import { fmt, fmtPct } from '../util/format.js';
import { isTaken } from '../core/economy.js';

const NS = 'http://www.w3.org/2000/svg';
// Phase 1: große Flächen zuerst, Stadtstaaten zuletzt (liegen innerhalb anderer Länder).
const DRAW_ORDER_DE = ['BY', 'BW', 'NW', 'NI', 'HE', 'RP', 'SN', 'TH', 'ST', 'BB', 'MV', 'SH', 'SL', 'BE', 'HB', 'HH'];
const ENCLAVES = { BB: ['BE'], NI: ['HB', 'HH'], SH: ['HH'], MLS: ['SOL'], LEO: ['ISS'] };
const LABELS_DE = { Berlin: [8, -8], Hamburg: [8, -6], München: [8, 4], Köln: [-44, -8], Frankfurt: [8, 4], Stuttgart: [8, 4], Leipzig: [8, 4], Dresden: [8, 4], Hannover: [8, 4] };
// Größe von Mast-Symbolen und Abdeckungskreisen je Karte (Karten haben unterschiedliche Maßstäbe)
const SCALE = { 1: 1, 2: 0.75, 3: 0.6, 4: 0.9, 5: 0.9 };
const MAX_FLOATS = 24;

// Logarithmisch, damit 400 und 650.000 Menschen beide sinnvoll aussehen.
const coverageRadius = (reach) => Math.max(9, 4 * Math.log10(reach) - 2);
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

export class MapView {
  /**
   * @param {HTMLElement} frame    Container der Karte
   * @param {HTMLElement} tooltip  gemeinsamer Tooltip
   * @param {{tabs?:HTMLElement, title?:HTMLElement}} ui
   */
  constructor(frame, tooltip, ui = {}) {
    this.frame = frame;
    this.tooltip = tooltip;
    this.tabsEl = ui.tabs || null;
    this.titleEl = ui.title || null;
    this.layers = {};
    this.view = null;
    this.floats = 0;
    this.entities = new Map();
    this.ensureLayer(1);
    this.setView(1);
  }

  // ---------- Ebenen ----------

  ensureLayer(pid) {
    if (this.layers[pid]) return this.layers[pid];
    const phase = PHASE_BY_ID[pid];
    const vb = phase.map.viewBox;
    const wrap = document.createElement('div');
    wrap.className = 'map-layer off';
    wrap.dataset.phase = pid;
    const svg = el('svg', {
      viewBox: vb.join(' '), role: 'img',
      'aria-label': `Karte ${phase.name} mit ${phase.open.length} Gebieten. Klicken sendet einen Strahlungsimpuls.`,
    });
    svg.innerHTML = `
      <defs>
        <pattern id="hatch${pid}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="rgba(61,255,138,0.42)"/>
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(182,255,210,0.55)" stroke-width="2"/>
        </pattern>
      </defs>`;
    const layer = { pid, phase, vb, wrap, svg, paths: {}, lastFill: {}, scale: SCALE[pid] || 1 };

    // Deko unter den Regionen (Flugbahnen, Spiralarme)
    if (phase.map.deco) {
      const gDeco = el('g', { class: 'deco' });
      for (const d of phase.map.deco) gDeco.append(el('path', { d }));
      svg.append(gDeco);
    }

    const gStates = el('g', { class: 'states' });
    const shapes = phase.map.shapes;
    const order = pid === 1 ? DRAW_ORDER_DE : Object.keys(shapes).sort((a, b) => rank(shapes[a]) - rank(shapes[b]));
    for (const code of order) {
      const sh = shapes[code];
      const r = phase.byCode[code];
      if (!sh || !r) continue;
      const attrs = { d: sh.d, class: 'state' + (r.inherited ? ' inherited' : '') + (sh.tiny ? ' tiny' : '') + (sh.frame ? ' frame' : ''), 'data-code': code };
      if (sh.evenodd) attrs['fill-rule'] = 'evenodd';
      const p = el('path', attrs);
      layer.paths[code] = p;
      gStates.append(p);
    }
    svg.append(gStates);

    layer.gMarkers = el('g', { class: 'markers' });
    svg.append(layer.gMarkers);

    if (pid === 1) this.decorateGermany(layer);
    if (phase.map.labels) {
      const g = el('g', { class: 'cities' });
      for (const l of phase.map.labels) {
        const t = el('text', { x: l.x, y: l.y });
        t.textContent = l.text;
        g.append(t);
      }
      svg.append(g);
    }

    layer.gFx = el('g', { class: 'fx' });
    svg.append(layer.gFx);

    layer.overlay = document.createElement('div');
    layer.overlay.className = 'map-overlay';
    wrap.append(svg, layer.overlay);
    this.frame.append(wrap);
    this.layers[pid] = layer;
    if (this.game) this.bindLayer(layer);
    return layer;
  }

  decorateGermany(layer) {
    const svg = layer.svg;
    const gCities = el('g', { class: 'cities' });
    for (const c of MAP_DE.cities) {
      if (!LABELS_DE[c.name]) continue;
      const g = el('g', { class: 'city' });
      g.append(el('circle', { cx: c.x, cy: c.y, r: 2.4 }));
      const t = el('text', { x: c.x + LABELS_DE[c.name][0], y: c.y + LABELS_DE[c.name][1] });
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

    // Reine Deko: Radar der (fiktiven) BAfG-Zentrale in Berlin – ohne Spielfunktion.
    const be = MAP_DE.cities.find((c) => c.name === 'Berlin');
    const R = 110;
    const radar = el('g', { class: 'radar', style: `transform-origin:${be.x}px ${be.y}px` });
    radar.append(el('circle', { cx: be.x, cy: be.y, r: R, fill: 'none', stroke: 'rgba(61,255,138,0.18)', 'vector-effect': 'non-scaling-stroke' }));
    const a = (deg) => [be.x + R * Math.cos((deg * Math.PI) / 180), be.y + R * Math.sin((deg * Math.PI) / 180)];
    const [x1, y1] = a(-90); const [x2, y2] = a(-55);
    radar.append(el('path', { d: `M${be.x} ${be.y} L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`, fill: 'rgba(61,255,138,0.13)' }));
    svg.append(radar);
  }

  /** Welche Ebene wird angezeigt? */
  setView(pid) {
    const layer = this.ensureLayer(pid);
    if (this.view === pid) return;
    this.view = pid;
    for (const l of Object.values(this.layers)) l.wrap.classList.toggle('off', l !== layer);
    const [, , w, h] = layer.vb;
    this.frame.style.setProperty('--ar', String(w / h));
    this.frame.parentElement?.style.setProperty('--ar', String(w / h)); // Handy: Höhe der Kartenfläche
    this.frame.dataset.phase = String(pid);
    if (this.titleEl) this.titleEl.textContent = '> ' + layer.phase.title;
    layer.lastFill = {};
    this.hideTip();
    this.renderTabs();
  }

  renderTabs() {
    if (!this.tabsEl) return;
    const max = this.game ? this.game.s.phase : 1;
    const key = `${max}|${this.view}`;
    if (this.tabsKey === key) return;
    this.tabsKey = key;
    this.tabsEl.innerHTML = '';
    this.tabsEl.hidden = max <= 1;
    for (const p of PHASES) {
      if (p.id > max) break;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = p.short;
      b.title = `Lagekarte ${p.name}`;
      b.setAttribute('aria-pressed', String(p.id === this.view));
      b.addEventListener('click', () => this.setView(p.id));
      this.tabsEl.append(b);
    }
  }

  layerOf(code) {
    const info = REGION_INDEX[code];
    return info ? this.ensureLayer(info.phase.id) : null;
  }

  // ---------- Spiel anbinden ----------

  attach(game) {
    this.game = game;
    for (let pid = 1; pid <= game.s.phase; pid++) this.ensureLayer(pid);
    for (const l of Object.values(this.layers)) this.bindLayer(l);
    for (const m of game.s.markers) this.addMarker(m, false);
    this.setView(game.s.phase);

    game.on('marker', (m) => this.addMarker(m, true));
    game.on('pulse', ({ x, y, amount }) => {
      const l = this.layers[this.view];
      this.ripple(l, x, y);
      this.float(l, x, y, '+' + fmt(amount, { decimals: true }));
    });
    game.on('inauguration', ({ x, y, amount, id, code }) => {
      const l = this.layerOf(code);
      this.ripple(l, x, y);
      this.float(l, x, y, `${BUILDING_BY_ID[id].name.toUpperCase()} EINGEWEIHT +${fmt(amount)}`, true);
    });
    game.on('aluhutSpawn', (a) => this.addEntity(a, 'aluhut'));
    game.on('aluhutLeave', (a) => this.removeEntity(a.id));
    game.on('aluhutHit', (a) => this.updateEntity(a));
    game.on('aluhutConverted', (a) => { this.removeEntity(a.id); this.float(this.layers[a.p], a.x, a.y, `ÜBERZEUGT +${fmt(a.reward)}`, true); });
    game.on('goldenSpawn', (g) => this.addEntity(g, 'golden'));
    game.on('goldenLeave', (g) => this.removeEntity(g.id));
    game.on('golden', (g) => {
      this.float(this.layers[g.p], g.x, g.y, g.amount != null ? `${g.title} +${fmt(g.amount)}` : g.title, true);
    });
    game.on('takeover', (r) => {
      const p = this.layerOf(r.code)?.paths[r.code];
      if (!p) return;
      p.classList.remove('flash');
      void p.getBBox();
      p.classList.add('flash');
      setTimeout(() => p.classList.remove('flash'), 1500);
    });
    game.on('phase', ({ to }) => { this.ensureLayer(to.id); this.setView(to.id); });
  }

  bindLayer(layer) {
    if (layer.bound) return;
    layer.bound = true;
    const game = this.game;
    layer.svg.addEventListener('click', (e) => {
      const pt = this.toSvg(layer, e.clientX, e.clientY);
      const code = e.target.closest?.('[data-code]')?.dataset.code;
      if (code && game.s.hand.length && game.canPlaceIn(code)) game.placeFromHand(code, pt.x, pt.y);
      else game.click(pt.x, pt.y);
    });
    layer.svg.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const code = e.target.closest?.('[data-code]')?.dataset.code;
      if (!code) { this.hideTip(); return; }
      this.showRegionTip(code, e.clientX, e.clientY);
    });
    layer.svg.addEventListener('pointerleave', () => this.hideTip());
  }

  toSvg(layer, cx, cy) {
    const p = new DOMPoint(cx, cy).matrixTransform(layer.svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }

  /** Zufälliger Punkt innerhalb einer Region (für Auto-Platzierung & Ereignisse). */
  randomPoint(code) {
    const layer = this.layerOf(code);
    const sh = REGION_INDEX[code].phase.map.shapes[code];
    const path = layer?.paths[code];
    if (!path) return { x: sh.cx, y: sh.cy };
    try {
      const bb = path.getBBox();
      const excl = [...(ENCLAVES[code] || []), ...(sh.tiny ? [] : tinyCodes(layer))]
        .filter((c) => c !== code).map((c) => layer.paths[c]).filter(Boolean);
      for (let i = 0; i < 80; i++) {
        const x = bb.x + Math.random() * bb.width;
        const y = bb.y + Math.random() * bb.height;
        const pt = new DOMPoint(x, y);
        if (path.isPointInFill(pt) && !excl.some((p) => p.isPointInFill(pt))) return { x, y };
      }
    } catch { /* SVG noch nicht gerendert */ }
    return { x: sh.cx, y: sh.cy };
  }

  /** Zufälliger Punkt auf der gerade angezeigten Karte (Impuls-Knopf). */
  randomViewPoint() {
    const phase = PHASE_BY_ID[this.view];
    const list = phase.open.length ? phase.open : phase.regions;
    const r = list[Math.floor(Math.random() * list.length)];
    return this.randomPoint(r.code);
  }

  addMarker(m, animate) {
    const b = BUILDING_BY_ID[m.b];
    const layer = this.layers[m.p || 1];
    if (!b || !layer) return;
    const outer = el('g', { class: `mk ${b.scope}`, transform: `translate(${m.x} ${m.y}) scale(${layer.scale})` });
    const inner = el('g', { class: 'mk-inner' + (animate ? ' pop' : '') });
    if (b.scope === 'local') inner.append(el('circle', { class: 'cov', r: coverageRadius(b.reach * (this.game?.d.mods.reach || 1)) }));
    inner.append(el('path', { d: GLYPH[b.icon] || GLYPH.mast }));
    outer.append(inner);
    layer.gMarkers.append(outer);
  }

  ripple(layer, x, y) {
    if (!layer || layer.gFx.childElementCount > 12) return;
    const c = el('circle', { class: 'ripple', cx: x, cy: y, r: 12 * layer.scale });
    layer.gFx.append(c);
    setTimeout(() => c.remove(), 850);
  }

  pos(layer, x, y) {
    const [vx, vy, vw, vh] = layer.vb;
    return { left: ((x - vx) / vw) * 100 + '%', top: ((y - vy) / vh) * 100 + '%' };
  }

  float(layer, x, y, text, big = false) {
    if (!layer || this.floats >= MAX_FLOATS) return;
    this.floats++;
    const s = document.createElement('span');
    s.className = 'float' + (big ? ' big' : '');
    s.textContent = text;
    Object.assign(s.style, this.pos(layer, x, y));
    layer.overlay.append(s);
    setTimeout(() => { s.remove(); this.floats--; }, 1150);
  }

  addEntity(obj, type) {
    const layer = this.layers[obj.p || 1];
    if (!layer) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ent ' + (type === 'golden' ? 'golden' : obj.kind);
    Object.assign(b.style, this.pos(layer, obj.x, obj.y));
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
    layer.overlay.append(b);
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

  /** Gibt es Ereignisse auf einer Karte, die gerade nicht angezeigt wird? */
  hiddenEvents() {
    let n = 0;
    for (const b of this.entities.values()) if (b.closest('.map-layer')?.classList.contains('off')) n++;
    return n;
  }

  update(d, s) {
    this.renderTabs();
    const layer = this.layers[this.view];
    const current = layer.pid === s.phase;
    for (const r of layer.phase.regions) {
      const c = current ? d.control[r.code] : 1;
      const taken = r.inherited || !current || s.taken.includes(r.code) || isTaken(c);
      const key = taken ? 'T' : c.toFixed(3);
      if (layer.lastFill[r.code] === key) continue;
      layer.lastFill[r.code] = key;
      const p = layer.paths[r.code];
      if (!p) continue;
      p.classList.toggle('taken', taken);
      p.style.fill = taken ? `url(#hatch${layer.pid})` : `rgba(61,255,138,${(0.04 + 0.4 * c).toFixed(3)})`;
    }
    if (layer.pid === 1) {
      const found = (s.owned.haarp || 0) > 0 || s.phase > 1;
      if (found !== this.bielefeldFound) {
        this.bielefeldFound = found;
        this.gBielefeld.classList.toggle('found', found);
        this.bielefeldText.textContent = found ? 'BIELEFELD [BESTÄTIGT]' : 'BIELEFELD? [NICHT GEFUNDEN]';
      }
    }
    this.frame.classList.toggle('placing', s.hand.length > 0 && current);
    if (this.tipCode) this.showRegionTip(this.tipCode);
  }

  showRegionTip(code, x, y) {
    const info = REGION_INDEX[code];
    if (!info) return;
    const { phase, region: r } = info;
    const { s, d } = this.game;
    const current = phase.id === s.phase;
    this.tipCode = code;
    if (x != null) { this.tipX = x; this.tipY = y; }
    const unit = r.unit ? ` <span class="dim">${r.unit}</span>` : '';
    let body;
    if (r.inherited) {
      body = `<div class="tip-row"><span>${phase.beings}</span><span>${fmt(r.pop)}</span></div>
        <div class="tip-flavor">Bereits unter Kontrolle. Hier gibt es nichts mehr zu tun.</div>`;
    } else if (!current) {
      body = `<div class="tip-row"><span>${phase.beings}</span><span>${fmt(r.pop)}</span></div>
        <div class="tip-flavor">ÜBERNOMMEN${r.gag ? ' – ' + r.gag : ''}</div>`;
    } else {
      const c = d.control[code];
      const masts = Object.values(s.placed).reduce((sum, p) => sum + (p[code] || 0), 0);
      body = `<div class="tip-row"><span>${phase.beings}</span><span>${fmt(r.pop)}${unit}</span></div>
        <div class="tip-row"><span>Kontrolliert</span><span>${fmtPct(c)}</span></div>
        <div class="tip-row"><span>· durch Anlagen vor Ort</span><span>${fmt(Math.min(r.pop, d.local[code]))}</span></div>
        <div class="tip-row"><span>· durch ${phase.wideAdj} Anlagen</span><span>${fmt(d.rem[code] * d.fill)}</span></div>
        <div class="tip-row"><span>Lokale Anlagen vor Ort</span><span>${masts}</span></div>
        ${s.taken.includes(code) ? `<div class="tip-flavor">ÜBERNOMMEN – ${r.gag}</div>` : ''}
        ${s.hand.length ? '<div class="amber">Klicken, um die Anlage hier aufzustellen</div>' : ''}`;
    }
    const t = this.tooltip;
    t.innerHTML = `<b>${r.name}</b>${body}`;
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

function rank(sh) {
  return sh.frame ? 0 : sh.tiny ? 2 : 1;
}

function tinyCodes(layer) {
  return (layer.tiny ||= Object.keys(layer.phase.map.shapes).filter((c) => layer.phase.map.shapes[c].tiny));
}
