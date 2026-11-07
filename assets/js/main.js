// Einstieg: Spielstand laden, Oberfläche verdrahten, Schleifen starten.
import { Game } from './core/game.js';
import { newState, loadState, saveState, clearState, exportState, importState } from './core/state.js';
import { MapView } from './ui/map.js';
import { Shop } from './ui/shop.js';
import { Hud, Ticker, toast, dialog, setupTabs, renderAchievements, renderStats } from './ui/hud.js';
import { MAP_DE } from './data/map-de.js';
import { fmt, fmtInt, fmtDuration } from './util/format.js';

const $ = (id) => document.getElementById(id);
const TICK_MS = 100;
const AUTOSAVE_MS = 30_000;

const tooltip = $('tooltip');
const map = new MapView($('map-frame'), tooltip);
const state = loadState() || newState();
const game = new Game(state, { pointIn: (code) => map.randomPoint(code) });
map.attach(game);

const hud = new Hud(game);
const shop = new Shop({ list: $('buildings'), upgrades: $('upgrades'), amounts: $('amounts'), autoPlace: $('autoplace'), tooltip }, game);
new Ticker($('ticker-text'), game);

let activeTab = 'tab-anlagen';
setupTabs((id) => { activeTab = id; renderPanels(true); });

// ---------- Ereignisse → Meldungen ----------
game.on('takeover', (st) => toast(`${st.name.toUpperCase()} ÜBERNOMMEN`, `${st.gag} +5 % FP/Sek.`));
game.on('achievement', (a) => toast('ERFOLG: ' + a.name, a.desc + ' (+1 % FP/Sek.)'));
game.on('golden', (g) => {
  if (g.id === 'fund') toast(g.title, `+${fmt(g.amount)} FP gefunden.`, 'warn');
  else toast(g.title, g.text, g.id === 'funkloch' ? 'warn' : '');
});
game.on('aluhutSpawn', (a) => {
  if (a.kind === 'influencer') toast('TELEGRAM-INFLUENCER!', 'Verkauft Abschirm-Unterhosen. Mehrmals anklicken zum Überzeugen.', 'warn');
});
game.on('upgrade', () => renderPanels(true));
game.on('offline', ({ seconds, gain }) => toast('WILLKOMMEN ZURÜCK', `Die BAfG hat in ${fmtDuration(seconds)} ${fmt(gain)} FP für dich gefunkt.`));
game.on('germany', async () => {
  save();
  const r = await dialog({
    title: 'DEUTSCHLAND KONTROLLIERT',
    body: [
      `Alle ${fmtInt(game.d.controlled)} Menschen in allen 16 Bundesländern empfangen jetzt Ihre Gedanken. Die BAfG gratuliert und hat Ihren Dienstwagen auf ein Raumschiff hochgestuft.`,
      'Phase 2 (Europa) befindet sich noch im Genehmigungsverfahren und folgt in einem späteren Update. Bis dahin: weiter funken, Upgrades sammeln, Bielefeld finden.',
    ],
    actions: [{ label: 'Neuer Einsatz', value: 'restart' }, { label: 'Prahlen', value: 'share' }, { label: 'Weiterfunken', value: 'ok', primary: true }],
  });
  if (r === 'share') share();
  if (r === 'restart') confirmRestart();
});

// ---------- Bedienung ----------
function pulseRandom() {
  const c = MAP_DE.cities[Math.floor(Math.random() * MAP_DE.cities.length)];
  game.click(c.x + (Math.random() - 0.5) * 30, c.y + (Math.random() - 0.5) * 30);
}
$('pulse-btn').addEventListener('click', pulseRandom);
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.repeat) return;
  const t = e.target;
  // In Textfeldern und offenen Dialogen bleibt die Leertaste normal.
  if (t.closest?.('input, textarea, select, dialog')) return;
  // Sonst immer Impuls – auch wenn gerade ein Knopf fokussiert ist. Sonst würde die Leertaste
  // den zuletzt geklickten Kaufen-Knopf erneut auslösen. (Knöpfe lassen sich per Enter bedienen.)
  e.preventDefault();
  pulseRandom();
});

