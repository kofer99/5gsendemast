// Anlagen (Generatoren). Werte siehe DESIGN.md §4.3 – Balancing hier anpassen.
// scope "local": wird auf ein Bundesland gesetzt, Reichweite zählt nur dort.
// scope "national": Reichweite verteilt sich auf das ganze Gebiet der aktuellen Phase.
// phase: erst ab dieser Eskalationsphase verfügbar.
export const BUILDINGS = [
  { id: 'mast',      name: 'Kleiner Funkmast',            flavor: 'Völlig harmlos. Offiziell.',          baseCost: 15,    cps: 0.1,   reach: 1000,     scope: 'local',    icon: 'mast' },
  { id: 'tanne',     name: 'Getarnte Tanne',              flavor: 'Nadeln aus Glasfaser.',               baseCost: 100,   cps: 1,     reach: 6000,    scope: 'local',    icon: 'tanne' },
  { id: 'kirche',    name: 'Kirchturm-Sender',            flavor: 'Sonntags doppelte Reichweite.',       baseCost: 1100,  cps: 8,     reach: 30000,   scope: 'local',    icon: 'kirche' },
  { id: 'windrad',   name: 'Windrad',                     flavor: 'Dreht sich nur zur Tarnung.',         baseCost: 12000, cps: 47,    reach: 150000, scope: 'local',    icon: 'windrad' },
  { id: 'toaster',   name: 'Smart-Toaster-Netz',          flavor: 'Toastet auch Gedanken.',              baseCost: 1.3e5, cps: 260,   reach: 7e5,  scope: 'local',    icon: 'toaster' },
  { id: 'chemtrail', name: 'Chemtrail-Staffel',           flavor: 'Jetzt mit Lavendelduft.',             baseCost: 1.4e6, cps: 1400,  reach: 7e5,      scope: 'national', icon: 'jet' },
  { id: 'reptil',    name: 'Reptiloiden-Rechenzentrum',   flavor: 'Klimaanlage auf 38 °C.',              baseCost: 2e7,   cps: 7800,  reach: 2e6,   scope: 'national', icon: 'reptil' },
  { id: 'haarp',     name: 'HAARP-Außenstelle Bielefeld', flavor: 'Existiert nicht. Wie Bielefeld.',     baseCost: 3.3e8, cps: 44000, reach: 1.5e7,    scope: 'national', icon: 'haarp', fixed: 'bielefeld' },
  { id: 'norm',      name: 'EU-Normantenne',              flavor: 'Krümmung gemäß Verordnung (EU) 5G/2026.', baseCost: 2.5e8, cps: 8.3e4, reach: 4e6,  scope: 'national', icon: 'norm', phase: 2 },
  { id: 'euro',      name: 'Euro-Funknetz',               flavor: "Brüssel hat's genehmigt.",            baseCost: 1.2e9, cps: 3e5, reach: 2.5e7,    scope: 'national', icon: 'euro', phase: 2 },
  { id: 'eurovision', name: 'Eurovisions-Sendezentrale',  flavor: 'Douze points für jede Frequenz.',     baseCost: 7e9,   cps: 1.4e6, reach: 5.5e7,  scope: 'national', icon: 'eurovision', phase: 2 },
  { id: 'krake',     name: 'Tiefseekabel-Krake',          flavor: 'Acht Arme, überall Empfang.',         baseCost: 9e9,   cps: 1.5e6, reach: 4e7,  scope: 'national', icon: 'krake', phase: 3 },
  { id: 'sat',       name: 'Satelliten-Schwarm „Gedankenlink“', flavor: 'Jetzt auch mit Funkloch-Garantie.', baseCost: 3e10, cps: 4e6, reach: 1.6e8, scope: 'national', icon: 'sat', phase: 3 },
  { id: 'pyramide',  name: 'Pyramiden-Sendeanlage Gizeh', flavor: 'Wurde nie für Pharaonen gebaut.',     baseCost: 5e10, cps: 6.5e6, reach: 1.7e8, scope: 'national', icon: 'pyramide', phase: 3 },
  { id: 'schrott',   name: 'Weltraumschrott-Antennenpark', flavor: 'Recycling auf 400 km Höhe.',         baseCost: 1.8e11, cps: 2e7,   reach: 3.5e8,  scope: 'national', icon: 'schrott', phase: 4 },
  { id: 'mond',      name: 'Mond-Sendemast',              flavor: 'Erklärt die Gezeiten.',               baseCost: 5e11,  cps: 5e7,   reach: 1.5e9,      scope: 'national', icon: 'mond', phase: 4 },
  { id: 'mars',      name: 'Mars-Rover mit Megafon',      flavor: 'Fährt 4 cm pro Stunde. Sendet schneller.', baseCost: 1e12, cps: 9.5e7, reach: 2.2e9, scope: 'national', icon: 'mars', phase: 4 },
  { id: 'loch',      name: 'Schwarzes-Loch-Verstärker',   flavor: 'Nichts entkommt ihm. Auch keine Gedanken.', baseCost: 2.4e12, cps: 2e8, reach: 2e12, scope: 'national', icon: 'loch', phase: 5 },
  { id: 'quant',     name: '∞G-Quantenturm',              flavor: 'Sendet, bevor du denkst.',            baseCost: 8e12, cps: 6e8, reach: 1.5e13,    scope: 'national', icon: 'quant', phase: 5 },
  { id: 'pulsar',    name: 'Pulsar-Leuchtfeuer',          flavor: 'Blinkt seit Milliarden Jahren. Jetzt mit Inhalt.', baseCost: 6e13, cps: 4e9, reach: 6e13, scope: 'national', icon: 'pulsar', phase: 5 },
];

export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b, i) => [b.id, { ...b, index: i }]));
BUILDINGS.forEach((b, i) => { b.index = i; });
