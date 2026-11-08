// Eskalationsphasen (DESIGN.md §4.5). Jede Phase hat eigene Regionen und eine eigene Karte.
// Die bereits eroberte Fläche der Vorphase erscheint als eine Region mit `inherited: true`:
// Sie zählt immer zu 100 % und kann nicht bebaut werden.
import { STATES } from './states.js';
import { MAP_DE } from './map-de.js';
import { MAP_EU } from './map-eu.js';
import { MAP_WORLD } from './map-world.js';
import { MAP_ORBIT, MAP_UNIVERSE } from './map-space.js';

const NAME_FIX = { MDA: 'Moldau', GBR: 'Vereinigtes Königreich', BIH: 'Bosnien-Herzegowina' };

// Übernahme-Gags. Ton: Funk-Klischees und Verwaltung, keine Herabsetzung von Menschen.
const GAGS = {
  // Europa
  RUS: 'Größtes Land, längste Funkstrecke. Der Mast in Wladiwostok braucht 7 Zeitzonen bis zum Feierabend.',
  FRA: 'Baguette-Antennen in Betrieb. Der Streik dagegen ist für Donnerstag angemeldet.',
  GBR: 'Brexit-Frequenz aktiviert: Gedanken werden jetzt in Pfund gesendet.',
  ITA: 'Gedankenfunk jetzt al dente. Die Masten gestikulieren beim Senden.',
  ESP: 'Siesta-Modus: Zwischen 14 und 17 Uhr wird nur geträumt.',
  UKR: 'Sonnenblumenfelder richten sich jetzt nach dem Mast aus.',
  POL: 'Pierogi-Netz steht. Die Füllung ist ein Geheimnis.',
  ROU: 'Graf Dracula verlangt Nachtschicht-Zuschlag für den Burgmast.',
  NLD: 'Die Masten stehen jetzt auf Fahrrädern. Das ist hier so.',
  BEL: 'Die EU-Funkverordnung umfasst 4.000 Seiten. Sie wurde einstimmig ignoriert.',
  GRC: 'Das Orakel von Delphi läuft jetzt über 5G. Die Antworten bleiben vage.',
  CZE: 'Das Bier schäumt jetzt im Takt von 3,6 GHz.',
  SWE: 'Mast geliefert als Bausatz. Eine Schraube blieb übrig.',
  PRT: 'Pastéis de Nata mit Empfangsbalken.',
  HUN: 'Gulasch-Frequenz aktiviert. Scharf.',
  BLR: 'Übernahme verlief ruhig. Niemand hat gefragt.',
  AUT: 'Schmäh-Filter installiert. Gedanken kommen jetzt mit „Oida“ an.',
  CHE: 'Die Gedanken liegen jetzt auf einem Nummernkonto.',
  BGR: 'Joghurt-Kulturen strahlen jetzt von innen.',
  SRB: 'Ćevapčići-Grill dient jetzt als Richtfunkantenne.',
  DNK: 'Hygge-Modus: Masten senden nur noch bei Kerzenschein.',
  FIN: 'Saunatemperatur und Sendeleistung jetzt gekoppelt.',
  SVK: 'Die Tatra hat jetzt Vollausbau. Die Murmeltiere streamen.',
  NOR: 'Fjorde reflektieren das Signal. Die Lachse hören mit.',
  IRL: 'Kobolde melden Empfang am Ende jedes Regenbogens.',
  HRV: 'Die Adria-Inseln sind jetzt über Gedanken verbunden. Fähren bleiben trotzdem voll.',
  BIH: 'Die Brücke von Mostar trägt jetzt auch Funkwellen.',
  ALB: 'Die Bunker eignen sich hervorragend als Sendezentralen.',
  LTU: 'Basketball wird jetzt per Gedankenübertragung gespielt. Trefferquote 100 %.',
  MDA: 'Weinkeller in Mileștii Mici jetzt mit Vollempfang. Die Flaschen kichern.',
  SVN: 'Klein, grün, voll abgedeckt. Vorbildlich.',
  MKD: 'Ohrid-Forellen senden jetzt auf UKW.',
  LVA: 'Riga empfängt. Die Jugendstil-Fassaden flimmern leicht.',
  KOS: 'Netzabdeckung jetzt besser als die Bahnverbindung.',
  EST: 'Hatte schon digitales Wahlrecht. Jetzt auch digitale Gedanken.',
  MNE: 'Die Schwarzen Berge funken jetzt bunt.',
  LUX: 'Gedanken jetzt steuerlich optimiert.',
  MLT: 'Die ganze Insel in einem Mast. Effizient.',
  ISL: 'Vulkan als Sendemast umgewidmet. Der Mast heißt jetzt Eyjafjallajökull-2.',
  AND: 'Zollfreie Gedanken. Die Funkwellen kaufen hier Zigaretten.',
  MCO: 'Die Gedanken parken jetzt im Halteverbot. Mit Yacht.',
  LIE: 'Ein Mast reicht. Er steht auf dem Schlossdach.',
  SMR: 'Älteste Republik der Welt, neuester Sendemast.',
  VAT: 'Der Papst hat jetzt 5G. Die Gebete laufen mit Lesebestätigung.',
  // Welt
  NAM: 'Freedom-Frequenz: Jeder Mast trägt eine Flagge. Und einen Cowboyhut.',
  MAM: 'Maya-Pyramiden als Sender reaktiviert. War angeblich schon immer so gedacht.',
  KAR: 'Reggae jetzt auf 3,6 GHz. Entspannter war Funk nie.',
  SAM: 'Der Amazonas-Regenwald trägt jetzt getarnte Tannen. Die Tukane merken es.',
  NAF: 'Die Pyramiden waren die ersten Sendemasten. Das wussten Sie bestimmt schon.',
  WAF: 'Gedankenfunk ist jetzt mobil – und war es hier schon lange vor Europa.',
  ZAF: 'Der Kongo-Regenwald dämpft das Signal kaum. Respekt an die Gorillas.',
  OAF: 'Marathon-Läufer:innen sind schneller als das Signal. Wir arbeiten daran.',
  SAF: 'Tafelberg jetzt mit Tischdecke aus Funkwellen.',
  WAS: 'Wüstenmast mit Klimaanlage. Die Kamele bestehen auf Mitbenutzung.',
  ZAS: 'Seidenstraße jetzt Glasfaserstraße.',
  SAS: 'Größte Zielgruppe, längste Warteschlange am Mast. Und alle sind schneller als die Deutsche Bahn.',
  OAS: 'Die Masten waren schon da. Wir haben nur unsere Aufkleber draufgeklebt.',
  SOA: 'Reisfelder bewässern sich jetzt per Gedankenbefehl.',
  AUS: 'Alles steht kopf, auch die Antennen. Funktioniert trotzdem.',
  PAZ: 'Inselnetz komplett. Die Palmen sind jetzt Richtfunk.',
  // Orbit & Mond
  ISS: 'Die Crew hatte eh schon WLAN. Jetzt auch Gedankenfunk.',
  LEO: 'Die Satelliten haben jetzt Gefühle. Vor allem Höhenangst.',
  GEO: 'Die Wettersatelliten-Gewerkschaft stimmt zu. Morgen: heiter bis gedankenlos.',
  MOV: 'Die Mondkälber muhen jetzt im Takt der Gezeiten.',
  MOR: 'Die dunkle Seite des Mondes hat jetzt Licht. Und WLAN.',
  MAR: 'Die Marsmännchen waren die ganze Zeit grün. Das liegt nicht an uns.',
  // Universum
  MLS: 'Die eigene Galaxie. Wurde Zeit.',
  ANM: 'Andromeda reagiert erst in 2,5 Mio. Jahren. Wir warten.',
  TRI: 'Dreiecksgalaxie: Die Bermuda-Abteilung hat hier ihre Zentrale.',
  LMC: 'Magellan hätte sich gefreut. Er hatte keinen Empfang.',
  SMB: 'Sombrero-Galaxie: Fiesta-Frequenz aktiviert.',
  M51: 'Whirlpool-Galaxie: Das Signal sprudelt.',
  CAR: 'Wagenrad-Galaxie: Rollt jetzt in die richtige Richtung.',
  BIE: 'Der Bielefeld-Nebel existiert. Leider.',
  RAN: 'Am Rand des Universums hängt ein Schild: „Hier endet das WLAN.“ Wir haben es übermalt.',
};

