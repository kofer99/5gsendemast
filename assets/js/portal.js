// Mitarbeiterportal der BAfG (DESIGN.md §7). Liest den Spielstand nur, schreibt ihn nie.
import { loadState } from './core/state.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import {
  RANKS, ASSESSMENTS, rankIndex, CIRCULARS, isOpen, JOBS, MENU, MENU_NOTE, isoWeek, ORG, staffNumber,
} from './data/portal.js';
import { fmt, fmtInt, fmtDuration } from './util/format.js';

const $ = (id) => document.getElementById(id);
const SESSION_KEY = 'sendemast.portal.session'; // nur „angemeldet: ja“, keine Eingaben
const SEEN_KEY = 'sendemast.portal.seen';       // gelesene Rundschreiben (für die Markierung „neu“)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(area, key) { try { return globalThis[area].getItem(key); } catch { return null; } },
  set(area, key, v) { try { globalThis[area].setItem(key, v); } catch { /* egal */ } },
  del(area, key) { try { globalThis[area].removeItem(key); } catch { /* egal */ } },
};

const s = loadState(); // null, wenn noch nie gespielt
const rank = rankIndex(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

// ---------- Anmeldung ----------
let busy = false;
async function login() {
  if (busy) return;
  busy = true;
  // Eingaben sofort verwerfen – sie werden nie verwendet.
  $('login-user').value = '';
  $('login-pass').value = '';
  const log = $('login-log');
  log.textContent = '> Gedanken werden abgeglichen …';
  await wait(700);
  log.textContent += '\n> Identität bestätigt.';
  await wait(500);
  log.innerHTML = esc(log.textContent) + '\n<span class="ok">Zugang gewährt. Wir wussten ohnehin, dass Sie es sind.</span>';
  await wait(1100);
  store.set('sessionStorage', SESSION_KEY, '1');
  busy = false;
  showApp();
}

function showApp() {
  $('login').hidden = true;
  $('app').hidden = false;
  openTab(location.hash.slice(1) || 'rundschreiben', false);
}

$('login-btn').addEventListener('click', login);
for (const id of ['login-user', 'login-pass']) {
  $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
}
$('forgot-btn').addEventListener('click', () => {
  $('login-log').textContent = '> Kein Problem. Wir kennen es. Tippen Sie einfach irgendetwas ein.';
});
$('logout-btn').addEventListener('click', () => {
  store.del('sessionStorage', SESSION_KEY);
  $('app').hidden = true;
  $('login').hidden = false;
  $('login-log').textContent = '> Abgemeldet. Ihre Gedanken werden weiterhin empfangen.';
  history.replaceState(null, '', location.pathname);
  $('login-user').focus();
});

// ---------- Reiter ----------
const TABS = [...document.querySelectorAll('.app-nav [role="tab"]')].map((b) => b.dataset.tab);
function openTab(tab, focus = true) {
  if (!TABS.includes(tab)) tab = 'rundschreiben';
  for (const b of document.querySelectorAll('.app-nav [role="tab"]')) {
    const on = b.dataset.tab === tab;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    b.setAttribute('aria-controls', 'tab-' + b.dataset.tab);
    if (on && focus) b.focus();
  }
  for (const t of TABS) $('tab-' + t).hidden = t !== tab;
  if (location.hash.slice(1) !== tab) history.replaceState(null, '', '#' + tab);
  if (tab === 'rundschreiben') markSeen();
  if (tab === 'urkunde') drawCert();
}
document.querySelector('.app-nav').addEventListener('click', (e) => {
  const b = e.target.closest('[role="tab"]');
  if (b) openTab(b.dataset.tab, false);
});
document.querySelector('.app-nav').addEventListener('keydown', (e) => {
  if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  const cur = TABS.indexOf(document.activeElement?.dataset.tab);
  const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
  openTab(TABS[(cur + dir + TABS.length) % TABS.length]);
});
addEventListener('hashchange', () => { if (!$('app').hidden) openTab(location.hash.slice(1), false); });

// ---------- Kopfzeile ----------
$('who-rank').textContent = RANKS[rank].title;
$('who-nr').textContent = 'Personalnr. ' + staffNumber(s);

// ---------- Rundschreiben ----------
function seenList() {
  try { return JSON.parse(store.get('localStorage', SEEN_KEY) || '[]'); } catch { return []; }
}
const seenAtLoad = new Set(seenList());
function renderCirculars() {
  const open = CIRCULARS.filter((c) => isOpen(c, s));
  const unseen = open.filter((c) => !seenAtLoad.has(c.nr)).length;
  $('badge-circ').textContent = unseen ? String(unseen) : '';
  // Neueste zuerst, gesperrte ans Ende
  const list = [...CIRCULARS].reverse().sort((a, b) => Number(isOpen(b, s)) - Number(isOpen(a, s)));
  $('circulars').innerHTML = list.map((c) => {
    if (!isOpen(c, s)) {
      return `<article class="circ locked" aria-label="Gesperrtes Rundschreiben ${esc(c.nr)}">
        <div class="circ-head"><span>RUNDSCHREIBEN ${esc(c.nr)}</span><span>VS – GESPERRT</span></div>
        <span class="bar" aria-hidden="true"></span><span class="bar short" aria-hidden="true"></span>
        <div class="hint">${esc(c.hint)}</div>
      </article>`;
    }
    const isNew = !seenAtLoad.has(c.nr);
    return `<article class="circ${isNew ? ' new' : ''}">
      <div class="circ-head"><span>RUNDSCHREIBEN ${esc(c.nr)}</span><span>${isNew ? 'NEU' : 'GELESEN'}</span></div>
      <h4>${esc(c.subject)}</h4>
      <p>${esc(c.body)}</p>
      ${c.link ? `<a class="btn" href="${esc(c.link.href)}">${esc(c.link.label)}</a>` : ''}
    </article>`;
  }).join('');
}
function markSeen() {
  const open = CIRCULARS.filter((c) => isOpen(c, s)).map((c) => c.nr);
  store.set('localStorage', SEEN_KEY, JSON.stringify([...new Set([...seenList(), ...open])]));
  $('badge-circ').textContent = '';
}

// ---------- Personalakte ----------
function renderFile() {
  $('no-save').hidden = !!s;
  const rows = [
    ['Dienstgrad', RANKS[rank].title, 'big'],
    ['Besoldungsgruppe', RANKS[rank].pay],
    ['Personalnummer', staffNumber(s)],
    ['Dienstzeit', s ? fmtDuration(s.playtime) : '0 Sek.'],
    ['Kontrollierte Menschen (Bestwert)', s ? fmt(s.bestControlledAll || 0) : '0'],
    ['Erfolge', s ? `${s.achievements.length} von ${ACHIEVEMENTS.length}` : `0 von ${ACHIEVEMENTS.length}`],
    ['Gesendete Impulse', s ? fmtInt(s.clicks) : '0'],
    ['Überzeugte Aluhutträger:innen', s ? fmtInt(s.aluhutConverted) : '0'],
    ['Software-Updates der Menschheit', s ? fmtInt(s.prestiges || 0) : '0'],
    ['Resturlaub', '0 Tage (Antrag liegt beim Reptiloiden-Personalrat)'],
  ];
  $('file').innerHTML = rows.map(([k, v, cls]) => `<dt>${esc(k)}</dt><dd${cls ? ` class="${cls}"` : ''}>${esc(v)}</dd>`).join('');
  $('assessment').textContent = '„' + ASSESSMENTS[rank] + '“';
  $('career').innerHTML = RANKS.map((r, i) => {
    const cls = i < rank ? 'done' : i === rank ? 'current' : '';
    const mark = i <= rank ? '✓' : '·';
    return `<li class="${cls}"><span class="mark" aria-hidden="true">${mark}</span><span>${esc(r.title)}</span><span class="dim">${esc(r.pay)}</span>
      <span class="how">${i <= rank ? (i === rank ? 'Aktueller Dienstgrad.' : 'Erreicht.') : 'Voraussetzung: ' + esc(r.how)}</span></li>`;
  }).join('');
}

// ---------- Stellenbörse ----------
const REPLIES = [
  'Ihre Bewerbung wurde gedanklich übermittelt.',
  'Vielen Dank. Wir haben Ihre Bewerbung bereits vor Ihnen gelesen.',
  'Bewerbung eingegangen. Bearbeitungszeit: 6 bis 8 Legislaturperioden.',
  'Leider ist die Stelle seit gestern mit einer Tanne besetzt.',
];
function renderJobs() {
  $('jobs').innerHTML = JOBS.map((j, i) => {
    const open = !j.unlock || j.unlock(s);
    if (!open) {
      return `<article class="job locked"><h4>${esc(j.title)}</h4><div class="meta">${esc(j.unit)}</div>
        <p class="offer amber">${esc(j.hint)}</p></article>`;
    }
    return `<article class="job">
      <h4>${esc(j.title)}</h4>
      <div class="meta">${esc(j.unit)} · ${esc(j.grade)}</div>
      <div class="lbl">Ihre Aufgaben</div><ul>${j.tasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <div class="lbl">Ihr Profil</div><ul>${j.needs.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <div class="lbl">Wir bieten</div><p class="offer">${esc(j.offer)}</p>
      <button type="button" class="btn" data-job="${i}">Bewerben</button>
      <div class="reply" aria-live="polite"></div>
    </article>`;
  }).join('');
}
$('jobs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-job]');
  if (!b) return;
  const i = Number(b.dataset.job);
  b.disabled = true;
  b.nextElementSibling.textContent = REPLIES[i % REPLIES.length];
});