// Wird gesetzt, sobald der Spielstand ersetzt wird (Neustart/Import). Danach darf nichts mehr
// den alten Stand zurückschreiben – auch nicht pagehide/visibilitychange beim Neuladen.
let saveLocked = false;

function save(silent = true) {
  if (saveLocked) return;
  const ok = saveState(game.s);
  if (!silent) toast(ok ? 'GESPEICHERT' : 'SPEICHERN FEHLGESCHLAGEN', ok ? 'Akte im Browser hinterlegt.' : 'Der Browser blockiert localStorage.', ok ? '' : 'warn');
}

function shareText() {
  return `Ich kontrolliere bereits ${fmt(game.d.controlled)} Menschen in Deutschland 📡 Wie viele schaffst du? 5gsendemast.de (Satire – 5G ist harmlos)`;
}
async function share() {
  const text = shareText();
  try {
    if (navigator.share) { await navigator.share({ title: 'Projekt Sendemast', text, url: 'https://5gsendemast.de/' }); return; }
    await navigator.clipboard.writeText(text);
    toast('IN DIE ZWISCHENABLAGE KOPIERT', text);
  } catch (err) {
    if (err?.name !== 'AbortError') toast('TEILEN NICHT MÖGLICH', text, 'warn');
  }
}

$('btn-save').addEventListener('click', () => save(false));
$('btn-share').addEventListener('click', share);
$('btn-export').addEventListener('click', () => {
  save();
  const ta = document.createElement('textarea');
  ta.readOnly = true;
  ta.value = exportState(game.s);
  ta.setAttribute('aria-label', 'Exportierter Spielstand');
  dialog({ title: 'SPIELSTAND EXPORTIEREN', body: ['Diesen Text sicher aufbewahren. Mit „Importieren“ kannst du ihn auf einem anderen Gerät laden.', ta], actions: [{ label: 'Kopieren', value: 'copy' }, { label: 'Schließen', value: 'ok', primary: true }] })
    .then(async (r) => {
      if (r !== 'copy') return;
      try { await navigator.clipboard.writeText(ta.value); toast('KOPIERT', 'Spielstand in der Zwischenablage.'); } catch { toast('KOPIEREN FEHLGESCHLAGEN', 'Bitte manuell markieren und kopieren.', 'warn'); }
    });
  setTimeout(() => ta.select(), 50);
});
$('btn-import').addEventListener('click', async () => {
  const ta = document.createElement('textarea');
  ta.setAttribute('aria-label', 'Spielstand einfügen');
  ta.placeholder = 'BAfG1:…';
  const r = await dialog({ title: 'SPIELSTAND IMPORTIEREN', body: ['Achtung: Der aktuelle Spielstand wird überschrieben.', ta], actions: [{ label: 'Abbrechen', value: 'cancel' }, { label: 'Importieren', value: 'import', primary: true }] });
  if (r !== 'import') return;
  try {
    replaceSaveAndReload(importState(ta.value));
  } catch {
    toast('IMPORT FEHLGESCHLAGEN', 'Das sieht nicht nach einer gültigen BAfG-Akte aus.', 'warn');
  }
});
function replaceSaveAndReload(newState) {
  saveLocked = true;
  if (newState) saveState(newState);
  else clearState();
  location.reload();
}

async function confirmRestart() {
  const r = await dialog({
    title: 'NEUER EINSATZ?',
    body: ['Alle Masten, Upgrades, Erfolge und Funkpunkte werden gelöscht. Du beginnst wieder mit einem leeren Deutschland.', 'Die BAfG vergisst nie. Aber dein Browser schon.'],
    actions: [{ label: 'Abbrechen', value: 'cancel', primary: true }, { label: 'Alles löschen & neu starten', value: 'yes', danger: true }],
  });
  if (r === 'yes') replaceSaveAndReload(null);
}
$('btn-reset').addEventListener('click', confirmRestart);

