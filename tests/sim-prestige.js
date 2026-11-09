// Prestige-Simulation: mehrere Durchläufe hintereinander, Neustart an festen Checkpoints.
// Ein Plan ist eine Liste von Zielen, je Durchlauf eines:
//   4 = Neustart, sobald die Welt erobert ist (Beginn Phase 4, frühester möglicher Zeitpunkt)
//   5 = Neustart, sobald Orbit & Mond erobert sind (Beginn Phase 5)
//   U = Neustart, sobald das Universum erobert ist
// Das letzte Ziel wird nur erreicht, nicht neu gestartet. Beispiel: plan=4,4,U → zweimal nach der Welt neu, dann bis zum Universum.
// Patente: Nach jedem Neustart kauft der Spieler die billigsten noch fehlenden, solange die Tränen reichen.
// Parameter: plans=U|4,U|5,U (Pläne, mit | getrennt), cps, ev, manual, react, h (Höchstdauer je Durchlauf), seed.
import { createSim } from './simcore.js';
import * as eco from '../assets/js/core/economy.js';
import { PATENT_BY_ID } from '../assets/js/data/patents.js';
import { fmtDuration } from '../assets/js/util/format.js';

const params = new URLSearchParams(location.search);
const OPTS = {
  cps: Number(params.get('cps') ?? 3),
  events: params.get('ev') !== '0',
  manual: params.get('manual') !== '0',
  react: Number(params.get('react') ?? 2),
  seed: Number(params.get('seed') ?? 1),
};
const MAX_RUN_H = Number(params.get('h') ?? 24);
const PLANS = (params.get('plans') || 'U|4,U|5,U|U,U|4,4,U|4,4,4,U|4,5,U|5,5,U').split('|').map((p) => p.split(','));

const PHASE_SHORT = { 1: 'DE', 2: 'EU', 3: 'Welt', 4: 'Orbit', 5: 'Univ.' };
const GOAL_NAME = { 4: 'Welt erobert', 5: 'Orbit erobert', U: 'Universum' };
const hm = (ms) => {
  const min = Math.round(ms / 60000);
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
};

function runPlan(plan) {
  const sim = createSim(OPTS);
  const { g, s, clock } = sim;
  const runs = [];
  let phaseMarks = [];
  g.on('phase', ({ from }) => phaseMarks.push({ id: from.id, at: clock.t }));
  g.on('universe', () => phaseMarks.push({ id: 5, at: clock.t }));

  for (let i = 0; i < plan.length; i++) {
    const goal = plan[i];
    const last = i === plan.length - 1;
    const start = clock.t;
    phaseMarks = [];
    const run = {
      goal, tearsBefore: s.tears, patents: [...s.patents],
      bonus: Math.round(s.tears * eco.TEAR_BONUS * 100),
    };
    const reached = () => (goal === 'U' ? s.universeRun : s.phase >= Number(goal));
    const end = start + MAX_RUN_H * 3600_000;
    // Bis zum Checkpoint spielen. Ist dort noch keine neue Träne fällig, weiterspielen, bis eine fällig ist.
    while (clock.t < end && !(reached() && (last || g.canPrestige()))) {
      if (s.universeRun && !g.canPrestige() && !last) break; // nichts mehr zu holen
      sim.step();
    }
    run.reachedAt = reached() ? phaseMarks.find((m) => (goal === 'U' ? m.id === 5 : m.id === Number(goal) - 1))?.at ?? clock.t : null;
    run.waited = run.reachedAt != null ? clock.t - run.reachedAt : 0;
    run.duration = clock.t - start;
    run.phases = phaseMarks.map((m, k) => ({ id: m.id, dur: m.at - (k ? phaseMarks[k - 1].at : start) }));
    run.fpRun = s.fpRun;
    run.timedOut = !reached();
    if (!last && g.canPrestige()) {
      run.gained = sim.prestige();
      run.bought = sim.buyPatents();
    }
    runs.push(run);
    if (run.timedOut) break;
  }
  return { plan, runs, total: clock.t, tears: eco.tearsFor(s.fpAll) };
}

const lines = [];
const summary = [];
for (const plan of PLANS) {
  const r = runPlan(plan);
  lines.push(`PLAN ${plan.join(' → ')}`);
  let sum = 0;
  r.runs.forEach((run, i) => {
    sum += run.duration;
    const ph = run.phases.map((p) => `${PHASE_SHORT[p.id]} ${hm(p.dur)}`).join(' · ');
    const tail = run.gained
      ? `Neustart +${run.gained} Tränen, Patente: ${run.bought.length ? run.bought.map((id) => PATENT_BY_ID[id].name).join(', ') : '–'}`
      : run.timedOut ? `ABBRUCH nach ${MAX_RUN_H} h` : 'Ziel erreicht';
    const wait = run.waited > 60_000 ? ` (davon ${hm(run.waited)} gewartet, bis 1 Träne fällig war)` : '';
    lines.push(`  Lauf ${i + 1}  Ziel: ${GOAL_NAME[run.goal].padEnd(13)} Start mit ${String(run.tearsBefore).padStart(4)} Tränen (+${run.bonus} %), ${run.patents.length} Patenten`);
    lines.push(`          ${ph}`);
    lines.push(`          Dauer ${hm(run.duration)}${wait}, gesamt ${hm(sum)}. ${tail}`);
  });
  lines.push('');
  const lastRun = r.runs[r.runs.length - 1];
  const tph = (r.tears / (r.total / 3600_000)).toFixed(1).replace('.', ',');
  summary.push(`${plan.join(' → ').padEnd(18)} ${(lastRun.timedOut ? 'nicht erreicht' : hm(r.total)).padStart(14)}   ${hm(lastRun.duration).padStart(12)}   ${String(r.tears).padStart(7)}   ${tph.padStart(8)}`);
}

document.getElementById('out').textContent =
  `Klicks/Sek.: ${OPTS.cps}, Ereignisse: ${OPTS.events ? `an (Reaktion nach ${OPTS.react} s)` : 'aus'}, Platzieren: ${OPTS.manual ? 'von Hand' : 'automatisch'}, Zufall: seed ${OPTS.seed}\n`
  + `Zeiten in Std:Min reiner Spielzeit (aktiv, ohne Offline-Fortschritt).\n\n`
  + `ÜBERSICHT\nPlan               Ziel erreicht nach   letzter Lauf   Tränen*   Tränen/h\n${summary.join('\n')}\n`
  + '* Tränen am Ende, inkl. der Tränen, die ein Neustart jetzt bringen würde.\n\n'
  + `DETAILS\n${lines.join('\n')}`;
document.title = 'SIM DONE';
