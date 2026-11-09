// Einstieg: Spielstand laden, Oberfläche verdrahten, Schleifen starten.
import { Game } from './core/game.js';
import { newState, loadState, saveState, clearState, exportState, importState } from './core/state.js';
import * as eco from './core/economy.js';
import { MapView } from './ui/map.js';
import { Shop } from './ui/shop.js';
import { Hud, Ticker, toast, dialog, setupTabs, renderAchievements, renderStats, renderPrestige } from './ui/hud.js';
import { fmt, fmtInt, fmtDuration } from './util/format.js';

const $ = (id) => document.getElementById(id);
const TICK_MS = 100;
const AUTOSAVE_MS = 30_000;

const tooltip = $('tooltip');
const map = new MapView($('map-frame'), tooltip, { tabs: $('map-tabs'), title: $('map-title') });
const state = loadState() || newState();
const game = new Game(state, { pointIn: (code) => map.randomPoint(code) });
map.attach(game);
// Nur lokal: Zugriff für Test-Seiten (tests/shot.html ?spawn=demo,trupp).
if (location.hostname === 'localhost') window.__game = game;

const hud = new Hud(game);
const shop = new Shop({ list: $('buildings'), upgrades: $('upgrades'), amounts: $('amounts'), autoPlace: $('autoplace'), tooltip }, game);
new Ticker($('ticker-text'), game);

let activeTab = 'tab-anlagen';
setupTabs((id) => { activeTab = id; renderPanels(true); });

// ---------- Ereignisse → Meldungen ----------
game.on('takeover', (r) => {
  const pct = Math.round(r.phase.takeBonus * game.d.mods.takeMult * 100);
  toast(`${r.name.toUpperCase()} ÜBERNOMMEN`, `${r.gag} +${pct} % FP/Sek.`);
});
game.on('hand', (hand) => { if (hand.length && map.view !== game.s.phase) map.setView(game.s.phase); });
game.on('patent', (p) => { toast('PATENT ERTEILT: ' + p.name.toUpperCase(), p.desc); save(); });
game.on('achievement', (a) => toast('ERFOLG: ' + a.name, a.desc + ' (+1 % FP/Sek.)'));
game.on('golden', (g) => {
  if (g.id === 'fund') toast(g.title, `+${fmt(g.amount)} FP gefunden.`, 'warn');
  else toast(g.title, g.text, g.id === 'funkloch' ? 'warn' : '');
});
game.on('aluhutSpawn', (a) => {
  if (a.kind === 'influencer') toast('TELEGRAM-INFLUENCER!', 'Verkauft Abschirm-Unterhosen. Mehrmals anklicken zum Überzeugen.', 'warn');
  if (a.kind === 'trupp') toast('WÜNSCHELRUTEN-TRUPP!', 'Sucht nach „Erdstrahlen“ und wandert über die Karte. Dreimal anklicken, bevor er weiterzieht.', 'warn');
});
game.on('demoSpawn', (dm) => toast('ALUHUT-DEMO IN ' + dm.name.toUpperCase() + '!', 'Fünf Leute, zwölf Plakate. Jede Figur kostet 10 % Signal. Alle überzeugen gibt eine Prämie.', 'warn'));
game.on('demoDissolved', (a) => toast('DEMO AUFGELÖST', `Alle haben sich ins Gratis-WLAN eingeloggt. Prämie: +${fmt(a.reward)} FP.`));
game.on('truppCaught', (a) => toast('TRUPP GEFANGEN', `Die Wünschelrute zeigte auf eine Wasserader. +${fmt(a.reward)} FP.`));
game.on('upgrade', () => renderPanels(true));
game.on('offline', ({ seconds, gain }) => toast('WILLKOMMEN ZURÜCK', `Die BAfG hat in ${fmtDuration(seconds)} ${fmt(gain)} FP für dich gefunkt.`));
// Zwischensequenzen beim Phasenwechsel (DESIGN.md §4.5)
const CUTSCENES = {
  2: {
    title: 'DEUTSCHLAND KONTROLLIERT',
    body: (d, from) => [
      `Alle ${fmtInt(from.total)} Menschen in allen 16 Bundesländern empfangen jetzt Ihre Gedanken. Die BAfG gratuliert und hat Ihren Dienstwagen auf einen Reisebus mit Dachantenne hochgestuft.`,
      'NÄCHSTES ZIEL: EUROPA. Ihre Chemtrail-Staffeln, Rechenzentren und die HAARP-Außenstelle wirken ab sofort europaweit. Neue Anlage freigegeben: Euro-Funknetz.',
      'Dienstlicher Tipp: Zwergstaaten wie der Vatikan oder Monaco sind mit wenigen Masten übernommen. Jedes Land bringt +2 % FP/Sek.',
    ],
  },
  3: {
    title: 'EUROPA KONTROLLIERT',
    body: () => [
      'Brüssel hat genehmigt. Rückwirkend. Ihr Dienstwagen ist jetzt ein Linienflugzeug mit Lavendelduft.',
      'NÄCHSTES ZIEL: DIE WELT. 17 Weltregionen, 7,7 Mrd. Menschen. Neue Anlage freigegeben: Satelliten-Schwarm „Gedankenlink“.',
    ],
  },
  4: {
    title: 'WELTHERRSCHAFT ERREICHT',
    body: () => [
      'Die Welt gehört der BAfG. Ihr Dienstwagen wurde auf ein Raumschiff hochgestuft (Tankkarte liegt im Handschuhfach).',
      'NÄCHSTES ZIEL: ORBIT & MOND. Neue Anlage freigegeben: Mond-Sendemast.',
      `NEU: PRESTIGE. Unter „Prestige“ können Sie jetzt neu anfangen und bekommen dafür Aluhut-Tränen – dauerhaft +${fmtInt(eco.TEAR_BONUS * 100)} % FP/Sek. je Träne. Je weiter Sie vorher kommen, desto mehr Tränen gibt es: Nach dem Universum sind es fast zehnmal so viele wie jetzt.`,
    ],
  },
  5: {
    title: 'ORBIT & MOND KONTROLLIERT',
    body: () => [
      'Die Mondkälber muhen im Takt, die Marsmännchen grüßen. Ihr Raumschiff hat jetzt Warp-Antrieb.',
      'NÄCHSTES ZIEL: DAS UNIVERSUM. Aliens haben auch Handys. Neue Anlage freigegeben: ∞G-Quantenturm.',
    ],
  },
};
game.on('phase', async ({ from, to }) => {
  save();
  const c = CUTSCENES[to.id];
  if (!c) return;
  const r = await dialog({
    title: c.title,
    body: c.body(game.d, from),
    actions: [{ label: 'Prahlen', value: 'share' }, { label: `Weiter: ${to.name}`, value: 'ok', primary: true }],
  });
  if (r === 'share') share(from);
});
game.on('universe', async () => {
  save();
  const r = await dialog({
    title: 'UNIVERSUM KONTROLLIERT',
    body: [
      `${fmt(game.d.controlled)} Lebewesen in allen Galaxien empfangen Ihre Gedanken. Es gibt nichts mehr zu kontrollieren. Die BAfG ist sprachlos (und das ist neu).`,
      'Was bleibt? Ein Neustart unter „Prestige“ – mit vielen Aluhut-Tränen. Oder einfach weiterfunken und die Funkpunkte zählen.',
      'Hinweis der Redaktion: 5G kann übrigens immer noch keine Gedanken lesen. Warum, steht in der Geheimakte.',
    ],
    actions: [{ label: 'Geheimakte', value: 'akte' }, { label: 'Prahlen', value: 'share' }, { label: 'Weiterfunken', value: 'ok', primary: true }],
  });
  if (r === 'share') share();
  if (r === 'akte') location.href = '/geheimakte/';
});
game.on('prestige', () => { save(); replaceSaveAndReload(game.s); });

