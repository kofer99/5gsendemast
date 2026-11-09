// Seite „Bestenliste“ (DESIGN.md §5). Liest den Spielstand nur.
import { loadState } from './core/state.js';
import { PHASE_NAMES, PHASE_TOTALS, checkName } from './data/leaderboard-rules.js';
import {
  fetchBoard, submit, removeEntry, getRegistration, setRegistration, clearRegistration,
} from './leaderboard-client.js';
import { fmt, fmtInt } from './util/format.js';

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const s = loadState();
let range = 'all';

const area = (phase, score) => (phase === 5 && score >= PHASE_TOTALS[5] * 0.999999
  ? '<span class="done-u">Universum ✓</span>'
  : esc(PHASE_NAMES[phase] || '?'));

// ---------- Liste ----------
async function loadBoard() {
  const status = $('board-status');
  status.className = 'board-status';
  status.textContent = 'Lade …';
  let res;
  try { res = await fetchBoard(range); } catch { res = { ok: false, status: 0, data: {} }; }
  if (!res.ok) {
    status.classList.add('err');
    status.textContent = res.status === 503 || res.status === 0 || res.status === 404
      ? 'Die Bestenliste ist gerade nicht erreichbar. Vermutlich hat jemand den Server in Alufolie gewickelt.'
      : `Fehler beim Laden (${res.status}).`;
    $('board-table').hidden = true;
    $('board-total').textContent = '';
    return;
  }
  const { entries, total } = res.data;
  $('board-total').textContent = total ? `${fmtInt(total)} ${total === 1 ? 'Eintrag' : 'Einträge'}` : '';
  if (!entries.length) {
    status.textContent = range === 'week'
      ? 'Diese Woche hat sich noch niemand gemeldet. Ihre Chance auf Platz 1!'
      : 'Noch keine Einträge. Die Behörde wartet auf Sie.';
    $('board-table').hidden = true;
    return;
  }
  status.textContent = '';
  const mine = getRegistration()?.name.toLowerCase();
  $('board-body').innerHTML = entries.map((e) => `<tr class="${e.rank === 1 ? 'top1' : ''}${e.name.toLowerCase() === mine ? ' mine' : ''}">
      <td class="rank">${e.rank}</td><td>${esc(e.name)}</td><td class="num">${esc(fmt(e.score))}</td>
      <td class="hide-s">${area(e.phase, e.score)}</td><td class="num hide-s">${esc(fmt(e.fpAll))}</td></tr>`).join('');
  $('board-table').hidden = false;
}

for (const b of document.querySelectorAll('.range [data-range]')) {
  b.addEventListener('click', () => {
    range = b.dataset.range;
    for (const x of document.querySelectorAll('.range [data-range]')) x.setAttribute('aria-selected', String(x === b));
    loadBoard();
  });
}

// ---------- Eigener Eintrag ----------
function msg(text, ok = false) {
  $('me-msg').textContent = text;
  $('me-msg').classList.toggle('ok', ok);
}

function renderMe() {
  const reg = getRegistration();
  if (!s || !(s.bestControlledAll > 0)) {
    $('me-stats').innerHTML = '<span>Noch kein Bestwert. Treten Sie erst den <a href="/">Dienst</a> an und stellen Sie ein paar Masten auf.</span>';
    $('me-form').hidden = true;
    $('me-reg').hidden = true;
    return;
  }
  const phase = s.phaseReached || 1;
  $('me-stats').innerHTML = `<span class="dim">Ihr Bestwert</span><b>${esc(fmt(s.bestControlledAll))}</b>
    <span>${phase >= 4 ? 'Lebewesen' : 'Menschen'} · ${area(phase, s.bestControlledAll)}</span>`;
  $('me-form').hidden = !!reg;
  $('me-reg').hidden = !reg;
  if (reg) $('me-regname').textContent = reg.name;
  else if (!$('me-name').value) $('me-name').value = s.nickname || '';
}

function showRank(data) {
  $('me-rank').textContent = data.rank ? `Platz ${fmtInt(data.rank)} insgesamt${data.rankWeek ? `, Platz ${fmtInt(data.rankWeek)} diese Woche` : ''}.` : '';
}

async function send(name) {
  let res;
  try { res = await submit(s, name); } catch { res = { ok: false, status: 0, data: {} }; }
  if (res.ok) {
    setRegistration(res.data.name || name);
    renderMe();
    showRank(res.data);
    msg('Gemeldet. Die Behörde ist beeindruckt.', true);
    loadBoard();
    return true;
  }
  if (res.status === 0 || res.status === 503 || res.status === 404) msg('Server nicht erreichbar. Bitte später noch einmal.');
  else msg(res.data.reason || `Fehler (${res.status}).`);
  return false;
}

$('me-join').addEventListener('click', async () => {
  const name = $('me-name').value.trim();
  const c = checkName(name);
  if (!c.ok) { msg(c.reason); $('me-name').focus(); return; }
  $('me-join').disabled = true;
  await send(name);
  $('me-join').disabled = false;
});
$('me-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('me-join').click(); });

$('me-update').addEventListener('click', async () => {
  const reg = getRegistration();
  if (!reg) return;
  $('me-update').disabled = true;
  await send(reg.name);
  setTimeout(() => { $('me-update').disabled = false; }, 2000);
});

$('me-leave').addEventListener('click', async () => {
  if (!confirm('Eintrag wirklich vom Server löschen?')) return;
  let res;
  try { res = await removeEntry(s.runId); } catch { res = { ok: false, status: 0, data: {} }; }
  if (!res.ok) { msg('Löschen hat nicht geklappt. Bitte später noch einmal.'); return; }
  clearRegistration();
  $('me-rank').textContent = '';
  renderMe();
  msg('Ausgetragen. Ihr Eintrag wurde gelöscht.', true);
  loadBoard();
});

renderMe();
loadBoard();
