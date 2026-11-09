// Mitarbeiterportal der BAfG (DESIGN.md §7). Reine Daten + kleine Hilfsfunktionen, ohne DOM.
// s = Spielstand (normalize() aus state.js) oder null, wenn noch nie gespielt wurde.
// Ton: Behördendeutsch, Sie-Form. Keine echten Behörden, Personen oder Marken.

const has = (id) => (s) => !!s && s.achievements.includes(id);
const phase = (n) => (s) => !!s && (s.phaseReached || 1) >= n;

// ---------- Laufbahn ----------
// Reihenfolge = Rang. need(s) entscheidet, ob der Dienstgrad erreicht ist.
export const RANKS = [
  { id: 'anw',   title: 'Funkanwärter:in',                         pay: 'A 5G',     need: () => true,            how: 'Dienstantritt.' },
  { id: 'sek',   title: 'Funksekretär:in',                         pay: 'A 6G',     need: (s) => has('state_1')(s) || phase(2)(s), how: 'Ein Bundesland vollständig übernehmen.' },
  { id: 'osek',  title: 'Oberfunksekretär:in',                     pay: 'A 7G',     need: (s) => has('ctrl_half')(s) || phase(2)(s), how: 'Die halbe Republik kontrollieren.' },
  { id: 'insp',  title: 'Funkinspektor:in',                        pay: 'A 9G',     need: phase(2),              how: 'Ganz Deutschland kontrollieren.' },
  { id: 'amtr',  title: 'Funkamtsrat / Funkamtsrätin',             pay: 'A 12G',    need: phase(3),              how: 'Ganz Europa kontrollieren.' },
  { id: 'ofr',   title: 'Oberfunkrat / Oberfunkrätin',             pay: 'A 14G',    need: phase(4),              how: 'Die Weltherrschaft erlangen.' },
  { id: 'mdg',   title: 'Ministerialdirigent:in für Orbitalfunk',  pay: 'B 5G',     need: phase(5),              how: 'Orbit und Mond übernehmen.' },
  { id: 'praes', title: 'Präsident:in der BAfG',                   pay: 'B ∞',      need: (s) => !!s && !!s.universeDone, how: 'Das Universum kontrollieren.' },
];

/** Index des höchsten erreichten Dienstgrads. */
export function rankIndex(s) {
  let i = 0;
  RANKS.forEach((r, k) => { if (r.need(s)) i = k; });
  return i;
}

// Dienstliche Beurteilung je Dienstgrad (Index wie RANKS)
export const ASSESSMENTS = [
  'Hat den Strahlungsimpuls-Knopf gefunden. Wir sind vorsichtig optimistisch.',
  'Erste Landnahme erfolgreich. Neigt zu übermäßigem Klicken, was wir ausdrücklich begrüßen.',
  'Die halbe Republik hört mit. Die andere Hälfte wird es auch bald.',
  'Deutschland vollständig erfasst. Verhalten im Dienst: unauffällig, also verdächtig gut.',
  'Europaweit eingesetzt. Reisekostenabrechnung in 24 Amtssprachen fehlerfrei eingereicht.',
  'Hat die Weltherrschaft erlangt und trotzdem pünktlich Feierabend gemacht. Vorbildlich.',
  'Leitet den Orbitalfunk. Kommt seitdem nicht mehr zur Kantine, das Essen wird hochgeschossen.',
  'Kontrolliert das Universum. Eine weitere Beförderung ist laufbahnrechtlich nicht vorgesehen.',
];

