// Upgrades. unlock(s, d): s = Spielstand, d = abgeleitete Werte (economy.derive).
import { BUILDINGS } from './buildings.js';
import { STATE_BY_CODE } from './states.js';

// [benötigte Anzahl, Kostenfaktor × Basispreis, Bezeichnung, Flavor]
const TIERS = [
  [1,   10,   '5G+',                 'Jetzt mit Plus. Das Plus steht für Plus.'],
  [5,   50,   '5G Turbo',            'Turbo heißt: noch harmloser.'],
  [25,  500,  '5G Ultra',            'Ultra-harmlos. Ultra-offiziell.'],
  [50,  5e4,  '5G Ultra Max',        'Max ist der Praktikant. Er hat es erfunden.'],
  [100, 5e6,  '5G Ultra Max Pro',    'Pro-Version, jetzt im Abo.'],
  [150, 5e8,  '5,5G Beta',           'Bekannter Fehler: Gedanken an Pizza werden doppelt gesendet.'],
  [200, 5e10, '5,9G final_FINAL_v2', 'Bitte final_FINAL_v3 nicht öffnen.'],
];

export const UPGRADES = [];

for (const b of BUILDINGS) {
  TIERS.forEach(([need, costMul, label, flavor], i) => {
    UPGRADES.push({
      id: `${b.id}_t${i + 1}`,
      name: `${label}: ${b.name}`,
      desc: `${b.name} produziert doppelt so viel.`,
      flavor,
      cost: b.baseCost * costMul,
      icon: b.icon,
      effect: { type: 'building', building: b.id, mult: 2 },
      unlock: (s) => (s.owned[b.id] || 0) >= need,
    });
  });
}

const fp = (n) => (s) => s.fpAll >= n;
const phaseCtrl = (phase, n) => (s, d) => s.phase > phase || (s.phase === phase && d.controlled >= n);

