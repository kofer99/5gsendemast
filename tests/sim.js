// Balancing-Simulation eines Durchlaufs (ohne Prestige). Kern: simcore.js.
// Parameter (URL): cps = Klicks/Sek., h = Stunden, ev = 1/0 Ereignisse (Goldene Masten, Aluhüte nach `react` s angeklickt),
//                  manual = 1/0 Masten von Hand platzieren (mit Einweihungsbonus), snap = Minuten zwischen Verlaufszeilen.
import { createSim, disableUpgrades } from './simcore.js';
import * as eco from '../assets/js/core/economy.js';
import { fmt, fmtDuration } from '../assets/js/util/format.js';

const params = new URLSearchParams(location.search);
const CLICKS_PER_SEC = Number(params.get('cps') ?? 3);
const HOURS = Number(params.get('h') ?? 3);
const SNAP_MIN = Number(params.get('snap') ?? 15);
const EVENTS = params.get('ev') !== '0';
const MANUAL = params.get('manual') !== '0';
const REACT = Number(params.get('react') ?? 2);
const OFF = (params.get('off') || '').split(',').filter(Boolean); // z. B. off=syn_,land_ zum Vergleich
if (OFF.length) disableUpgrades(OFF);

const sim = createSim({ cps: CLICKS_PER_SEC, events: EVENTS, manual: MANUAL, react: REACT });
const { g, s, clock } = sim;

const milestones = [];
const seen = new Set();
function mark(key, label) {
  if (seen.has(key)) return;
  seen.add(key);
  milestones.push(`${fmtDuration(clock.t / 1000).padEnd(16)} ${label}`);
}
const phaseLog = [];
let phaseStart = 0;
g.on('takeover', (r) => { if (r.phase.id === 1) mark('take_' + r.code, `Übernommen: ${r.name} (${s.taken.length}/16)`); });
g.on('phase', ({ from, to }) => {
  phaseLog.push(`${from.name.padEnd(14)} fertig nach ${fmtDuration(clock.t / 1000).padEnd(16)} (Dauer ${fmtDuration((clock.t - phaseStart) / 1000)}), FP/s ${fmt(g.d.rawCps)}, Tränen möglich: ${eco.tearsFor(s.fpAll)}`);
  phaseStart = clock.t;
  mark('phase' + to.id, `>>> PHASE ${to.id}: ${to.name}`);
});
g.on('universe', () => {
  phaseLog.push(`Universum       fertig nach ${fmtDuration(clock.t / 1000).padEnd(16)} (Dauer ${fmtDuration((clock.t - phaseStart) / 1000)}), Tränen möglich: ${eco.tearsFor(s.fpAll)}`);
  mark('universe', '>>> UNIVERSUM KONTROLLIERT');
});
g.on('upgrade', (u) => {
  if (u.effect.type === 'reach' || u.effect.type === 'synergy' || u.id.startsWith('land_')) mark(u.id, `Upgrade: ${u.name}`);
});
g.on('bought', ({ id }) => mark('first_' + id, `Erste Anlage: ${id}`));
const ev = { demo: 0, trupp: 0, influencer: 0, aluhut: 0, golden: 0 };
g.on('aluhutSpawn', (a) => { ev[a.kind]++; });
g.on('goldenSpawn', () => { ev.golden++; });
// Woher kommen die Funkpunkte? (Anteile am Gesamt-FP)
const src = { aluhut: 0, demo: 0, trupp: 0, influencer: 0, fund: 0, einweihung: 0 };
g.on('aluhutConverted', (a) => { src[a.kind] += a.reward; });
g.on('demoDissolved', (a) => { src.demo += a.reward; });
g.on('golden', (x) => { if (x.id === 'fund') src.fund += x.amount; });
g.on('inauguration', (x) => { src.einweihung += x.amount; });
const buffTime = { rausch: 0, klickwahn: 0 };
function sources() {
  const all = s.fpAll || 1;
  const pct = (x) => `${(x / all * 100).toFixed(1)} %`;
  return `Impulse ${pct(s.clickFp)} · Einweihung ${pct(src.einweihung)} · Glücksfund ${pct(src.fund)} · Aluhüte ${pct(src.aluhut)}`
    + ` · Influencer ${pct(src.influencer)} · Trupps ${pct(src.trupp)} · Demos ${pct(src.demo)}`
    + ` | Zeit mit Frequenzrausch ${fmtDuration(buffTime.rausch)}, mit Klickwahn ${fmtDuration(buffTime.klickwahn)}`;
}

const jumps = [];
const onBuy = (label, delta, from) => jumps.push({ label, at: clock.t, delta, from });

const snapshots = [];
const END = HOURS * 3600 * 1000;
while (clock.t < END) {
  sim.step(onBuy);
  for (const b of s.buffs) if (b.id in buffTime) buffTime[b.id]++;
  const pct = g.d.ratio;
  for (const p of [0.01, 0.1, 0.25, 0.5, 0.75, 0.9]) if (pct >= p - 1e-9) mark(`p${s.phase}_${p}`, `${g.d.phase.name} ${Math.round(p * 100)} % kontrolliert`);
  if (clock.t % (SNAP_MIN * 60 * 1000) === 0) {
    snapshots.push(`${fmtDuration(clock.t / 1000).padEnd(16)} P${s.phase} FP/s ${fmt(g.d.rawCps).padEnd(12)} ${(pct * 100).toFixed(1).padStart(5)} %   ${JSON.stringify(s.owned)}`);
  }
  if (s.universeRun) break;
}

const top = jumps.sort((a, b) => b.delta - a.delta).slice(0, 8)
  .map((j) => `${fmtDuration(j.at / 1000).padEnd(16)} +${(j.delta * 100).toFixed(1).padStart(5)} %-Punkte (von ${(j.from * 100).toFixed(1)} %) durch ${j.label}`);

document.getElementById('out').textContent =
  `Klicks/Sek.: ${CLICKS_PER_SEC}, Ereignisse: ${EVENTS ? `an (Reaktion nach ${REACT} s)` : 'aus'}, Platzieren: ${MANUAL ? 'von Hand' : 'automatisch'}, Dauer: ${HOURS} h\n`
  + `Ereignisse: ${ev.golden} Goldene Masten, ${ev.aluhut} Aluhüte, ${ev.influencer} Influencer, ${ev.trupp} Wünschelruten-Trupps, ${ev.demo / 5} Demos\n\n`
  + `HERKUNFT DER FP\n${sources()}\n\n`
  + `PHASEN\n${phaseLog.join('\n')}\n\nMEILENSTEINE\n${milestones.join('\n')}\n\nGRÖSSTE SPRÜNGE DURCH EINEN EINZELNEN KAUF\n${top.join('\n')}\n\nVERLAUF\n${snapshots.join('\n')}`;
document.title = 'SIM DONE';
