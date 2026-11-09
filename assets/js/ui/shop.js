// Shop: Anlagen + Upgrades.
import { BUILDINGS } from '../data/buildings.js';
import { UPGRADE_BY_ID } from '../data/upgrades.js';
import { PHASE_BY_ID } from '../data/phases.js';
import * as eco from '../core/economy.js';
import { icon } from './icons.js';
import { fmt } from '../util/format.js';

const AMOUNTS = [1, 10, 100, 'max'];
const scopeShort = (b, phase) => (b.scope === 'local' ? phase.localShort : phase.wide);

export class Shop {
  constructor({ list, upgrades, amounts, autoPlace, tooltip }, game) {
    this.game = game;
    this.listEl = list;
    this.upgEl = upgrades;
    this.amountsEl = amounts;
    this.autoEl = autoPlace;
    this.tooltip = tooltip;
    this.rows = {};
    this.upgKey = '';
    this.tip = null;
    this.buildRows();
    this.buildAmounts();
    this.autoEl.checked = game.s.settings.autoPlace;
    this.autoEl.addEventListener('change', () => game.setAutoPlace(this.autoEl.checked));
  }

  buildRows() {
    for (const b of BUILDINGS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bld';
      btn.innerHTML = `
        <span class="bld-icon">${icon(b.icon, 32)}</span>
        <span><span class="bld-name"></span><span class="bld-flavor"></span><span class="bld-reach"></span></span>
        <span class="bld-right"><span class="bld-cost"></span><span class="bld-owned"></span></span>`;
      const row = {
        btn,
        name: btn.querySelector('.bld-name'),
        flavor: btn.querySelector('.bld-flavor'),
        reach: btn.querySelector('.bld-reach'),
        cost: btn.querySelector('.bld-cost'),
        owned: btn.querySelector('.bld-owned'),
        iconEl: btn.querySelector('.bld-icon'),
        state: '',
      };
      btn.addEventListener('click', () => {
        if (row.state !== 'visible') return;
        this.game.buy(b.id, this.game.s.settings.buyAmount);
      });
      this.bindTip(btn, () => (row.state === 'visible' ? this.buildingTip(b) : null));
      this.rows[b.id] = row;
      this.listEl.append(btn);
    }
  }

  buildAmounts() {
    this.amountsEl.innerHTML = '';
    for (const a of AMOUNTS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = a === 'max' ? 'MAX' : '×' + a;
      btn.setAttribute('aria-pressed', String(this.game.s.settings.buyAmount === a));
      btn.addEventListener('click', () => {
        this.game.s.settings.buyAmount = a;
        for (const x of this.amountsEl.children) x.setAttribute('aria-pressed', String(x === btn));
        this.update();
      });
      this.amountsEl.append(btn);
    }
  }

