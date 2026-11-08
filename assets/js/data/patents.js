// Himmlische Patente: Prestige-Shop (DESIGN.md §4.9). Bezahlt mit Aluhut-Tränen, bleiben über Neustarts erhalten.
// Wichtig: Ausgegebene Tränen behalten ihren +2-%-Bonus. Kaufen kostet also nichts außer der Wahl.
export const PATENTS = [
  { id: 'start',    cost: 1,   name: 'Startpaket Funkmast',     desc: 'Jeder Neustart beginnt mit 10 Kleinen Funkmasten und 5 Getarnten Tannen.', effect: { type: 'start', owned: { mast: 10, tanne: 5 } } },
  { id: 'gold',     cost: 2,   name: 'Goldene Antenne',         desc: 'Goldene Masten erscheinen 10 % häufiger.',              effect: { type: 'goldenInterval', mult: 0.9 } },
  { id: 'night',    cost: 3,   name: 'Nachtschicht-Zulage',     desc: 'Offline-Fortschritt 75 % statt 50 %.',                  effect: { type: 'offline', rate: 0.75 } },
  { id: 'auto',     cost: 5,   name: 'Dauer-Impuls',            desc: 'Sendet automatisch einen Impuls pro Sekunde.',          effect: { type: 'autoClick', perSec: 1 } },
  { id: 'alu',      cost: 5,   name: 'Aluhut-Gewerkschaft',     desc: 'Überzeugte Aluhutträger bringen dreimal so viel.',      effect: { type: 'aluhut', mult: 3 } },
  { id: 'ach',      cost: 10,  name: 'Erfolgsprämie',           desc: 'Erfolge geben +2 % statt +1 % FP/Sek.',                  effect: { type: 'achBonus', value: 0.02 } },
  { id: 'express',  cost: 15,  name: 'Express-Genehmigung',     desc: 'Übernahme-Boni für Gebiete verdoppelt.',               effect: { type: 'takeMult', mult: 2 } },
  { id: 'reach',    cost: 20,  name: 'Weitsicht-Erlass',        desc: 'Reichweite aller Anlagen +50 %.',                       effect: { type: 'reach', mult: 1.5 } },
  { id: 'cash',     cost: 30,  name: 'Beamten-Startgeld',       desc: 'Jeder Neustart beginnt mit 1 Mio. FP.',                 effect: { type: 'start', fp: 1e6 } },
  { id: 'eternal',  cost: 60,  name: 'Ewige Frequenz',          desc: 'Effekte Goldener Masten halten doppelt so lange.',      effect: { type: 'goldenDuration', mult: 2 } },
  { id: 'auto2',    cost: 100, name: 'Impuls-Automat Mk II',    desc: 'Fünf weitere automatische Impulse pro Sekunde.',        effect: { type: 'autoClick', perSec: 5 } },
  { id: 'phase2',   cost: 250, name: 'Diplomatischer Pass',     desc: 'Jeder Neustart beginnt mit 1 Mrd. FP.',                 effect: { type: 'start', fp: 1e9 } },
];

export const PATENT_BY_ID = Object.fromEntries(PATENTS.map((p) => [p.id, p]));