// ---------- Rundschreiben ----------
// unlock: optional. Gesperrte Rundschreiben erscheinen geschwärzt mit Hinweis `hint`.
export const CIRCULARS = [
  {
    nr: '5G/2026-01', subject: 'Interne Mitteilung: Leck in der Abteilung Geheimakte',
    body: 'Ein internes Dokument ist an die Öffentlichkeit gelangt. Es enthält ausschließlich überprüfte Fakten über Mobilfunk. Bediensteten wird dringend davon abgeraten, es zu lesen, da es die Dienstmoral gefährden könnte.',
    link: { href: '/geheimakte/', label: 'Dokument trotzdem lesen' },
  },
  {
    nr: '5G/2026-17', subject: 'Dienstanweisung: Tarnung von Sendemasten',
    body: 'Masten sind ab sofort als Tannen zu tarnen. Bereits als Kirchtürme getarnte Masten bleiben Kirchtürme. Masten, die als Windräder getarnt sind, dürfen sich weiterhin drehen, aber nur zur Tarnung.',
  },
  {
    nr: '5G/2026-18', subject: 'Kaffeemaschine im 3. Obergeschoss',
    body: 'Die Kaffeemaschine im 3. OG sendet nicht. Sie ist kaputt. Es wird gebeten, sie nicht weiter mit Alufolie zu umwickeln. Das macht es nicht besser.',
  },
  {
    nr: '5G/2026-19', subject: 'Klickverhalten im Dienst',
    body: 'Strahlungsimpulse sind ausschließlich mit dem Dienstfinger zu senden. Die Leertaste ist als Dienstfinger anerkannt. Sehnenscheidenentzündungen sind als Dienstunfall zu melden (Formular K-2).',
  },
  {
    nr: '5G/2026-21', subject: 'Umgang mit Aluhutträger:innen',
    body: 'Aluhutträger:innen sind höflich und mit Gratis-WLAN zu überzeugen. Die Aluhüte bleiben Eigentum der Tragenden und sind nicht einzuziehen. Passwort für den Gastzugang bleibt „wahrheit123“.',
    unlock: has('alu_1'), hint: 'Freigabe nach dem ersten überzeugten Aluhutträger.',
  },
  {
    nr: '5G/2026-24', subject: 'Fundsachen: Goldene Masten',
    body: 'Goldene Masten sind keine Dienstgeschenke. Sie sind unverzüglich anzuklicken und gelten danach als verbraucht. Die Nachfrage, ob man sie behalten darf, ist zu unterlassen.',
    unlock: has('gold_1'), hint: 'Freigabe nach dem ersten Goldenen Mast.',
  },
  {
    nr: '5G/2026-29', subject: 'Betreff: Bielefeld',
    body: 'Die Existenz der HAARP-Außenstelle Bielefeld ist gegenüber Dritten weiterhin zu leugnen. Das gilt ausdrücklich auch für Bielefeld. Dienstreisen dorthin sind über die Kostenstelle „Nicht vorhanden“ abzurechnen.',
    unlock: has('haarp_1'), hint: 'Freigabe nach dem Bau der HAARP-Außenstelle.',
  },
  {
    nr: '5G/2026-31', subject: 'Versammlungen vor Dienstgebäuden',
    body: 'Aluhut-Demonstrationen sind ausschließlich durch Gratis-WLAN aufzulösen. Plakate dürfen nicht korrigiert werden, auch wenn die Rechtschreibung dazu einlädt. Die Versammlungsfreiheit gilt auch für Menschen, die uns nicht mögen.',
    unlock: has('demo_1'), hint: 'Freigabe nach der ersten aufgelösten Aluhut-Demo.',
  },
  {
    nr: '5G/2026-33', subject: 'Meldepflicht für Wünschelruten-Funde',
    body: 'Von Wünschelruten-Trupps gefundene Wasseradern sind dem örtlichen Wasserwerk zu melden. Gefundene „Erdstrahlen“ sind nicht zu melden, da es sie nicht gibt. Gefundene Autoschlüssel bitte beim Pförtner abgeben.',
    unlock: has('trupp_1'), hint: 'Freigabe nach dem ersten gefangenen Wünschelruten-Trupp.',
  },
  {
    nr: '5G/2026-40', subject: 'Reisekosten im europäischen Ausland',
    body: 'Reisekostenanträge für den Europaeinsatz sind in allen 24 Amtssprachen einzureichen. Die Antwort erfolgt auf Latein. Dienstreisen in Zwergstaaten werden pauschal mit einem Funkmast abgegolten.',
    unlock: has('eu_1'), hint: 'Freigabe ab Einsatzgebiet Europa.',
  },
  {
    nr: '5G/2026-52', subject: 'Arbeitszeitregelung nach der Weltherrschaft',
    body: 'Die Kernarbeitszeit gilt ab sofort weltweit gleichzeitig. Bedienstete in Zeitzonen, in denen gerade Nacht ist, arbeiten bitte leise.',
    unlock: has('world_all'), hint: 'Freigabe nach Erlangung der Weltherrschaft.',
  },
  {
    nr: '5G/2026-58', subject: 'Homeoffice in der Schwerelosigkeit',
    body: 'Telearbeit auf der Raumstation ist zulässig. Lose Gegenstände, insbesondere Kaffeetassen und Aktenordner, sind festzuschnallen. Die Kantine liefert nicht in den Orbit.',
    unlock: has('orbit_iss'), hint: 'Freigabe nach Übernahme der Raumstation.',
  },
  {
    nr: '5G/2026-61', subject: 'Software-Update der Menschheit',
    body: 'Während des Updates bitte den Planeten nicht ausschalten. Erinnerungen an die vorherige Weltherrschaft sind normal und verschwinden nach etwa einem Durchlauf.',
    unlock: has('prestige_1'), hint: 'Freigabe nach dem ersten Neustart.',
  },
  {
    nr: '5G/2026-99', subject: 'Abschluss aller Vorgänge',
    body: 'Das Universum ist vollständig erfasst. Es gibt nichts mehr zu tun. Bitte schreiben Sie trotzdem weiterhin Ihre Stunden auf. Hinweis der Personalabteilung: 5G kann übrigens immer noch keine Gedanken lesen.',
    unlock: has('univ_all'), hint: 'Freigabe nach Abschluss aller Vorgänge im Universum.',
  },
];