const TOTAL = (list) => list.reduce((a, r) => a + r.pop, 0);

const fromMap = (map) => Object.entries(map.regions).map(([code, r]) => ({
  code, name: NAME_FIX[code] || r.name, pop: r.pop, gag: GAGS[code] || '',
}));

const P1 = STATES.map((s) => ({ ...s }));
const P2 = fromMap(MAP_EU).map((r) => (r.code === 'DEU' ? { ...r, pop: TOTAL(P1), inherited: true } : r));
const P3 = fromMap(MAP_WORLD).map((r) => (r.code === 'EUR' ? { ...r, pop: TOTAL(P2), inherited: true } : r));
const P4 = [
  { code: 'ERD', name: 'Erde', pop: TOTAL(P3), inherited: true },
  { code: 'ISS', name: 'Raumstation ISS', pop: 7, unit: 'Astronaut:innen', gag: GAGS.ISS },
  { code: 'LEO', name: 'Satellitengürtel', pop: 9e9, unit: 'Satelliten mit Bewusstsein', gag: GAGS.LEO },
  { code: 'GEO', name: 'Geostationärer Orbit', pop: 6e9, unit: 'gewerkschaftlich organisierte Wettersatelliten', gag: GAGS.GEO },
  { code: 'MOV', name: 'Mond (Vorderseite)', pop: 2.5e10, unit: 'Mondkälber', gag: GAGS.MOV },
  { code: 'MOR', name: 'Mond (Rückseite)', pop: 3.5e10, unit: 'Reptiloiden im Exil', gag: GAGS.MOR },
  { code: 'MAR', name: 'Mars', pop: 2e10, unit: 'Marsmännchen', gag: GAGS.MAR },
];
const P5 = [
  { code: 'SOL', name: 'Sonnensystem', pop: TOTAL(P4), inherited: true },
  { code: 'LMC', name: 'Große Magellansche Wolke', pop: 6e11, unit: 'Aliens mit Handy', gag: GAGS.LMC },
  { code: 'MLS', name: 'Milchstraße', pop: 2e12, unit: 'Aliens mit Handy', gag: GAGS.MLS },
  { code: 'BIE', name: 'Bielefeld-Nebel', pop: 4e12, unit: 'Wesen, die es nicht gibt', gag: GAGS.BIE },
  { code: 'TRI', name: 'Dreiecksgalaxie', pop: 8e12, unit: 'Aliens mit Handy', gag: GAGS.TRI },
  { code: 'ANM', name: 'Andromeda', pop: 2e13, unit: 'Aliens mit Handy', gag: GAGS.ANM },
  { code: 'CAR', name: 'Wagenrad-Galaxie', pop: 5e13, unit: 'Aliens mit Handy', gag: GAGS.CAR },
  { code: 'SMB', name: 'Sombrero-Galaxie', pop: 1.2e14, unit: 'Aliens mit Handy', gag: GAGS.SMB },
  { code: 'M51', name: 'Whirlpool-Galaxie', pop: 3e14, unit: 'Aliens mit Handy', gag: GAGS.M51 },
  { code: 'RAN', name: 'Rand des Universums', pop: 1e15, unit: 'Dinge, die man nicht beschreiben kann', gag: GAGS.RAN },
];

