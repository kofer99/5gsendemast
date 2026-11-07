// Bundesländer. Codes = ISO 3166-2 ohne "DE-" (wie in map-de.js).
// Einwohner gerundet (Destatis, ca. 2023) – vor Release nochmal prüfen.
export const STATES = [
  { code: 'NW', name: 'Nordrhein-Westfalen',    pop: 18.1e6, gag: 'Bielefeld trotzdem nicht gefunden.' },
  { code: 'BY', name: 'Bayern',                 pop: 13.4e6, gag: 'Weißwurst-Frequenz aktiviert. Mia san Funk.' },
  { code: 'BW', name: 'Baden-Württemberg',      pop: 11.3e6, gag: 'Schaffe, schaffe, Sendemast baue.' },
  { code: 'NI', name: 'Niedersachsen',          pop: 8.1e6,  gag: 'Grünkohl strahlt jetzt von innen.' },
  { code: 'HE', name: 'Hessen',                 pop: 6.4e6,  gag: 'Frankfurter Banken melden: Gedanken jetzt börsennotiert.' },
  { code: 'RP', name: 'Rheinland-Pfalz',        pop: 4.2e6,  gag: 'Weinberge auf Empfang. Der Riesling kribbelt.' },
  { code: 'SN', name: 'Sachsen',                pop: 4.1e6,  gag: 'Nu, das gieht klar.' },
  { code: 'BE', name: 'Berlin',                 pop: 3.9e6,  gag: 'Flughafen-Sender fertig. Eröffnung voraussichtlich 2047.' },
  { code: 'SH', name: 'Schleswig-Holstein',     pop: 3.0e6,  gag: 'Die Möwen sind jetzt Drohnen. Waren sie vorher auch.' },
  { code: 'BB', name: 'Brandenburg',            pop: 2.6e6,  gag: 'Endlich Netz in Brandenburg. Die Einheimischen sind verwirrt.' },
  { code: 'ST', name: 'Sachsen-Anhalt',         pop: 2.2e6,  gag: 'Land der Frühaufsteher – jetzt auch Land der Frühempfänger.' },
  { code: 'TH', name: 'Thüringen',              pop: 2.1e6,  gag: 'Die Bratwurst sendet jetzt mit.' },
  { code: 'HH', name: 'Hamburg',                pop: 1.9e6,  gag: 'Moin. Mehr muss man nicht funken.' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern', pop: 1.6e6,  gag: 'Erstmals Netz an der Ostsee. Die Quallen streamen.' },
  { code: 'SL', name: 'Saarland',               pop: 1.0e6,  gag: 'War eh schon in der Kantine.' },
  { code: 'HB', name: 'Bremen',                 pop: 0.7e6,  gag: 'Die Stadtmusikanten singen jetzt auf 3,6 GHz.' },
];

export const STATE_BY_CODE = Object.fromEntries(STATES.map((s) => [s.code, s]));
export const TOTAL_POP = STATES.reduce((sum, s) => sum + s.pop, 0);