// ---------- Kantine ----------
function renderMenu() {
  const now = new Date();
  $('kw').textContent = `· KW ${isoWeek(now)}`;
  const wd = (now.getDay() + 6) % 7; // 0 = Montag
  $('menu').innerHTML = MENU.map((m, i) => `<div class="dish${i === wd ? ' today' : ''}">
      <span class="day">${esc(m.day)}</span><span class="name">${esc(m.dish)}</span>
      <span class="side">${esc(m.side)}</span><span class="tags">${esc(m.tags)}</span></div>`).join('')
    + (wd > 4 ? '<div class="closed">Am Wochenende ist die Kantine geschlossen. Die Masten senden trotzdem.</div>' : '');
  $('menu-note').textContent = MENU_NOTE;
}

// ---------- Organigramm ----------
function renderOrg() {
  const head = s?.universeDone
    ? { title: 'Präsident:in', note: 'Sie. Herzlichen Glückwunsch.' }
    : ORG.head;
  const box = (b, cls = '') => `<div class="org-box ${cls}"><b>${esc(b.title)}</b><small>${esc(b.note)}</small></div>`;
  $('org').innerHTML = box(head, 'org-head')
    + '<div class="org-line" aria-hidden="true"></div>'
    + `<div class="org-staff">${ORG.staff.map((b) => box(b)).join('')}</div>`
    + '<div class="org-line" aria-hidden="true"></div>'
    + `<div class="org-units">${ORG.units.map((u) => `<div class="org-unit${u.missing ? ' missing' : ''}">
        <div class="t">${esc(u.title)}</div><div class="n">${esc(u.name)}</div>
        <ul>${u.refs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>`).join('')}</div>`;
}

// ---------- Beförderungsurkunde ----------
const cv = $('cert');
let fontsReady = null;
function loadFonts() {
  fontsReady ||= Promise.all([
    document.fonts.load('40px "VT323"'),
    document.fonts.load('20px "IBM Plex Mono"'),
    document.fonts.load('500 20px "IBM Plex Mono"'),
  ]).catch(() => null);
  return fontsReady;
}
function certName() {
  const n = $('cert-name').value.trim().slice(0, 32);
  return n || `Dienstkraft ${staffNumber(s)}`;
}
function fitText(ctx, text, font, size, maxW) {
  let px = size;
  ctx.font = `${font.replace('{px}', px)}`;
  while (ctx.measureText(text).width > maxW && px > 18) {
    px -= 2;
    ctx.font = font.replace('{px}', px);
  }
}
async function drawCert() {
  await loadFonts();
  const ctx = cv.getContext('2d');
  const W = cv.width; const H = cv.height;
  const G = '#3dff8a'; const SOFT = '#b6ffd2'; const DIM = '#7fbf93'; const AMBER = '#ffb02e'; const RED = '#ff6b5c';
  const r = RANKS[rank];
  ctx.fillStyle = '#070b08';
  ctx.fillRect(0, 0, W, H);
  // Raster
  ctx.strokeStyle = 'rgba(61,255,138,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
  // Doppelrahmen
  ctx.strokeStyle = G; ctx.lineWidth = 3; ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = 'rgba(61,255,138,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(36, 36, W - 72, H - 72);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = DIM;
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('BUNDESANSTALT FÜR GEDANKENFUNK  ·  PERSONALABTEILUNG', W / 2, 84);
  ctx.fillStyle = G;
  ctx.font = '96px "VT323", monospace';
  ctx.shadowColor = 'rgba(61,255,138,0.6)'; ctx.shadowBlur = 18;
  ctx.fillText('BEFÖRDERUNGSURKUNDE', W / 2, 168);
  ctx.shadowBlur = 0;

  ctx.fillStyle = SOFT;
  ctx.font = '22px "IBM Plex Mono", monospace';
  ctx.fillText('Hiermit wird', W / 2, 226);
  ctx.fillStyle = AMBER;
  fitText(ctx, certName(), '{px}px "VT323", monospace', 72, W - 200);
  ctx.fillText(certName(), W / 2, 292);
  ctx.fillStyle = SOFT;
  ctx.font = '22px "IBM Plex Mono", monospace';
  ctx.fillText('mit sofortiger Wirkung in folgenden Dienstgrad befördert:', W / 2, 340);
  ctx.fillStyle = G;
  fitText(ctx, r.title, '{px}px "VT323", monospace', 60, W - 200);
  ctx.fillText(r.title, W / 2, 400);
  ctx.fillStyle = DIM;
  ctx.font = '18px "IBM Plex Mono", monospace';
  ctx.fillText(`Besoldungsgruppe ${r.pay}  ·  Personalnr. ${staffNumber(s)}`, W / 2, 434);
  const stats = s
    ? `${fmt(s.bestControlledAll || 0)} kontrollierte ${s.phaseReached >= 4 ? 'Lebewesen' : 'Menschen'}  ·  ${s.achievements.length} Erfolge`
    : 'Noch nicht im Dienst. Alles beginnt mit einem Funkmast.';
  ctx.fillText(stats, W / 2, 466);

  // Datum und Unterschrift
  ctx.textAlign = 'left';
  ctx.fillStyle = SOFT;
  ctx.font = '18px "IBM Plex Mono", monospace';
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  ctx.fillText(`Bielefeld*, den ${today}`, 90, 540);
  ctx.textAlign = 'right';
  ctx.fillText('gez. Präsident:in der BAfG', W - 90, 540);
  ctx.strokeStyle = DIM; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W - 380, 512); ctx.lineTo(W - 90, 512); ctx.stroke();

  // Stempel
  // Stempel über der Unterschrift, wie auf echten Urkunden
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.translate(W - 200, 500);
  ctx.rotate(-0.18);
  ctx.strokeStyle = RED; ctx.lineWidth = 4;
  ctx.strokeRect(-100, -32, 200, 64);
  ctx.fillStyle = RED; ctx.textAlign = 'center';
  ctx.font = '40px "VT323", monospace';
  ctx.fillText('GENEHMIGT', 0, 13);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = DIM;
  ctx.font = '14px "IBM Plex Mono", monospace';
  ctx.fillText('Satire. Die BAfG existiert nicht, 5G ist harmlos. *Bielefeld vermutlich auch.  5gsendemast.de', W / 2, H - 50);
}
$('cert-name').addEventListener('input', () => drawCert());
if (s?.nickname) $('cert-name').value = s.nickname;

