// Synthwave-Hintergrundmusik, komplett im Browser erzeugt (Web Audio API).
// Keine Audiodateien, keine fremden Samples – die Musik entsteht aus Oszillatoren und Rauschen
// und gehört damit vollständig zum Projekt (keine Lizenzfragen). DESIGN.md §4.15.
//
// Playlist aus 10 Stücken (ca. 20 Min.), danach von vorn. Jedes Stück hat eigenes Tempo, eigene Tonart,
// eigene Teile (Akkorde, Bass-, Arpeggio- und Drum-Muster) und eigene Klangfarben.
// Die vier europäischen Stücke (Frankreich, Polen, Italien, Finnland) kommen erst ab Phase 2 (Europa) dazu.
// Intensität 1–5 folgt der Eskalationsphase:
// 1 Pads, Bass, leise Drums · 2 + Snare mit Hall, Fills · 3 + Arpeggio mit Echo, Crash
// 4 + volle Drums, hellerer Klang · 5 + Lead-Melodien.

const STEPS_PER_BAR = 16;          // Standard (4/4); Stücke im 3/4-Takt haben 12
const BARS_PER_SECTION = 8;
const LOOKAHEAD = 0.15;             // so weit im Voraus wird geplant (s)
const TICK_MS = 25;

const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);

// Akkorde im A-Moll-Rahmen; jedes Stück transponiert sie in seine Tonart.
// pad: eng geführtes Voicing · bass: Grundton · arp: vier Arpeggio-Töne
const CHORDS = {
  Am: { pad: [57, 60, 64], bass: 33, arp: [69, 72, 76, 81] },
  F:  { pad: [57, 60, 65], bass: 29, arp: [65, 69, 72, 77] },
  C:  { pad: [55, 60, 64], bass: 36, arp: [67, 72, 76, 79] },
  G:  { pad: [55, 59, 62], bass: 31, arp: [67, 71, 74, 79] },
  Em: { pad: [55, 59, 64], bass: 28, arp: [64, 67, 71, 76] },
  E:  { pad: [56, 59, 64], bass: 28, arp: [64, 68, 71, 76] },
  Dm: { pad: [57, 62, 65], bass: 26, arp: [62, 65, 69, 74] },
  Bb: { pad: [58, 62, 65], bass: 34, arp: [65, 70, 74, 77] },
  A:  { pad: [57, 61, 64], bass: 33, arp: [69, 73, 76, 81] },
  B:  { pad: [59, 63, 66], bass: 35, arp: [71, 75, 78, 83] },
  D:  { pad: [57, 62, 66], bass: 26, arp: [62, 66, 69, 74] },
  E7: { pad: [56, 62, 64], bass: 28, arp: [64, 68, 71, 74] },
};

// Tonleitern im A-Rahmen (für die erzeugten Melodien)
const SCALES = {
  minor:     [69, 71, 72, 74, 76, 77, 79, 81, 83, 84],
  harmonic:  [69, 71, 72, 74, 76, 77, 80, 81, 83, 84],  // harmonisches Moll (Gis): Musette, Tango
  lydian:    [69, 71, 73, 75, 76, 78, 80, 81, 83, 85],  // A-lydisch (erhöhte Quarte): Podhale
  kantele:   [64, 69, 71, 72, 74, 76, 81],              // fünfsaitige Kantele: A H C D E (+ Rahmen)
};

// Arpeggio-Reihenfolgen (Index in chord.arp)
const ARPS = {
  updown: [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 3, 2, 1],
  climb:  [0, 2, 1, 3, 0, 2, 1, 3, 1, 3, 2, 3, 0, 2, 1, 3],
  pulse:  [0, 3, 1, 3, 2, 3, 1, 3, 0, 3, 1, 3, 2, 3, 1, 3],
};

// Bass-Muster: liefern je Sechzehntel { oct, int (Intervall in Halbtönen), len, vel } oder null
const BASS = {
  oompah:   (s) => (s % 4 === 0 ? { oct: false, int: s % 8 === 4 ? 7 : 0, len: 1.6, vel: s % 8 === 0 ? 1 : 0.75 } : null),
  mazurka:  (s) => (s % 4 === 0 ? { oct: false, int: s === 0 ? 0 : 7, len: s === 0 ? 3.5 : 1.6, vel: s === 4 ? 1 : 0.8 } : null),
  drone:    (s) => (s === 0 ? { oct: false, int: 0, len: 11.5, vel: 0.7 } : s === 6 ? { oct: false, int: 7, len: 5.5, vel: 0.5 } : null),
  italo:    (s) => (s % 2 === 0 ? { oct: s % 4 === 2, int: 0, len: 1.6, vel: s % 4 === 0 ? 1 : 0.85 } : null),
  habanera: (s) => ([0, 3, 4, 6, 8, 11, 12, 14].includes(s) ? { oct: false, int: [6, 14].includes(s) ? 7 : 0, len: s % 4 === 0 ? 2.6 : 0.9, vel: s % 8 === 0 ? 1 : 0.7 } : null),
  eighth: (s, lvl) => (s % 2 === 0 ? { oct: lvl >= 2 && s % 4 === 2, len: 1.8, vel: s % 4 === 0 ? 1 : 0.8 } : null),
  gallop: (s) => ([0, 2, 3].includes(s % 4) ? { oct: s % 8 === 3, len: s % 4 === 0 ? 1.8 : 0.9, vel: s % 4 === 0 ? 1 : 0.7 } : null),
  long:   (s) => (s === 0 ? { oct: false, len: 14, vel: 0.8 } : s === 14 ? { oct: true, len: 1.8, vel: 0.6 } : null),
  sync:   (s) => ([0, 3, 6, 8, 10, 11, 14].includes(s) ? { oct: s === 6 || s === 14, len: 1.6, vel: s === 0 || s === 8 ? 1 : 0.75 } : null),
};