UPGRADES.push(
  // Klick
  { id: 'click_1', name: 'Doppelklick-Erlass',       short: 'K×2', desc: 'Impulse bringen doppelt so viel.', flavor: 'Per Verwaltungsvorschrift. Formular K-2 liegt bei.', cost: 100,   effect: { type: 'click', mult: 2 }, unlock: (s) => s.clicks >= 10 },
  { id: 'click_2', name: 'Dienstfinger aus Titan',   short: 'K×2', desc: 'Impulse bringen doppelt so viel.', flavor: 'Vom Betriebsarzt genehmigt.', cost: 500,   effect: { type: 'click', mult: 2 }, unlock: (s) => s.clicks >= 100 },
  { id: 'click_3', name: 'Ergonomische Dienstmaus',  short: 'K+1', desc: 'Impulse erhalten +1 % deiner FP/Sek.', flavor: 'Mit eingebautem Funkmodul. Natürlich.', cost: 10000, effect: { type: 'clickCps', pct: 0.01 }, unlock: (s) => s.clicks >= 500 },
  { id: 'click_4', name: 'Klick-Verordnung § 5G',    short: 'K+1', desc: 'Impulse erhalten +1 % deiner FP/Sek.', flavor: 'Absatz 3: Wer klickt, gewinnt.', cost: 1e6,  effect: { type: 'clickCps', pct: 0.01 }, unlock: (s) => s.clicks >= 1500 },
  { id: 'click_5', name: 'Telepathischer Klick',     short: 'K+1', desc: 'Impulse erhalten +1 % deiner FP/Sek.', flavor: 'Du klickst, bevor du klickst.', cost: 1e8,  effect: { type: 'clickCps', pct: 0.01 }, unlock: (s) => s.clicks >= 4000 },
  { id: 'click_6', name: 'Mausrad der Erkenntnis',   short: 'K+1', desc: 'Impulse erhalten +1 % deiner FP/Sek.', flavor: 'Dreht sich in beide Richtungen. Wie die Wahrheit.', cost: 1e10, effect: { type: 'clickCps', pct: 0.01 }, unlock: (s) => s.clicks >= 10000 },

  // Global
  { id: 'global_1', name: 'Funkturm-Feng-Shui',         short: '+15%', desc: 'Alle FP/Sek. +15 %.', flavor: 'Antennen immer nach Osten ausrichten. Wegen der Energie.', cost: 1e5,  effect: { type: 'global', mult: 1.15 }, unlock: fp(5e4) },
  { id: 'global_2', name: 'Mehr Antennen pro Antenne',  short: '+15%', desc: 'Alle FP/Sek. +15 %.', flavor: 'Antenneption.', cost: 1e7,  effect: { type: 'global', mult: 1.15 }, unlock: fp(5e6) },
  { id: 'global_3', name: 'Ministerialerlass „Volle Balken“', short: '+15%', desc: 'Alle FP/Sek. +15 %.', flavor: 'Gilt ab sofort. Rückwirkend.', cost: 1e9,  effect: { type: 'global', mult: 1.15 }, unlock: fp(5e8) },
  { id: 'global_4', name: 'Quanten-Bürokratie',         short: '+15%', desc: 'Alle FP/Sek. +15 %.', flavor: 'Der Antrag ist gleichzeitig genehmigt und abgelehnt.', cost: 1e11, effect: { type: 'global', mult: 1.15 }, unlock: fp(5e10) },

  // Reichweite (je +20 %, bewusst klein – siehe DESIGN.md §4.3)
  { id: 'reach_1', name: 'Verstärkte Antennen',      short: 'R+', desc: 'Reichweite aller Anlagen +20 %.', flavor: 'Mit Panzertape verlängert.', cost: 2e4, effect: { type: 'reach', mult: 1.2 }, unlock: (s, d) => d.controlled >= 5e4 },
  { id: 'reach_2', name: 'Richtfunk-Kalibrierung',   short: 'R+', desc: 'Reichweite aller Anlagen +20 %.', flavor: 'Kalibriert von Horst. Horst schielt.', cost: 5e5, effect: { type: 'reach', mult: 1.2 }, unlock: (s, d) => d.controlled >= 1e6 },
  { id: 'reach_3', name: 'Gedanken-Repeater',        short: 'R+', desc: 'Reichweite aller Anlagen +20 %.', flavor: 'Wiederholt jeden Gedanken. Wiederholt jeden Gedanken.', cost: 1e7, effect: { type: 'reach', mult: 1.2 }, unlock: (s, d) => d.controlled >= 8e6 },
  { id: 'reach_4', name: 'Aluhut-Resonanz',          short: 'R+', desc: 'Reichweite aller Anlagen +20 %.', flavor: 'Alufolie leitet hervorragend. Danke für die Zusatzantenne!', cost: 2e8, effect: { type: 'reach', mult: 1.2 }, unlock: (s, d) => d.controlled >= 2.5e7 },
  { id: 'reach_5', name: 'Quanten-Sendeleistung',    short: 'R+', desc: 'Reichweite aller Anlagen +20 %.', flavor: 'Sendet gleichzeitig überall und nirgends.', cost: 4e9, effect: { type: 'reach', mult: 1.2 }, unlock: (s, d) => d.controlled >= 5e7 },

  { id: 'global_5', name: 'EU-Harmonisierung der Gedanken', short: '+15%', desc: 'Alle FP/Sek. +15 %.', flavor: 'Gedanken müssen ab sofort 0,7 mm Abstand zueinander halten.', cost: 1e13, effect: { type: 'global', mult: 1.15 }, unlock: fp(5e12) },
  { id: 'global_6', name: 'UN-Resolution 5G/∞',         short: '+15%', desc: 'Alle FP/Sek. +15 %.', flavor: 'Einstimmig angenommen. Die Gegenstimmen wurden umgefunkt.', cost: 1e15, effect: { type: 'global', mult: 1.15 }, unlock: fp(5e14) },
  { id: 'global_7', name: 'Interplanetare Dienstanweisung', short: '+15%', desc: 'Alle FP/Sek. +15 %.', flavor: 'Gilt auch auf dem Mond. Rückwirkend ab Urknall.', cost: 1e17, effect: { type: 'global', mult: 1.15 }, unlock: fp(5e16) },
  { id: 'global_8', name: 'Kosmische Verwaltungsreform', short: '+15%', desc: 'Alle FP/Sek. +15 %.', flavor: 'Alle Formulare jetzt in 11 Dimensionen.', cost: 1e19, effect: { type: 'global', mult: 1.15 }, unlock: fp(5e18) },

  // Reichweite in späteren Phasen (je +25 %)
  { id: 'reach_eu_1', name: 'Roaming-Abkommen',         short: 'R+', desc: 'Reichweite aller Anlagen +25 %.', flavor: 'Gedanken im EU-Ausland jetzt ohne Aufpreis.', cost: 1e9, effect: { type: 'reach', mult: 1.25 }, unlock: phaseCtrl(2, 1.5e8) },
  { id: 'reach_eu_2', name: 'Eurovisions-Trägerwelle',  short: 'R+', desc: 'Reichweite aller Anlagen +25 %.', flavor: 'Zero Points für Aluhüte.', cost: 5e9, effect: { type: 'reach', mult: 1.25 }, unlock: phaseCtrl(2, 3.5e8) },
  { id: 'reach_w_1',  name: 'Tiefseekabel-Tuning',      short: 'R+', desc: 'Reichweite aller Anlagen +25 %.', flavor: 'Die Kraken haben unterschrieben.', cost: 3e10, effect: { type: 'reach', mult: 1.25 }, unlock: phaseCtrl(3, 1.5e9) },
  { id: 'reach_w_2',  name: 'Äquator-Verstärker',       short: 'R+', desc: 'Reichweite aller Anlagen +25 %.', flavor: 'Der Gürtel der Erde, jetzt mit Antenne.', cost: 1.5e11, effect: { type: 'reach', mult: 1.25 }, unlock: phaseCtrl(3, 4e9) },
  { id: 'reach_o_1',  name: 'Schwerelos-Sendeleistung', short: 'R+', desc: 'Reichweite aller Anlagen +25 %.', flavor: 'Ohne Luft kein Widerstand. Nicht mal von Aluhüten.', cost: 1e12, effect: { type: 'reach', mult: 1.25 }, unlock: phaseCtrl(4, 3e10) },
  { id: 'reach_u_1',  name: 'Wurmloch-Richtfunk',       short: 'R+', desc: 'Reichweite aller Anlagen +25 %.', flavor: 'Abkürzung durch die Raumzeit. Genehmigt vom Bauamt Bielefeld.', cost: 1.5e13, effect: { type: 'reach', mult: 1.25 }, unlock: phaseCtrl(5, 5e12) },
  { id: 'reach_u_2',  name: 'Urknall-Echo-Verstärker',  short: 'R+', desc: 'Reichweite aller Anlagen +25 %.', flavor: 'Das Rauschen im Radio? Waren wir. Schon immer.', cost: 6e13, effect: { type: 'reach', mult: 1.25 }, unlock: phaseCtrl(5, 1e14) },

  // Goldener Mast
  { id: 'golden_1', name: 'Goldene Lötstelle',     short: 'G',   desc: 'Goldene Masten erscheinen 15 % häufiger.', flavor: '24 Karat, 0 Ohm.', cost: 77777,  effect: { type: 'goldenInterval', mult: 0.85 }, unlock: (s) => s.goldenClicked >= 7 },
  { id: 'golden_2', name: 'Vergoldete Frequenzen', short: 'G',   desc: 'Effekte goldener Masten halten doppelt so lange.', flavor: 'Klingt teurer.', cost: 7777777, effect: { type: 'goldenDuration', mult: 2 }, unlock: (s) => s.goldenClicked >= 27 },

  // Aluhutträger
  { id: 'alu_1', name: 'Gratis-WLAN-Gutscheine',  short: 'A+', desc: 'Überzeugte Aluhutträger bringen 50 % mehr.', flavor: 'Passwort: „wahrheit123“.', cost: 5e4, effect: { type: 'aluhut', mult: 1.5 }, unlock: (s) => s.aluhutConverted >= 10 },
  { id: 'alu_2', name: 'Streaming-Abo zum Geburtstag', short: 'A+', desc: 'Überzeugte Aluhutträger bringen 50 % mehr.', flavor: 'Wer Serien schaut, hat keine Zeit für Telegram.', cost: 5e7, effect: { type: 'aluhut', mult: 1.5 }, unlock: (s) => s.aluhutConverted >= 50 },
);