export const isOpen = (c, s) => !c.unlock || c.unlock(s);

// ---------- Stellenbörse ----------
export const JOBS = [
  {
    title: 'Reptiloid (m/w/d) in Teilzeit', unit: 'Abt. 5 – Rechenzentren', grade: 'A 9G',
    tasks: ['Betreuung der Serverräume bei 38 °C', 'Teilnahme an Teamsitzungen in menschlicher Gestalt'],
    needs: ['Wechselwarmer Kreislauf', 'Häutung außerhalb der Kernarbeitszeit'],
    offer: 'Wärmelampe am Arbeitsplatz, Sonnenplatz in der Kantine.',
  },
  {
    title: 'Chemtrail-Pilot:in mit Lavendel-Erfahrung', unit: 'Abt. 2 – Luftraum', grade: 'A 11G',
    tasks: ['Durchführung von Duftflügen über Ballungsräumen', 'Saisonale Umstellung auf Zimt (Dezember)'],
    needs: ['Fluglizenz', 'Nachweisbar keine Allergie gegen Lavendel'],
    offer: 'Dienstwagen mit Tragflächen.',
  },
  {
    title: 'Sachbearbeiter:in Bielefeld-Leugnung', unit: 'Abt. 4 – Bielefeld', grade: 'A 8G',
    tasks: ['Beantwortung von Anfragen mit „Nie gehört“', 'Pflege des Kartenmaterials (Ostwestfalen bitte weiß lassen)'],
    needs: ['Sie haben noch nie von Bielefeld gehört? Perfekt.'],
    offer: 'Arbeitsplatz in einer Stadt, die es nicht gibt. Keine Pendelzeit.',
  },
  {
    title: 'Tarnungsbeauftragte:r Nadelgehölze', unit: 'Abt. 1 – Masten & Tarnung', grade: 'A 7G',
    tasks: ['Anbringen von Glasfasernadeln', 'Jährliche Weihnachtsbeleuchtung der Dienstmasten'],
    needs: ['Schwindelfreiheit', 'Grundkenntnisse im Lametta-Recht'],
    offer: 'Fester Baum, flexible Äste.',
  },
  {
    title: 'Werkstudent:in Gedankenlesen', unit: 'Abt. 0 – Abteilung für Abteilungen', grade: 'Mindestlohn',
    tasks: ['Vorlesen eingehender Gedanken', 'Sortieren nach „wichtig“ und „Pizza“'],
    needs: ['Immatrikulation', 'Wir wissen bereits, dass Sie sich bewerben wollen.'],
    offer: 'Bewerbungsgespräch entfällt. Wir kennen die Antworten.',
  },
  {
    title: 'Beauftragte:r für Gratis-WLAN', unit: 'Abt. 3 – Aluhut-Angelegenheiten', grade: 'A 10G',
    tasks: ['Verteilung von WLAN-Gutscheinen an Aluhutträger:innen', 'Freundliches Zuhören (bis zu 60 Sekunden)'],
    needs: ['Geduld', 'Ausreichend Gutscheine'],
    offer: 'Dienstausweis mit Passwort „wahrheit123“.',
  },
  {
    title: 'Kantinenkraft (m/w/d) Mikrochip-Küche', unit: 'Kantine', grade: 'Tarif BAfG-K',
    tasks: ['Zubereitung der Mikrochip-Suppe', 'Ausgabe der Croûtons (nicht funkfähig)'],
    needs: ['Hygieneschulung', 'Keine Angst vor Silizium'],
    offer: 'Freies Mittagessen. Wirklich freies.',
  },
  {
    title: 'Astronaut:in für den Mond-Sendemast', unit: 'Abt. 6 – Orbitalfunk', grade: 'B 3G',
    tasks: ['Wartung des Mond-Sendemasts', 'Erklärung der Gezeiten gegenüber Bürger:innen'],
    needs: ['Raumanzug (Größe wird gestellt)', 'Bereitschaft zu sehr langen Dienstwegen'],
    offer: 'Aussicht.',
    unlock: phase(4), hint: 'Wird erst nach Erlangung der Weltherrschaft ausgeschrieben.',
  },
];