// Handgeschriebene Melodien für Stück 1: [Takt, Schritt, MIDI-Ton, Länge in Schritten]
const LEAD_A = [
  [0, 0, 76, 6], [0, 6, 74, 2], [0, 8, 72, 8], [1, 0, 72, 4], [1, 4, 74, 4], [1, 8, 76, 8],
  [2, 0, 79, 6], [2, 6, 76, 2], [2, 8, 74, 8], [3, 0, 74, 4], [3, 4, 76, 4], [3, 8, 71, 8],
  [4, 0, 76, 6], [4, 6, 74, 2], [4, 8, 72, 8], [5, 0, 72, 4], [5, 4, 74, 4], [5, 8, 77, 8],
  [6, 0, 79, 8], [6, 8, 81, 8], [7, 0, 79, 4], [7, 4, 76, 12],
];
const LEAD_B = [
  [0, 0, 72, 4], [0, 4, 74, 4], [0, 8, 76, 8], [1, 0, 74, 4], [1, 4, 76, 4], [1, 8, 79, 8],
  [2, 0, 81, 12], [2, 12, 79, 4], [3, 0, 76, 16], [4, 0, 72, 4], [4, 4, 74, 4], [4, 8, 77, 8],
  [5, 0, 79, 8], [5, 8, 77, 4], [5, 12, 76, 4], [6, 0, 76, 8], [6, 8, 79, 8], [7, 0, 80, 16],
];
const LEAD_D = [
  [0, 0, 79, 6], [0, 6, 76, 2], [0, 8, 72, 8], [1, 0, 74, 6], [1, 6, 71, 2], [1, 8, 67, 8],
  [2, 0, 72, 4], [2, 4, 76, 4], [2, 8, 81, 8], [3, 0, 77, 8], [3, 8, 76, 4], [3, 12, 74, 4],
  [4, 0, 79, 6], [4, 6, 76, 2], [4, 8, 72, 8], [5, 0, 74, 6], [5, 6, 79, 2], [5, 8, 83, 8],
  [6, 0, 81, 8], [6, 8, 77, 8], [7, 0, 76, 8], [7, 8, 80, 8],
];

/**
 * Melodie nach festen Regeln aus den Akkorden (gleicher seed = gleiche Melodie):
 * Taktanfang auf einem Akkordton, dazwischen kleine Schritte auf der Tonleiter, am Ende ein langer Ton.
 */
function makeLead(chords, seed, { scale = 'minor', spb = 16 } = {}) {
  const rnd = mulberry32(seed);
  const RHYTHMS = spb === 12 ? [
    [[0, 4], [4, 4], [8, 4]], [[0, 3], [3, 1], [4, 4], [8, 4]], [[0, 8], [8, 4]], [[0, 2], [2, 2], [4, 8]], [[0, 6], [6, 2], [8, 4]],
  ] : [
    [[0, 6], [6, 2], [8, 8]], [[0, 4], [4, 4], [8, 8]], [[0, 8], [8, 8]],
    [[0, 12], [12, 4]], [[0, 4], [4, 4], [8, 4], [12, 4]], [[0, 6], [6, 6], [12, 4]],
  ];
  const SCALE = SCALES[scale];
  const near = (list, target) => list.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  const out = [];
  let prev = 76;
  chords.forEach((name, bar) => {
    const tones = CHORDS[name].arp.flatMap((m) => [m - 12, m, m + 12]).filter((m) => m >= 67 && m <= 86);
    const last = bar === chords.length - 1;
    const rhythm = last ? [[0, spb]] : RHYTHMS[Math.floor(rnd() * RHYTHMS.length)];
    rhythm.forEach(([st, len], i) => {
      let m;
      if (i === 0) {
        const opts = tones.filter((t) => Math.abs(t - prev) <= 5);
        m = opts.length ? opts[Math.floor(rnd() * opts.length)] : near(tones, prev);
      } else {
        const idx = SCALE.indexOf(near(SCALE, prev));
        const stepBy = [-2, -1, -1, 1, 1, 2][Math.floor(rnd() * 6)];
        m = SCALE[Math.max(0, Math.min(SCALE.length - 1, idx + stepBy))];
      }
      if (m > 81 && rnd() < 0.6) m -= 12; // nicht zu lange oben bleiben
      out.push([bar, st, m, len]);
      prev = m;
    });
  });
  return out;
}