// Synergien: Anlage A bekommt +pct je Stück der Partner-Anlage B (DESIGN.md §4.6).
// [A, B, pct, benötigt A, benötigt B, Kosten, Name, Flavor]
const SYNERGIES = [
  ['kirche',    'tanne',     0.01, 15, 15, 1e5,   'Weihnachtsgottesdienst',        'Die Tanne steht ohnehin schon im Altarraum. Sie sendet die Predigt jetzt in Stereo.'],
  ['chemtrail', 'windrad',   0.005, 5, 25, 2e7,   'Rückenwind für Lavendel',       'Das Windrad pustet, die Staffel sprüht. Teamwork.'],
  ['reptil',    'toaster',   0.01, 1,  25, 2e8,   'Warmhalteplatte für Reptiloiden', 'Kaltblüter lieben die Abwärme eines guten Toasts.'],
  ['haarp',     'mast',      0.005, 1, 40, 3e9,   'Bielefelder Kleinmast-Initiative', 'Viele kleine Masten tragen das große Signal. Wie ein Chor, nur unsichtbar.'],
  ['euro',      'kirche',    0.005, 5, 40, 1e10,  'Ökumenischer Rundfunkrat',      'Brüssel und der Vatikan teilen sich jetzt einen Frequenzplan.'],
  ['sat',       'chemtrail', 0.01, 3,  30, 2e11,  'Gemeinsamer Luftraum',          'Die Staffel tankt jetzt am Satelliten. Die Flugsicherung schaut weg.'],
  ['mond',      'sat',       0.015, 3, 10, 3e12,  'Mondsüchtige Satelliten',       'Sie kreisen ohnehin ständig um ihn. Jetzt wenigstens mit Auftrag.'],
  ['quant',     'reptil',    0.01, 2,  25, 5e13,  'Reptiloiden-Quantenkühlung',    'Bei 38 °C rechnet der Quantenturm am liebsten. Die Reptiloiden auch.'],
];
const B = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
for (const [a, b, pct, needA, needB, cost, name, flavor] of SYNERGIES) {
  UPGRADES.push({
    id: `syn_${a}_${b}`,
    name: `${name}`,
    desc: `${B[a].name}: +${String(pct * 100).replace('.', ',')} % FP/Sek. je ${B[b].name}.`,
    flavor,
    cost,
    icon: B[a].icon,
    short: 'S',
    effect: { type: 'synergy', building: a, per: b, pct },
    unlock: (s) => (s.owned[a] || 0) >= needA && (s.owned[b] || 0) >= needB,
  });
}