export const PHASES = [
  {
    id: 1, key: 'de', name: 'Deutschland', short: 'DE', title: 'LAGEKARTE DEUTSCHLAND', regionWord: 'Bundesland',
    wide: 'landesweit', wideAdj: 'landesweite', localShort: 'im Bundesland', wideLong: 'in ganz Deutschland', localLong: 'nur in dem Bundesland, in dem sie steht',
    beings: 'Menschen', takeBonus: 0.05, map: { viewBox: MAP_DE.viewBox, shapes: MAP_DE.states }, regions: P1,
  },
  {
    id: 2, key: 'eu', name: 'Europa', short: 'EU', title: 'LAGEKARTE EUROPA', regionWord: 'Land',
    wide: 'europaweit', wideAdj: 'europaweite', localShort: 'im Land', wideLong: 'in ganz Europa', localLong: 'nur in dem Land, in dem sie steht',
    beings: 'Menschen', takeBonus: 0.02, map: { viewBox: MAP_EU.viewBox, shapes: MAP_EU.regions }, regions: P2,
  },
  {
    id: 3, key: 'welt', name: 'Welt', short: 'WELT', title: 'LAGEKARTE WELT', regionWord: 'Weltregion',
    wide: 'weltweit', wideAdj: 'weltweite', localShort: 'in der Weltregion', wideLong: 'auf der ganzen Welt', localLong: 'nur in der Weltregion, in der sie steht',
    beings: 'Menschen', takeBonus: 0.05, map: { viewBox: MAP_WORLD.viewBox, shapes: MAP_WORLD.regions }, regions: P3,
  },
  {
    id: 4, key: 'orbit', name: 'Orbit & Mond', short: 'ORBIT', title: 'LAGEKARTE ORBIT & MOND', regionWord: 'Zone',
    wide: 'im ganzen Orbit', wideAdj: 'orbitweite', localShort: 'in der Zone', wideLong: 'im ganzen Orbit bis zum Mars', localLong: 'nur in der Zone, in der sie steht',
    beings: 'Lebewesen', takeBonus: 0.1, map: { ...MAP_ORBIT, shapes: MAP_ORBIT.regions }, regions: P4,
  },
  {
    id: 5, key: 'all', name: 'Universum', short: 'ALL', title: 'LAGEKARTE UNIVERSUM', regionWord: 'Galaxie',
    wide: 'universumsweit', wideAdj: 'universumsweite', localShort: 'in der Galaxie', wideLong: 'im ganzen Universum', localLong: 'nur in der Galaxie, in der sie steht',
    beings: 'Lebewesen', takeBonus: 0.1, map: { ...MAP_UNIVERSE, shapes: MAP_UNIVERSE.regions }, regions: P5,
  },
];

for (const p of PHASES) {
  p.total = TOTAL(p.regions);
  p.open = p.regions.filter((r) => !r.inherited); // bebaubare Regionen
  p.byCode = Object.fromEntries(p.regions.map((r) => [r.code, r]));
}

export const PHASE_BY_ID = Object.fromEntries(PHASES.map((p) => [p.id, p]));
export const LAST_PHASE = PHASES[PHASES.length - 1].id;
/** Code → { phase, region } über alle Phasen. */
export const REGION_INDEX = {};
for (const p of PHASES) for (const r of p.regions) REGION_INDEX[r.code] = { phase: p, region: r };

/** Prestige ist möglich, sobald die Welt (Phase 3) erobert ist. */
export const PRESTIGE_PHASE = 3;