// ---------- Kantine ----------
// Index 0 = Montag … 4 = Freitag
export const MENU = [
  { day: 'Montag',     dish: 'Mikrochip-Suppe mit Croûtons',              side: 'dazu Brötchen, kabellos',            tags: 'vegetarisch · enthält Silizium' },
  { day: 'Dienstag',   dish: 'Gedankenstrom-Auflauf',                     side: 'mit Gemüse der Saison (Frequenzband)', tags: 'vegetarisch' },
  { day: 'Mittwoch',   dish: 'Funkloch-Käse mit Salzkartoffeln',          side: 'Emmentaler, Löcher werden nicht berechnet', tags: 'vegetarisch' },
  { day: 'Donnerstag', dish: 'Reptiloiden-Grillteller, serviert bei 38 °C', side: 'oder: Lavendel-Pudding aus der Chemtrail-Staffel', tags: 'nicht kühlen' },
  { day: 'Freitag',    dish: 'Fisch nach Bielefelder Art',                side: 'Gericht existiert nicht, wird aber trotzdem berechnet', tags: 'Spuren von Ostwestfalen' },
];
export const MENU_NOTE = 'Alle Gerichte können Spuren von 5G enthalten. 5G selbst ist geschmacksneutral und – im Ernst – harmlos.';

/** ISO-Kalenderwoche (für den Kantinenplan). */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// ---------- Organigramm ----------
export const ORG = {
  head: { title: 'Präsident:in', note: 'derzeit vakant' },
  staff: [
    { title: 'Stabsstelle Geheimakte', note: 'seit dem Leck unbesetzt' },
    { title: 'Personalrat der Reptiloiden', note: 'tagt bei 38 °C' },
  ],
  units: [
    { title: 'Abt. 0', name: 'Abteilung für Abteilungen', refs: ['Ref. 0.1 Gründung neuer Abteilungen', 'Ref. 0.2 Auflösung von Ref. 0.1'] },
    { title: 'Abt. 1', name: 'Masten & Tarnung', refs: ['Ref. 1.1 Tannen', 'Ref. 1.2 Kirchtürme', 'Ref. 1.3 Windräder (drehen nur zur Tarnung)'] },
    { title: 'Abt. 2', name: 'Luftraum', refs: ['Ref. 2.1 Chemtrail-Duftnoten', 'Ref. 2.2 Wartung der Taubendrohnen'] },
    { title: 'Abt. 3', name: 'Aluhut-Angelegenheiten', refs: ['Ref. 3.1 Gratis-WLAN', 'Ref. 3.2 Demo-Betreuung', 'Ref. 3.3 Wünschelruten-Koordination'] },
    { title: 'Abt. 4', name: 'Bielefeld', refs: ['nicht auffindbar'], missing: true },
    { title: 'Abt. 5', name: 'Rechenzentren', refs: ['Ref. 5.1 Klimaanlage (Sollwert 38 °C)', 'Ref. 5.2 Smart-Toaster-Netz'] },
    { title: 'Abt. 6', name: 'Orbitalfunk', refs: ['Ref. 6.1 Satelliten-Schwarm', 'Ref. 6.2 Mond-Sendemast', 'Ref. 6.3 ∞G-Quantentürme'] },
  ],
};

/** Pseudo-Personalnummer aus der Spielstand-ID (rein dekorativ). */
export function staffNumber(s) {
  const id = (s && s.runId) || '000000';
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `BAfG-${String(h % 100000).padStart(5, '0')}-5G`;
}