  bindTip(target, provider) {
    const show = () => {
      const html = provider();
      if (!html) return;
      this.tip = { target, provider };
      this.renderTip();
    };
    const hide = () => { if (this.tip?.target === target) { this.tip = null; this.tooltip.hidden = true; } };
    target.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(); });
    target.addEventListener('pointerleave', hide);
    target.addEventListener('focus', show);
    target.addEventListener('blur', hide);
  }

  renderTip() {
    if (!this.tip) return;
    const html = this.tip.provider();
    if (!html) { this.tooltip.hidden = true; return; }
    const t = this.tooltip;
    t.innerHTML = html;
    t.hidden = false;
    const r = this.tip.target.getBoundingClientRect();
    const w = t.offsetWidth; const h = t.offsetHeight;
    let left = r.left - w - 10;
    if (left < 8) left = Math.min(window.innerWidth - w - 8, r.left);
    let top = left === r.left ? r.bottom + 6 : r.top;
    top = Math.max(8, Math.min(window.innerHeight - h - 8, top));
    t.style.left = left + 'px';
    t.style.top = top + 'px';
  }

  buildingTip(b) {
    const { s, d } = this.game;
    const n = s.owned[b.id] || 0;
    const unit = eco.unitCps(s, d.mods, b);
    const total = unit * n;
    const share = d.rawCps > 0 ? (total / d.rawCps) * 100 : 0;
    const reach = b.reach * d.mods.reach;
    const phase = d.phase;
    const scope = b.fixed
      ? `steht fest in Bielefeld, wirkt ${phase.wideLong}`
      : b.scope === 'local'
        ? phase.localLong
        : `${phase.wideLong} – füllt die Lücken aller Gebiete anteilig auf. Der Standort ist nur Optik.`;
    const amount = this.amountFor(b);
    return `<b>${b.name}</b>
      <div class="tip-row"><span>Besitz</span><span>${n}</span></div>
      <div class="tip-row"><span>Preis nächstes Stück</span><span>${fmt(eco.buildingCost(b, n))} FP</span></div>
      <div class="tip-row"><span>Je Stück</span><span>${fmt(unit, { decimals: true })} FP/Sek.</span></div>
      <div class="tip-row"><span>Gesamt</span><span>${fmt(total, { decimals: true })} FP/Sek. (${share.toFixed(1).replace('.', ',')} %)</span></div>
      <div class="tip-row"><span>Reichweite je Stück</span><span>${fmt(reach)} Menschen</span></div>
      <div class="dim">Wirkung: ${scope}</div>
      ${amount.n > 1 ? `<div class="tip-row"><span>${amount.n} Stück zusammen</span><span>${fmt(amount.cost)} FP</span></div><div class="dim">Jedes weitere Stück kostet 15 % mehr als das vorige.</div>` : ''}
      <div class="tip-flavor">„${b.flavor}“</div>`;
  }

  upgradeTip(u) {
    const can = this.game.s.fp >= u.cost;
    return `<b>${u.name}</b>
      <div class="tip-row"><span>Kosten</span><span class="${can ? '' : 'amber'}">${fmt(u.cost)} FP</span></div>
      <div>${u.desc}</div>
      <div class="tip-flavor">„${u.flavor}“</div>`;
  }

  amountFor(b) {
    const s = this.game.s;
    const owned = s.owned[b.id] || 0;
    const a = s.settings.buyAmount;
    if (a === 'max') {
      const n = Math.max(1, eco.maxAffordable(b, owned, s.fp));
      return { n, cost: eco.buildingCost(b, owned, n) };
    }
    return { n: a, cost: eco.buildingCost(b, owned, a) };
  }

  update() {
    const { s, d } = this.game;
    let teaserShown = false;
    for (const b of BUILDINGS) {
      const row = this.rows[b.id];
      const visible = eco.isBuildingVisible(s, b);
      let state = visible ? 'visible' : teaserShown ? 'hidden' : 'teaser';
      if (!visible && !teaserShown) teaserShown = true;
      const key = state === 'teaser' ? state + s.phase : state; // Teaser-Text hängt von der Phase ab
      if (key !== row.key) {
        row.key = key;
        row.state = state;
        row.btn.hidden = state === 'hidden';
        row.btn.classList.toggle('locked', state === 'teaser');
        if (state === 'teaser') {
          row.iconEl.innerHTML = '?';
          row.name.textContent = '??? GESPERRT';
          row.flavor.textContent = b.phase && s.phase < b.phase
            ? `Freigabe in Phase ${b.phase} (${PHASE_BY_ID[b.phase].name})`
            : `Freigabe ab ${fmt(b.baseCost * 0.3)} FP insgesamt`;
          row.owned.textContent = '';
          row.reach.textContent = '';
          row.btn.setAttribute('aria-disabled', 'true');
        } else if (state === 'visible') {
          row.iconEl.innerHTML = icon(b.icon, 32);
          row.name.textContent = b.name;
          row.flavor.textContent = b.flavor;
        }
      }
      if (state !== 'visible') continue;
      const { n, cost } = this.amountFor(b);
      const can = s.fp >= cost;
      row.btn.classList.toggle('can', can);
      row.btn.setAttribute('aria-disabled', String(!can));
      row.cost.textContent = (n > 1 ? `${n} Stück: ` : '') + fmt(cost) + ' FP';
      row.owned.textContent = s.owned[b.id] || 0;
      row.reach.textContent = `Reichweite ${fmt(b.reach * d.mods.reach)} · ${scopeShort(b, d.phase)}`;
      row.btn.setAttribute('aria-label', `${b.name} kaufen${n > 1 ? `, ${n} Stück` : ''}: ${fmt(cost)} Funkpunkte. Besitz: ${s.owned[b.id] || 0}`);
    }

    const avail = eco.availableUpgrades(s, d);
    const key = avail.map((u) => u.id).join(',');
    if (key !== this.upgKey) {
      this.upgKey = key;
      this.upgEl.innerHTML = '';
      if (!avail.length) {
        const e = document.createElement('span');
        e.className = 'empty';
        e.textContent = 'Keine Upgrades verfügbar. Weiterfunken!';
        this.upgEl.append(e);
      }
      for (const u of avail) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'upg';
        btn.dataset.id = u.id;
        btn.setAttribute('aria-label', `Upgrade ${u.name}: ${fmt(u.cost)} Funkpunkte. ${u.desc}`);
        btn.innerHTML = u.icon
          ? `${icon(u.icon, 22)}<span class="upg-tier">${u.short}</span>`
          : `<span>${u.short}</span>`;
        btn.addEventListener('click', () => {
          if (this.game.buyUpgrade(u.id) && this.tip?.target === btn) { this.tip = null; this.tooltip.hidden = true; }
        });
        this.bindTip(btn, () => this.upgradeTip(UPGRADE_BY_ID[u.id]));
        this.upgEl.append(btn);
      }
    }
    for (const btn of this.upgEl.querySelectorAll('.upg')) {
      btn.classList.toggle('can', s.fp >= UPGRADE_BY_ID[btn.dataset.id].cost);
    }
    if (this.tip && !this.tip.target.isConnected) { this.tip = null; this.tooltip.hidden = true; }
    this.renderTip();
  }
}