// ---------- Panels ----------
function renderPhases() {
  const el = $('phases');
  const done = game.s.germanyDone;
  const rows = [
    ['PHASE 1', 'Deutschland', done ? 'ERLEDIGT' : `${game.s.taken.length}/16 Länder`, done ? '' : 'active'],
    ['PHASE 2', 'Europa', 'IN PLANUNG', done ? 'active' : 'locked'],
    ['PHASE 3', 'Welt', 'GESPERRT', 'locked'],
    ['PHASE 4', 'Orbit & Mond', 'GESPERRT', 'locked'],
    ['PHASE 5', 'Universum', 'GESPERRT', 'locked'],
  ];
  const html = rows.map(([a, b, c, cls]) => `<div class="phase ${cls}"><span>${a}</span><span>${b}</span><span>${c}</span></div>`).join('');
  if (el.innerHTML !== html) el.innerHTML = html;
}

function renderPanels(force = false) {
  if (activeTab === 'tab-erfolge') renderAchievements($('achievements'), game.s);
  if (activeTab === 'tab-akte' || force) renderStats($('stats'), game);
  if (activeTab === 'tab-prestige') renderPhases();
}

// ---------- Schleifen ----------
const offline = game.applyOffline();

setInterval(() => game.tick(), TICK_MS);

let lastShop = -Infinity;
let lastPanels = -Infinity;
let lastRender = 0;
function render() {
  const now = performance.now();
  lastRender = now;
  hud.update(Date.now());
  map.update(game.d, game.s);
  if (now - lastShop > 150) { lastShop = now; shop.update(); }
  if (now - lastPanels > 1000) { lastPanels = now; renderPanels(); }
}
function frame() {
  if (!document.hidden) render();
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
// Rückfallebene, falls der Browser keine Animationsframes liefert (z. B. eingebettet/gedrosselt)
setInterval(() => { if (!document.hidden && performance.now() - lastRender > 400) render(); }, 250);

setInterval(save, AUTOSAVE_MS);
function onHide() { game.s.lastTick = Date.now(); save(); }
window.addEventListener('pagehide', onHide);
document.addEventListener('visibilitychange', () => { if (document.hidden) onHide(); });

// ---------- Begrüßung ----------
if (!game.s.introSeen) {
  dialog({
    title: 'WILLKOMMEN, AGENT:IN',
    body: [
      'Die Bundesanstalt für Gedankenfunk (BAfG) hat Sie für eine streng geheime Mission ausgewählt: Bringen Sie Deutschland unter Funkkontrolle.',
      'Klicken Sie auf die Karte, um Strahlungsimpulse zu senden. Kaufen Sie Anlagen und stellen Sie sie in den Bundesländern auf. Aluhutträger blockieren Ihr Signal – überzeugen Sie sie mit Gratis-WLAN.',
      'Dienstlicher Tipp: Kleine Länder wie Bremen oder das Saarland sind schnell übernommen – und jedes übernommene Land bringt dauerhaft +5 % Funkpunkte.',
      'Hinweis der Redaktion: Das hier ist Satire. 5G ist nach aktuellem Stand der Wissenschaft harmlos – warum, steht in der Geheimakte.',
    ],
    actions: [{ label: 'Dienst antreten', value: 'ok', primary: true }],
  }).then(() => { game.s.introSeen = true; save(); });
} else if (offline && offline.gain > 0) {
  dialog({
    title: 'WILLKOMMEN ZURÜCK',
    body: [`Während Sie ${fmtDuration(offline.seconds)} weg waren, hat die BAfG ${fmt(offline.gain)} FP für Sie gefunkt (50 % Offline-Leistung, max. 12 Std.).`],
    actions: [{ label: 'Weiter', value: 'ok', primary: true }],
  });
}