// Bundesland-Upgrades: nach der Übernahme eines Landes (DESIGN.md §4.6). Je +1,5 % FP/Sek.
// Preis ∝ Einwohnerzahl (20 FP je Mensch), weil große Länder später fallen.
const LAND = [
  ['NW', 'Zechen-Kühlung für Rechenzentren',  'Unter Tage ist es schön kühl. Und Bielefeld ist auch nicht im Weg, weil es nicht existiert.'],
  ['BY', 'Maibaum-Antennen',                  'Jeder Maibaum ist jetzt ein Sendemast. Beim Klettern bitte nicht in die Antenne beißen.'],
  ['BW', 'Kehrwoche für Funkwellen',          'Die Frequenzen werden jetzt jeden Samstag gefegt. Laut Plan.'],
  ['NI', 'Grünkohl-Resonanzboden',            'Bei der Kohlfahrt wird jetzt mitgesendet. Der Schnaps dämpft die Nebenwirkungen.'],
  ['HE', 'Funk-Hochfrequenzhandel',           'Die Börse in Frankfurt handelt jetzt mit Gedanken. Im Millisekundentakt.'],
  ['RP', 'Weinberg-Richtfunk',                'Die Rebstöcke stehen schon in Reih und Glied. Perfekte Antennen.'],
  ['SN', 'Stollen-Repeater',                  'Im Dresdner Christstollen steckt jetzt ein Verstärker. Die Rosinen sind die LEDs.'],
  ['BE', 'Fernsehturm-Reaktivierung',         'Der Fernsehturm war immer schon ein Sendemast. Jetzt wieder offiziell.'],
  ['SH', 'Leuchtturm-Funkfeuer',              'Die Leuchttürme blinken jetzt in Binärcode.'],
  ['BB', 'Funkloch-Sanierung Brandenburg',    'Das letzte Funkloch wurde zugeschüttet. Mit Sand aus der Lausitz.'],
  ['ST', 'Frühaufsteher-Sendefenster',        'Gesendet wird ab 4:30 Uhr. Die Einheimischen sind dann eh schon wach.'],
  ['TH', 'Bratwurst-Grillrost-Antenne',       'Der Rost ist aus Edelstahl, also leitfähig. Senf dient als Isolierung.'],
  ['HH', 'Elbphilharmonie-Akustikverstärker', 'Klingt in jedem Saal gleich gut. Auch die Gedanken.'],
  ['MV', 'Ostsee-Quallen-Netz',               'Die Quallen schwimmen jetzt im Formationsflug.'],
  ['SL', 'Kantinen-Verordnung Saarland',      'Ab sofort wird das ganze Land über die Kantinendurchsage erreicht.'],
  ['HB', 'Stadtmusikanten-Verstärker',        'Esel, Hund, Katze und Hahn senden jetzt in Dolby Surround.'],
];
for (const [code, name, flavor] of LAND) {
  const st = STATE_BY_CODE[code];
  UPGRADES.push({
    id: `land_${code}`,
    name: `${st.name}: ${name}`,
    desc: `Alle FP/Sek. +1,5 %. Freigeschaltet durch die Übernahme von ${st.name}.`,
    flavor,
    cost: Math.round(st.pop * 20),
    short: code,
    effect: { type: 'global', mult: 1.015 },
    unlock: (s) => s.taken.includes(code),
  });
}

for (const u of UPGRADES) u.short = shortLabel(u);

function shortLabel(u) {
  if (u.effect.type === 'building') {
    const n = Number(u.id.split('_t')[1]);
    return 'T' + n;
  }
  return u.short;
}

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