function certBlob() {
  return new Promise((res) => cv.toBlob(res, 'image/png'));
}
$('cert-download').addEventListener('click', async () => {
  await drawCert();
  const blob = await certBlob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bafg-befoerderungsurkunde.png';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  $('cert-msg').textContent = 'Urkunde heruntergeladen. Bitte nicht rahmen, das Glas stört den Empfang.';
});
$('cert-share').addEventListener('click', async () => {
  await drawCert();
  const blob = await certBlob();
  const file = new File([blob], 'bafg-befoerderungsurkunde.png', { type: 'image/png' });
  const text = `Ich wurde befördert: ${RANKS[rank].title} bei der Bundesanstalt für Gedankenfunk 📡 5gsendemast.de (Satire)`;
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      $('cert-msg').textContent = 'Geteilt.';
    } else if (navigator.share) {
      await navigator.share({ text, url: 'https://5gsendemast.de/portal/' });
      $('cert-msg').textContent = 'Link geteilt. Das Bild können Sie herunterladen.';
    } else {
      await navigator.clipboard.writeText(text);
      $('cert-msg').textContent = 'Text kopiert. Das Bild können Sie herunterladen.';
    }
  } catch {
    $('cert-msg').textContent = 'Teilen abgebrochen.';
  }
});

// ---------- Start ----------
renderCirculars();
renderFile();
renderJobs();
renderMenu();
renderOrg();
if (store.get('sessionStorage', SESSION_KEY) === '1') showApp();
else $('login-user').focus({ preventScroll: true });