// ---------- Playlist ----------
// sound: arpWave/arpRate (1 = 16tel, 2 = 8tel)/arpBright · delaySteps (Echo in Sechzehnteln) · padBright · leadWave
// drums je Teil: full · drive (durchgehende Kick) · half (Halftime) · sparse · break (Breakdown)
const S = (chords, arp, bass, drums, lead = null) => ({ chords, arp, bass, drums, lead });
export const SONGS = [
  {
    title: 'Gedankenfunk', bpm: 96, transpose: 0,
    sound: { arpWave: 'square', arpRate: 1, arpBright: 1, delaySteps: 3, padBright: 1, leadWave: 'sawtooth' },
    sections: {
      A: S(['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Em'], 'updown', 'eighth', 'full', LEAD_A),
      B: S(['F', 'G', 'Am', 'Am', 'F', 'G', 'C', 'E'], 'climb', 'gallop', 'full', LEAD_B),
      C: S(['Dm', 'Am', 'F', 'G', 'Dm', 'Am', 'F', 'E'], 'pulse', 'long', 'break'),
      D: S(['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'E'], 'updown', 'sync', 'full', LEAD_D),
    },
    order: ['A', 'B', 'A', 'C', 'D', 'B'],
  },
  {
    title: 'Nachtschicht in Bielefeld', bpm: 86, transpose: 5,
    sound: { arpWave: 'triangle', arpRate: 2, arpBright: 0.8, delaySteps: 4, padBright: 0.85, leadWave: 'square' },
    sections: {
      A: S(['Am', 'Am', 'F', 'F', 'C', 'C', 'G', 'G'], 'updown', 'long', 'half', 'gen:21'),
      B: S(['F', 'G', 'Am', 'Am', 'F', 'G', 'Em', 'Em'], 'climb', 'eighth', 'half', 'gen:22'),
      C: S(['Dm', 'Dm', 'Am', 'Am', 'F', 'F', 'E', 'E'], 'pulse', 'long', 'break'),
    },
    order: ['A', 'B', 'A', 'C', 'B', 'A'],
  },
  {
    title: 'Autobahn nach Brüssel', bpm: 112, transpose: -5,
    sound: { arpWave: 'sawtooth', arpRate: 1, arpBright: 1.2, delaySteps: 3, padBright: 1.1, leadWave: 'sawtooth' },
    sections: {
      A: S(['Am', 'G', 'F', 'G', 'Am', 'G', 'F', 'E'], 'pulse', 'gallop', 'drive', 'gen:31'),
      B: S(['F', 'C', 'G', 'Am', 'F', 'C', 'G', 'G'], 'updown', 'gallop', 'drive', 'gen:32'),
      C: S(['Am', 'Am', 'F', 'F', 'G', 'G', 'E', 'E'], 'climb', 'long', 'break'),
      D: S(['F', 'G', 'Am', 'C', 'F', 'G', 'E', 'E'], 'climb', 'sync', 'drive', 'gen:33'),
    },
    order: ['A', 'B', 'A', 'C', 'D', 'B', 'A'],
  },
  {
    title: 'Chemtrail-Sonnenuntergang', bpm: 100, transpose: 3,
    sound: { arpWave: 'square', arpRate: 1, arpBright: 1.1, delaySteps: 3, padBright: 1.2, leadWave: 'triangle' },
    sections: {
      A: S(['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'F'], 'updown', 'eighth', 'full', 'gen:41'),
      B: S(['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'G'], 'climb', 'gallop', 'full', 'gen:42'),
      C: S(['F', 'F', 'C', 'C', 'Dm', 'Dm', 'G', 'G'], 'pulse', 'long', 'break'),
    },
    order: ['A', 'B', 'A', 'C', 'A', 'B'],
  },
  {
    title: 'Mondbasis Alpha', bpm: 80, transpose: -3,
    sound: { arpWave: 'triangle', arpRate: 2, arpBright: 0.9, delaySteps: 6, padBright: 0.9, leadWave: 'triangle' },
    sections: {
      A: S(['Am', 'F', 'Am', 'F', 'Dm', 'Am', 'E', 'E'], 'updown', 'long', 'sparse'),
      B: S(['F', 'G', 'Am', 'Em', 'F', 'G', 'Am', 'Am'], 'climb', 'eighth', 'half', 'gen:51'),
      C: S(['Dm', 'Am', 'Bb', 'Bb', 'Dm', 'Am', 'E', 'E'], 'pulse', 'long', 'break'),
    },
    order: ['A', 'B', 'C', 'B', 'A'],
  },
  {
    title: 'Kosmische Verwaltungsreform', bpm: 118, transpose: 2,
    sound: { arpWave: 'sawtooth', arpRate: 1, arpBright: 1.3, delaySteps: 3, padBright: 1.15, leadWave: 'sawtooth' },
    sections: {
      A: S(['Am', 'F', 'C', 'G', 'Am', 'F', 'Bb', 'E'], 'climb', 'gallop', 'drive', 'gen:61'),
      B: S(['Dm', 'Am', 'Bb', 'F', 'Dm', 'Am', 'E', 'E'], 'updown', 'sync', 'full', 'gen:62'),
      C: S(['F', 'F', 'G', 'G', 'Am', 'Am', 'E', 'E'], 'pulse', 'long', 'break'),
      D: S(['F', 'G', 'Am', 'F', 'F', 'G', 'E', 'E'], 'pulse', 'gallop', 'drive', 'gen:63'),
    },
    order: ['A', 'B', 'A', 'C', 'D', 'B', 'A'],
  },
];

// ---------- Europa (ab Phase 2): eigene Kompositionen im Stil des jeweiligen Landes ----------
// Frankreich: Valse-Musette-Charakter – Akkordeon, Umpa-Bass, harmonisches Moll mit chromatischen Durchgängen
const LEAD_FR = [
  [0, 0, 76, 4], [0, 4, 77, 2], [0, 6, 76, 2], [0, 8, 75, 2], [0, 10, 76, 6],
  [1, 0, 81, 8], [1, 8, 76, 4], [1, 12, 72, 4],
  [2, 0, 74, 4], [2, 4, 76, 2], [2, 6, 74, 2], [2, 8, 71, 4], [2, 12, 68, 4],
  [3, 0, 71, 6], [3, 6, 74, 2], [3, 8, 80, 8],
  [4, 0, 80, 4], [4, 4, 81, 2], [4, 6, 80, 2], [4, 8, 77, 4], [4, 12, 74, 4],
  [5, 0, 76, 6], [5, 6, 74, 2], [5, 8, 71, 8],
  [6, 0, 72, 4], [6, 4, 76, 4], [6, 8, 81, 6], [6, 14, 80, 2],
  [7, 0, 81, 16],
];
// Polen: Góralen-Musik der Tatra – Mazurka (3/4, Betonung auf der Zwei), lydisch (Dis), Geige über Bordun
const LEAD_PL = [
  [0, 0, 76, 2], [0, 2, 75, 2], [0, 4, 76, 4], [0, 8, 81, 4],
  [1, 0, 78, 4], [1, 4, 75, 2], [1, 6, 71, 2], [1, 8, 75, 4],
  [2, 0, 73, 2], [2, 2, 75, 2], [2, 4, 76, 4], [2, 8, 73, 4],
  [3, 0, 71, 6], [3, 6, 75, 2], [3, 8, 78, 4],
  [4, 0, 76, 2], [4, 2, 75, 2], [4, 4, 76, 4], [4, 8, 81, 4],
  [5, 0, 83, 4], [5, 4, 81, 2], [5, 6, 78, 2], [5, 8, 75, 4],
  [6, 0, 76, 4], [6, 4, 80, 4], [6, 8, 83, 4],
  [7, 0, 81, 12],
];
// Italien: Italo Disco – Oktav-Bass, Four-on-the-Floor, Bläser-Hook mit Tonwiederholungen
const LEAD_IT = [
  [0, 0, 76, 2], [0, 2, 76, 2], [0, 4, 74, 2], [0, 6, 76, 4], [0, 10, 72, 6],
  [1, 0, 72, 2], [1, 2, 72, 2], [1, 4, 74, 2], [1, 6, 72, 4], [1, 10, 69, 6],
  [2, 0, 71, 2], [2, 2, 71, 2], [2, 4, 74, 2], [2, 6, 79, 4], [2, 10, 76, 6],
  [3, 0, 74, 8], [3, 8, 71, 8],
  [4, 0, 77, 2], [4, 2, 77, 2], [4, 4, 76, 2], [4, 6, 74, 4], [4, 10, 72, 6],
  [5, 0, 74, 2], [5, 2, 74, 2], [5, 4, 76, 2], [5, 6, 79, 4], [5, 10, 81, 6],
  [6, 0, 79, 4], [6, 4, 76, 4], [6, 8, 72, 8],
  [7, 0, 80, 8], [7, 8, 76, 8],
];
// Finnland: Finnischer Tango – melancholisches Moll, Habanera-Rhythmus; Kantele als Arpeggio
const LEAD_FI = [
  [0, 0, 76, 6], [0, 6, 77, 2], [0, 8, 76, 4], [0, 12, 72, 4],
  [1, 0, 74, 6], [1, 6, 76, 2], [1, 8, 77, 8],
  [2, 0, 76, 4], [2, 4, 74, 4], [2, 8, 71, 4], [2, 12, 68, 4],
  [3, 0, 69, 12], [3, 12, 71, 4],
  [4, 0, 72, 6], [4, 6, 74, 2], [4, 8, 77, 4], [4, 12, 81, 4],
  [5, 0, 77, 6], [5, 6, 76, 2], [5, 8, 74, 8],
  [6, 0, 76, 4], [6, 4, 80, 4], [6, 8, 83, 4], [6, 12, 80, 4],
  [7, 0, 76, 16],
];

SONGS.push(
  {
    title: 'Café de la Fréquence', bpm: 104, transpose: 0, from: 2, country: 'Frankreich',
    sound: { arpWave: 'square', arpRate: 2, arpBright: 0.9, delaySteps: 3, padBright: 0.95, leadWave: 'accordion' },
    sections: {
      A: S(['Am', 'Am', 'E7', 'E7', 'E7', 'E7', 'Am', 'Am'], 'updown', 'oompah', 'musette', LEAD_FR),
      B: S(['Dm', 'Am', 'E7', 'Am', 'F', 'Bb', 'E7', 'A'], 'climb', 'oompah', 'musette', 'gen:71:harmonic'),
      C: S(['Dm', 'Dm', 'Am', 'Am', 'Bb', 'Bb', 'E7', 'E7'], 'pulse', 'long', 'break'),
    },
    order: ['A', 'B', 'A', 'C', 'B', 'A'],
  },
  {
    title: 'Góralski Sygnał', bpm: 126, transpose: 2, spb: 12, from: 2, country: 'Polen',
    sound: { arpWave: 'square', arpRate: 2, arpBright: 1, delaySteps: 4, padBright: 1.05, leadWave: 'fiddle' },
    sections: {
      A: S(['A', 'B', 'A', 'B', 'A', 'B', 'E', 'A'], 'updown', 'mazurka', 'mazurka', LEAD_PL),
      B: S(['D', 'E', 'A', 'A', 'D', 'E', 'B', 'B'], 'climb', 'mazurka', 'mazurka', 'gen:81:lydian'),
      C: S(['A', 'A', 'B', 'B', 'A', 'A', 'E', 'E'], 'pulse', 'drone', 'break'),
      D: S(['E', 'D', 'A', 'A', 'E', 'D', 'B', 'E'], 'pulse', 'mazurka', 'mazurka', 'gen:82:lydian'),
    },
    order: ['A', 'B', 'A', 'C', 'D', 'B', 'A', 'D', 'A'],
  },
  {
    title: 'Amore a 3,6 GHz', bpm: 120, transpose: -2, from: 2, country: 'Italien',
    sound: { arpWave: 'square', arpRate: 1, arpBright: 1.3, delaySteps: 3, padBright: 1.2, leadWave: 'brass' },
    sections: {
      A: S(['Am', 'F', 'G', 'Em', 'Dm', 'G', 'C', 'E'], 'updown', 'italo', 'italo', LEAD_IT),
      B: S(['F', 'G', 'Am', 'Am', 'F', 'G', 'E', 'E'], 'climb', 'italo', 'italo', 'gen:91:minor'),
      C: S(['Am', 'Am', 'F', 'F', 'G', 'G', 'E', 'E'], 'pulse', 'long', 'break'),
    },
    order: ['A', 'B', 'A', 'C', 'A', 'B', 'A'],
  },
  {
    title: 'Revontulten tango', bpm: 108, transpose: -4, from: 2, country: 'Finnland',
    sound: { arpWave: 'pluck', arpRate: 1, arpBright: 1, delaySteps: 3, padBright: 0.85, leadWave: 'sawtooth' },
    sections: {
      A: S(['Am', 'Dm', 'E7', 'Am', 'F', 'Dm', 'E7', 'E7'], 'updown', 'habanera', 'tango', LEAD_FI),
      B: S(['Dm', 'Am', 'E7', 'Am', 'Dm', 'Am', 'F', 'E7'], 'climb', 'habanera', 'tango', 'gen:101:harmonic'),
      C: S(['Am', 'Am', 'Dm', 'Dm', 'Am', 'Am', 'E7', 'E7'], 'pulse', 'drone', 'break', 'gen:102:kantele'),
    },
    order: ['A', 'B', 'A', 'C', 'B', 'A'],
  },
);

// Abgeleitete Werte: generierte Melodien ('gen:<seed>[:<Tonleiter>]'), Takt, Länge in Schritten und Sekunden
for (const song of SONGS) {
  song.spb = song.spb || STEPS_PER_BAR;
  song.from = song.from || 1;
  for (const sec of Object.values(song.sections)) {
    if (typeof sec.lead === 'string') {
      const [, seed, scale = 'minor'] = sec.lead.split(':');
      sec.lead = makeLead(sec.chords, Number(seed), { scale, spb: song.spb });
    }
  }
  song.step = 60 / song.bpm / 4;
  song.bars = song.order.length * BARS_PER_SECTION;
  song.steps = song.bars * song.spb;
  song.seconds = song.steps * song.step;
}

/** Welche Stücke in dieser Phase laufen dürfen (Indizes in SONGS). */
export function playlistFor(phase) {
  return SONGS.map((song, i) => (song.from <= phase ? i : -1)).filter((i) => i >= 0);
}

export class Synthwave {
  constructor({ volume = 0.5, intensity = 1, onSong = null } = {}) {
    this.volume = clamp01(volume);
    this.intensity = clampInt(intensity, 1, 5);
    this.onSong = onSong;  // wird mit dem Song-Objekt aufgerufen, sobald ein neues Stück beginnt
    this.ctx = null;
    this.timer = null;
    const pool = playlistFor(this.intensity);
    this.songIdx = pool[Math.floor(Math.random() * pool.length)]; // zufälliger Einstieg in die Playlist
    this.step = 0;
    this.nextTime = 0;
    this.wanted = false;   // soll laufen (unabhängig davon, ob der Tab gerade sichtbar ist)
    this.onVisibility = () => this.syncVisibility();
  }

  get playing() { return this.wanted; }
  get song() { return SONGS[this.songIdx]; }

  /** Muss beim ersten Mal aus einer Nutzeraktion heraus aufgerufen werden (Autoplay-Regeln der Browser). */
  async start() {
    this.wanted = true;
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.build(this.ctx, this.ctx.destination);
      document.addEventListener('visibilitychange', this.onVisibility);
    }
    if (this.ctx.state !== 'running') await this.ctx.resume().catch(() => {});
    if (this.ctx.state !== 'running') return false;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(this.targetGain(), t + 1.5);
    if (!this.timer) {
      this.nextTime = t + 0.05;
      this.applySong(this.nextTime);
      this.timer = setInterval(() => this.schedule(), TICK_MS);
    }
    return true;
  }

  stop() {
    this.wanted = false;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.4);
    clearInterval(this.timer);
    this.timer = null;
    setTimeout(() => { if (!this.wanted) this.ctx.suspend().catch(() => {}); }, 500);
  }

  /** Nächstes erlaubtes Stück (die europäischen erst ab Phase 2). */
  nextIndex() {
    const pool = playlistFor(this.intensity);
    return pool.find((i) => i > this.songIdx) ?? pool[0];
  }

  /** Zum nächsten Stück springen (Knopf „Nächster Titel“). */
  next() {
    this.songIdx = this.nextIndex();
    this.step = 0;
    if (this.ctx && this.timer) {
      this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
      this.applySong(this.nextTime);
    } else {
      this.onSong?.(this.song);
    }
  }

  setVolume(v) {
    this.volume = clamp01(v);
    if (this.ctx && this.wanted) this.master.gain.setTargetAtTime(this.targetGain(), this.ctx.currentTime, 0.05);
  }

  setIntensity(n) {
    this.intensity = clampInt(n, 1, 5);
    if (this.ctx) this.pad.filter.frequency.setTargetAtTime(this.padCutoff(), this.ctx.currentTime, 2);
  }

  targetGain() { return this.volume ** 2 * 0.9; } // quadratisch: Regler fühlt sich natürlicher an

  /** Im Hintergrund drosseln Browser Timer – dann lieber pausieren als stottern. */
  syncVisibility() {
    if (!this.ctx || !this.wanted) return;
    if (document.hidden) {
      clearInterval(this.timer);
      this.timer = null;
      this.ctx.suspend().catch(() => {});
    } else {
      this.ctx.resume().then(() => {
        if (!this.timer && this.wanted) {
          this.nextTime = this.ctx.currentTime + 0.05;
          this.timer = setInterval(() => this.schedule(), TICK_MS);
        }
      }).catch(() => {});
    }
  }

  // ---------- Klangerzeugung ----------

  /** Baut Effekte und Busse. ctx kann auch ein OfflineAudioContext sein (Tests). */
  build(ctx, destination) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    this.master.connect(comp).connect(destination);

    this.dry = ctx.createGain();
    this.dry.connect(this.master);

    // Hall: vier parallele Rückkopplungs-Echos mit Tiefpass (Schroeder-Prinzip), wie ein 80er-Hallgerät.
    // Kein ConvolverNode: braucht keinen großen Impuls-Puffer und weniger Rechenleistung.
    this.reverb = ctx.createGain();
    const revOut = ctx.createGain(); revOut.gain.value = 0.32;
    revOut.connect(this.master);
    [0.0445, 0.0557, 0.0617, 0.0656].forEach((time, i) => {
      const d = ctx.createDelay(0.2); d.delayTime.value = time;
      const damp = ctx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 3200 - i * 300;
      const fbk = ctx.createGain(); fbk.gain.value = 0.78;
      this.reverb.connect(d);
      d.connect(damp).connect(fbk).connect(d);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
      if (pan.pan) pan.pan.value = i % 2 ? 0.6 : -0.6;
      damp.connect(pan).connect(revOut);
    });

    // Echo (Länge je Stück, meist punktierte Achtel) – das typische Synthwave-Arpeggio
    this.delay = ctx.createDelay(2);
    this.delay.delayTime.value = this.song.step * this.song.sound.delaySteps;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2800;
    this.delay.connect(tone).connect(fb).connect(this.delay);
    const delOut = ctx.createGain(); delOut.gain.value = 0.55;
    tone.connect(delOut).connect(this.master);

    // Pad-Bus mit langsam „atmendem“ Tiefpass
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass'; padFilter.Q.value = 2; padFilter.frequency.value = this.padCutoff();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 350;
    lfo.connect(lfoAmt).connect(padFilter.frequency);
    lfo.start();
    const padOut = ctx.createGain(); padOut.gain.value = 1;
    padFilter.connect(padOut);
    padOut.connect(this.dry);
    const padSend = ctx.createGain(); padSend.gain.value = 0.35;
    padOut.connect(padSend).connect(this.reverb);
    this.pad = { filter: padFilter, lfo };

    this.noise = noiseBuffer(ctx);
  }

  padCutoff() { return [0, 900, 1100, 1400, 1900, 2300][this.intensity] * (this.song?.sound.padBright || 1); }

  /** Stellt Echo-Länge und Pad-Filter auf das aktuelle Stück ein. */
  applySong(t) {
    const song = this.song;
    if (this.delay) this.delay.delayTime.setValueAtTime(song.step * song.sound.delaySteps, t);
    if (this.pad) this.pad.filter.frequency.setTargetAtTime(this.padCutoff(), t, 1);
    this.onSong?.(song);
  }

  schedule() {
    const ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      const song = this.song;
      this.playStep(song, this.step, this.nextTime);
      this.nextTime += song.step;
      this.step++;
      if (this.step >= song.steps) {           // Stück zu Ende → nächstes aus der Playlist
        this.step = 0;
        this.songIdx = this.nextIndex();
        this.nextTime += song.step * 4;        // kurze Atempause (ein Viertel)
        this.applySong(this.nextTime);
      }
    }
  }

  /** Spielt alles, was auf einen Sechzehntel-Schritt eines Stücks fällt. */
  playStep(song, step, t) {
    const lvl = this.intensity;
    const st = song.step;
    const tr = song.transpose;
    const snd = song.sound;
    const spb = song.spb;
    const songBar = Math.floor(step / spb) % song.bars;
    const sec = song.sections[song.order[Math.floor(songBar / BARS_PER_SECTION)]];
    const bar = songBar % BARS_PER_SECTION;   // Takt innerhalb des Teils
    const s = step % spb;
    const chord = CHORDS[sec.chords[bar]];
    const style = sec.drums;
    const brk = style === 'break';
    const lastBar = bar === BARS_PER_SECTION - 1;

    // Pads: einmal pro Takt, weich überblendet
    if (s === 0) for (const m of chord.pad) this.padNote(m + tr, t, st * spb);

    // Bass nach Muster des Teils (nie tiefer als E1)
    const b = BASS[sec.bass](s, lvl);
    if (b) {
      let m = chord.bass + tr + (b.oct ? 12 : 0) + (b.int || 0);
      while (m < 28) m += 12;
      this.bassNote(m, t, st * b.len, b.vel);
    }

    // Arpeggio ab Stufe 3 (im Breakdown schon ab Stufe 1, dort trägt es den Teil)
    if ((lvl >= 3 || brk) && s % snd.arpRate === 0) {
      const m = chord.arp[ARPS[sec.arp][(s / snd.arpRate + bar * spb / snd.arpRate) % 16]] + tr;
      this.arpNote(m, t, st * 0.9 * snd.arpRate, (s % 4 === 0 ? 1 : 0.75) * (brk && lvl < 3 ? 0.7 : 1), snd);
    }

    // Crash zu Beginn jedes Teils (außer Breakdown)
    if (lvl >= 3 && bar === 0 && s === 0 && !brk) this.crash(t);

    // Drums
    this.drums(style, lvl, bar, s, lastBar, t, spb);

    // Lead-Melodie ab Stufe 5
    if (lvl >= 5 && sec.lead) {
      for (const [lb, ls, m, len] of sec.lead) if (lb === bar && ls === s) this.leadNote(m + tr, t, st * len, snd.leadWave);
    }
  }

  drums(style, lvl, bar, s, lastBar, t, spb = STEPS_PER_BAR) {
    const fill = lvl >= 2 && lastBar && s >= spb - 3;
    if (style === 'break') {
      // Breakdown: Takt 1–4 nur Hi-Hats, 5–7 halbe Kick, letzter Takt Snare-Wirbel als Aufbau
      if (s % 4 === 2) this.hat(t, 0.7, false);
      if (bar >= 4 && bar < 7 && (s === 0 || s === spb / 2)) this.kick(t, 0.6);
      if (lastBar && lvl >= 2 && (s % 4 === 0 || s >= spb / 2)) this.snare(t, 0.35 + 0.65 * (s / (spb - 1)));
      return;
    }
    if (style === 'musette') {
      // Umpa: Kick auf 1 und 3, leichte Snare („Tschick“) auf 2 und 4
      if (s === 0 || s === 8) this.kick(t, 0.75);
      if (lvl >= 2 && (s === 4 || s === 12)) this.snare(t, 0.45);
      if (s % 4 === 2 || (lvl >= 4 && s % 2 === 0)) this.hat(t, s % 4 === 2 ? 0.8 : 0.4, false);
      if (fill) this.snare(t, 0.5);
      return;
    }
    if (style === 'mazurka') {
      // 3/4 mit Betonung auf der Zwei
      if (s === 0) this.kick(t, 0.9);
      if (lvl >= 2 && s === 4) this.snare(t, 1);
      if (lvl >= 3 && s === 8) this.snare(t, 0.4);
      if (s % 4 === 2 || (lvl >= 4 && s % 2 === 0)) this.hat(t, s % 4 === 2 ? 0.8 : 0.4, false);
      if (fill) this.snare(t, 0.5);
      return;
    }
    if (style === 'italo') {
      // Four-on-the-Floor, Clap auf 2 und 4, offene Hi-Hat auf den Offbeats
      if (s % 4 === 0 && (lvl >= 2 || s % 8 === 0)) this.kick(t, lvl >= 4 ? 1 : 0.85);
      if (lvl >= 2 && (s === 4 || s === 12)) { this.snare(t, 0.8); this.clap(t); }
      if (lvl >= 2 && s % 4 === 2) this.hat(t, 0.8, true);
      else if (lvl >= 4 || s % 4 === 2) this.hat(t, 0.4, false);
      if (fill) this.snare(t, 0.5);
      return;
    }
    if (style === 'tango') {
      // Tango: markierte Schläge, Auftakt-Snare vor der Eins
      if (s === 0 || s === 8 || (lvl >= 4 && (s === 4 || s === 12))) this.kick(t, s % 8 === 0 ? 0.9 : 0.55);
      if (lvl >= 2 && (s === 4 || s === 12)) this.snare(t, 0.55);
      if (lvl >= 3 && s === 15) this.snare(t, 0.7);
      if (s % 4 === 2) this.hat(t, 0.6, false);
      return;
    }
    if (style === 'sparse') {
      if (s === 0 && lvl >= 2) this.kick(t, 0.6);
      if (s % 4 === 0) this.hat(t, 0.6, false);
      if (lvl >= 4 && s === 8) this.snare(t, 0.4);
      return;
    }
    if (style === 'half') {
      if (s === 0 || (lvl >= 4 && s === 10)) this.kick(t, lvl >= 4 ? 0.95 : 0.75);
      if (lvl >= 2 && s === 8) this.snare(t, 1);
      if (s % 2 === 0) this.hat(t, s % 4 === 2 ? 0.9 : 0.5, false);
      if (lvl >= 2 && lastBar && s >= 13) this.snare(t, 0.5);
      return;
    }
    if (style === 'drive') {
      if (s % 4 === 0 && (lvl >= 2 || s % 8 === 0)) this.kick(t, lvl >= 4 ? 1 : 0.8);
      if (lvl >= 2 && (s === 4 || s === 12)) this.snare(t, 1);
      if (lvl >= 3 && s % 4 === 2) this.hat(t, 0.8, true);
      else if (lvl >= 4 || s % 2 === 0) this.hat(t, s % 4 === 2 ? 1 : 0.45, false);
      if (lvl >= 2 && lastBar && s >= 12) this.snare(t, 0.4 + 0.15 * (s - 12));
      return;
    }
    // full
    const fullKick = lvl >= 4;
    if (s === 0 || s === 8 || (fullKick && (s === 4 || s === 12))) this.kick(t, fullKick ? 1 : 0.7);
    if (lvl >= 2 && (s === 4 || s === 12)) this.snare(t, 1);
    if (lvl >= 2 && lastBar && s >= 13) this.snare(t, 0.55);          // kleiner Fill vor dem nächsten Teil
    if (lvl >= 4 ? true : s % 4 === 2) this.hat(t, s % 4 === 2 ? 1 : 0.5, false);
    if (lvl >= 4 && s === 14) this.hat(t, 0.8, true);
  }

  padNote(midi, t, dur) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.055, t + 0.8);
    g.gain.setValueAtTime(0.055, t + dur - 0.1);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.9);
    g.connect(this.pad.filter);
    for (const det of [-9, 9]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = midiHz(midi); o.detune.value = det;
      o.connect(g); o.start(t); o.stop(t + dur + 1);
    }
  }

  bassNote(midi, t, dur, vel) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiHz(midi);
    const sub = ctx.createOscillator(); sub.type = 'square'; sub.frequency.value = midiHz(midi - 12);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(300 + 900 * vel, t);
    f.frequency.exponentialRampToValueAtTime(140, t + dur);
    const g = ctx.createGain();
    env(g.gain, t, 0.005, dur, 0.16 * vel, 0.05);
    const subG = ctx.createGain(); subG.gain.value = 0.35;
    o.connect(f); sub.connect(subG).connect(f); f.connect(g).connect(this.dry);
    o.start(t); sub.start(t); o.stop(t + dur + 0.1); sub.stop(t + dur + 0.1);
  }

  arpNote(midi, t, dur, vel, snd) {
    const ctx = this.ctx;
    if (snd.arpWave === 'pluck') { this.pluck(midi, t, vel); return; }
    const o = ctx.createOscillator(); o.type = snd.arpWave; o.frequency.value = midiHz(midi);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = (1800 + 400 * this.intensity) * snd.arpBright; f.Q.value = 3;
    const g = ctx.createGain();
    const loud = snd.arpWave === 'triangle' ? 1.8 : snd.arpWave === 'sawtooth' ? 0.8 : 1; // Dreieck ist leiser, Säge lauter
    env(g.gain, t, 0.003, dur, 0.035 * vel * loud, 0.06);
    o.connect(f).connect(g);
    g.connect(this.dry); g.connect(this.delay);
    o.start(t); o.stop(t + dur + 0.1);
  }

  /** Kantele: gezupfte Saite – Dreieck plus leise Oktave, schnell abklingend. */
  pluck(midi, t, vel) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.5);
    for (const [type, mul, amt] of [['triangle', 1, 1], ['sine', 2, 0.35]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = midiHz(midi) * mul;
      const a = ctx.createGain(); a.gain.value = amt;
      o.connect(a).connect(f); o.start(t); o.stop(t + 1);
    }
    f.connect(g);
    g.connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 0.35;
    g.connect(send).connect(this.reverb);
    g.connect(this.delay);
  }

  leadNote(midi, t, dur, wave = 'sawtooth') {
    if (wave === 'accordion' || wave === 'fiddle' || wave === 'brass') { this.leadVoice(midi, t, dur, wave); return; }
    const ctx = this.ctx;
    const g = ctx.createGain();
    env(g.gain, t, 0.04, dur, wave === 'triangle' ? 0.08 : 0.05, 0.4);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600; f.Q.value = 1;
    const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
    const vibAmt = ctx.createGain(); vibAmt.gain.setValueAtTime(0, t); vibAmt.gain.linearRampToValueAtTime(12, t + 0.4);
    vib.connect(vibAmt);
    for (const det of [-6, 6]) {
      const o = ctx.createOscillator(); o.type = wave; o.frequency.value = midiHz(midi); o.detune.value = det;
      vibAmt.connect(o.detune);
      o.connect(f); o.start(t); o.stop(t + dur + 0.5);
    }
    vib.start(t); vib.stop(t + dur + 0.5);
    f.connect(g);
    g.connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 0.5;
    g.connect(send).connect(this.reverb);
    g.connect(this.delay);
  }

  /**
   * Besondere Lead-Stimmen:
   * accordion – drei Rechteck-Zungen, leicht gegeneinander verstimmt (die Musette-Schwebung)
   * fiddle    – Säge mit kräftigem, verzögertem Vibrato und Resonanz um 2 kHz (Geige)
   * brass     – Säge mit kurzem Filter-Anstieg (Italo-Bläser)
   */
  leadVoice(midi, t, dur, wave) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const out = ctx.createGain();
    const cfg = {
      accordion: { osc: 'square', det: [-14, 0, 14], peak: 0.03, attack: 0.03, release: 0.15, vib: 0, cut: 2300 },
      fiddle:    { osc: 'sawtooth', det: [-4, 4], peak: 0.05, attack: 0.07, release: 0.25, vib: 22, cut: 3800 },
      brass:     { osc: 'sawtooth', det: [-7, 7], peak: 0.05, attack: 0.02, release: 0.2, vib: 6, cut: 2600 },
    }[wave];
    env(g.gain, t, cfg.attack, dur, cfg.peak, cfg.release);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1.5;
    if (wave === 'brass') {
      f.frequency.setValueAtTime(700, t);
      f.frequency.exponentialRampToValueAtTime(cfg.cut * 1.4, t + 0.07);
      f.frequency.exponentialRampToValueAtTime(cfg.cut, t + 0.3);
    } else {
      f.frequency.value = cfg.cut;
    }
    let shape = f;
    if (wave === 'fiddle') {
      const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 2100; body.Q.value = 1.2; body.gain.value = 6;
      f.connect(body); shape = body;
    }
    const vibAmt = ctx.createGain(); vibAmt.gain.setValueAtTime(0, t); vibAmt.gain.linearRampToValueAtTime(cfg.vib, t + 0.35);
    const vib = ctx.createOscillator(); vib.frequency.value = wave === 'fiddle' ? 6.2 : 5.2;
    vib.connect(vibAmt);
    for (const det of cfg.det) {
      const o = ctx.createOscillator(); o.type = cfg.osc; o.frequency.value = midiHz(midi); o.detune.value = det;
      vibAmt.connect(o.detune);
      o.connect(f); o.start(t); o.stop(t + dur + cfg.release + 0.1);
    }
    vib.start(t); vib.stop(t + dur + cfg.release + 0.1);
    if (wave === 'accordion') {
      // Balg-Tremolo: leichtes Pulsieren der Lautstärke
      const trem = ctx.createOscillator(); trem.frequency.value = 5.5;
      const tremAmt = ctx.createGain(); tremAmt.gain.value = 0.18;
      out.gain.value = 0.82;
      trem.connect(tremAmt).connect(out.gain);
      trem.start(t); trem.stop(t + dur + cfg.release + 0.1);
    }
    shape.connect(g).connect(out);
    out.connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 0.45;
    out.connect(send).connect(this.reverb);
    if (wave !== 'accordion') out.connect(this.delay);
  }

  /** Klatschen (Italo Disco): drei kurze Rauschstöße kurz hintereinander. */
  clap(t) {
    const ctx = this.ctx;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.1;
    const g = ctx.createGain(); g.gain.value = 1;
    f.connect(g).connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 0.5;
    g.connect(send).connect(this.reverb);
    [0, 0.011, 0.023].forEach((dt, i) => {
      const n = ctx.createBufferSource(); n.buffer = this.noise;
      const e = ctx.createGain();
      const len = i === 2 ? 0.14 : 0.02;
      e.gain.setValueAtTime(0.0001, t + dt);
      e.gain.exponentialRampToValueAtTime(0.16, t + dt + 0.002);
      e.gain.exponentialRampToValueAtTime(0.0001, t + dt + len);
      n.connect(e).connect(f);
      n.start(t + dt, Math.random() * 0.5, len + 0.02);
    });
  }

  kick(t, vel) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g).connect(this.dry);
    o.start(t); o.stop(t + 0.4);
  }

  snare(t, vel = 1) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * vel, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    n.connect(f).connect(g);
    g.connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 0.9; // großer 80er-Hall
    g.connect(send).connect(this.reverb);
    const body = ctx.createOscillator(); body.type = 'triangle';
    body.frequency.setValueAtTime(220, t); body.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t); bg.gain.exponentialRampToValueAtTime(0.12 * vel, t + 0.003); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    body.connect(bg).connect(this.dry);
    n.start(t, Math.random() * 0.5, 0.3); body.start(t); body.stop(t + 0.15);
  }

  crash(t) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    n.connect(f).connect(g);
    g.connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 0.4;
    g.connect(send).connect(this.reverb);
    n.loop = true; // Rauschpuffer ist 1 s lang, der Crash klingt länger
    n.start(t, Math.random() * 0.5); n.stop(t + 1.7);
  }

  hat(t, vel, open) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
    const g = ctx.createGain();
    const len = open ? 0.25 : 0.045;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045 * vel, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.connect(f).connect(g).connect(this.dry);
    n.start(t, Math.random() * 0.5, len + 0.02);
  }

  /** Rendert ein Stück (oder einen Ausschnitt) offline – für Tests und Vorschau. Gibt einen AudioBuffer zurück. */
  static async renderOffline({ song = 0, bars = null, startBar = 0, intensity = 5, sampleRate = 22050, volume = 1 } = {}) {
    const def = SONGS[song];
    const n = bars ?? def.bars;
    const seconds = n * def.spb * def.step + 2;
    const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
    const sw = new Synthwave({ volume, intensity });
    sw.songIdx = song;
    sw.build(ctx, ctx.destination);
    sw.master.gain.value = sw.targetGain();
    const first = startBar * def.spb;
    for (let i = 0; i < n * def.spb; i++) sw.playStep(def, (first + i) % def.steps, 0.05 + i * def.step);
    return ctx.startRendering();
  }
}

export const MUSIC = {
  STEPS_PER_BAR, BARS_PER_SECTION,
  SONGS: SONGS.map((s) => ({ title: s.title, bpm: s.bpm, bars: s.bars, seconds: s.seconds, order: s.order, step: s.step, spb: s.spb, from: s.from, country: s.country || null })),
  SECONDS: SONGS.reduce((a, s) => a + s.seconds, 0),
};

function env(param, t, attack, hold, peak, release) {
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + attack);
  param.setValueAtTime(peak, t + Math.max(attack, hold - release));
  param.linearRampToValueAtTime(0, t + hold + release);
}

function noiseBuffer(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Kleiner, deterministischer Zufallsgenerator (für die Melodien). */
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(x) { return Math.min(1, Math.max(0, Number(x) || 0)); }
function clampInt(x, lo, hi) { return Math.min(hi, Math.max(lo, Math.round(Number(x) || lo))); }