// ---------- Bedienung ----------
function pulseRandom() {
  const pt = map.randomViewPoint();
  game.click(pt.x, pt.y);
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

function shareText(done) {
  if (done) return `Ich habe ${done.name} komplett unter Funkkontrolle 📡 Schaffst du das auch? 5gsendemast.de (Satire – 5G ist harmlos)`;
  const { phase, controlled } = game.d;
  if (game.s.universeRun) return `Ich kontrolliere das gesamte Universum 📡 ${fmt(controlled)} Lebewesen. Und du? 5gsendemast.de (Satire – 5G ist harmlos)`;
  const where = { 1: 'in Deutschland', 2: 'in Europa', 3: 'auf der Welt', 4: 'zwischen Erde und Mars', 5: 'im Universum' }[phase.id];
  return `Ich kontrolliere bereits ${fmt(controlled)} ${phase.beings} ${where} 📡 Wie viele schaffst du? 5gsendemast.de (Satire – 5G ist harmlos)`;
}
async function share(done) {
  const text = shareText(done);
  try {
    if (navigator.share) { await navigator.share({ title: 'Projekt Sendemast', text, url: 'https://5gsendemast.de/' }); return; }
    await navigator.clipboard.writeText(text);
    toast('IN DIE ZWISCHENABLAGE KOPIERT', text);
  } catch (err) {
    if (err?.name !== 'AbortError') toast('TEILEN NICHT MÖGLICH', text, 'warn');
  }
}

$('btn-save').addEventListener('click', () => save(false));
$('btn-share').addEventListener('click', () => share());
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
async function confirmPrestige() {
  const n = eco.pendingTears(game.s);
  const r = await dialog({
    title: 'NEUSTART NACH WELTHERRSCHAFT?',
    body: [
      `Sie erhalten ${fmtInt(n)} Aluhut-Tränen (dauerhaft +${fmtInt(n * eco.TEAR_BONUS * 100)} % FP/Sek.).`,
      'Masten, Upgrades, Funkpunkte und alle Phasen werden zurückgesetzt. Erfolge, Tränen, Patente und Statistik bleiben.',
      '„Die Menschheit wurde per Software-Update zurückgesetzt. Bitte starten Sie Ihre Gedanken neu.“',
    ],
    actions: [{ label: 'Abbrechen', value: 'cancel', primary: true }, { label: 'Neustart durchführen', value: 'yes', danger: true }],
  });
  if (r === 'yes') game.prestige();
}

function renderPanels(force = false) {
  if (activeTab === 'tab-erfolge') renderAchievements($('achievements'), game.s);
  if (activeTab === 'tab-akte' || force) renderStats($('stats'), game);
  if (activeTab === 'tab-prestige' || force) renderPrestige($('prestige'), game, { onPrestige: confirmPrestige });
}
game.on('patent', () => renderPanels(true));

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
