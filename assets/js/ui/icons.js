// Strich-Icons (24×24). Farbe über currentColor.
const P = {
  mast: '<path d="M12 6 L7 22 M12 6 L17 22 M9 16 H15"/><path d="M8 4 a5 5 0 0 0 0 5 M16 4 a5 5 0 0 1 0 5"/>',
  tanne: '<path d="M12 2 L6 10 H9 L5 16 H9 L4 21 H20 L15 16 H19 L15 10 H18 Z"/>',
  kirche: '<path d="M12 2 V5 M10.5 3.5 H13.5 M8 10 L12 5 L16 10 V22 H8 Z M11 22 V18 H13 V22"/>',
  windrad: '<path d="M12 10 V22 M12 10 L12 2 M12 10 L19 14 M12 10 L5 14"/><circle cx="12" cy="10" r="1.4"/>',
  toaster: '<rect x="3" y="9" width="18" height="11" rx="3"/><path d="M8 9 V6 M16 9 V6 M7 14 H11 M19 12 V16"/><path d="M6 4 a3 3 0 0 1 4 0 M14 4 a3 3 0 0 1 4 0"/>',
  jet: '<path d="M2 13 L10 12 L14 6 H16 L14 12 L21 11 L22 13 L14 14 L16 20 H14 L10 14 L2 13 Z"/><path d="M3 17 h3 M8 18 h3 M4 20 h4"/>',
  reptil: '<ellipse cx="12" cy="12" rx="9" ry="6"/><path d="M12 7 C10.5 10 10.5 14 12 17 C13.5 14 13.5 10 12 7 Z"/>',
  haarp: '<path d="M4 14 a8 8 0 0 0 16 0 Z M12 14 L16 6 M6 22 H18 M12 18 V22"/><circle cx="16.5" cy="5" r="1.4"/>',
  euro: '<path d="M12 7 L8 22 M12 7 L16 22 M9.5 16 H14.5"/><circle cx="12" cy="5" r="1.4"/><path d="M4 4 l.6 1.2 1.3.2-1 .9.3 1.3-1.2-.7-1.2.7.3-1.3-1-.9 1.3-.2Z M20 4 l.6 1.2 1.3.2-1 .9.3 1.3-1.2-.7-1.2.7.3-1.3-1-.9 1.3-.2Z M20 13 l.6 1.2 1.3.2-1 .9.3 1.3-1.2-.7-1.2.7.3-1.3-1-.9 1.3-.2Z M4 13 l.6 1.2 1.3.2-1 .9.3 1.3-1.2-.7-1.2.7.3-1.3-1-.9 1.3-.2Z"/>',
  norm: '<path d="M12 9 V22 M8 22 H16 M9.5 16 H14.5"/><path d="M6 9 Q12 3 18 9"/><path d="M5 12 h2 M5 15 h1.5 M5 18 h2 M17 12 h2 M17.5 15 h1.5 M17 18 h2"/>',
  eurovision: '<path d="M12 3 a3 3 0 0 1 3 3 v5 a3 3 0 0 1 -6 0 v-5 a3 3 0 0 1 3 -3 Z"/><path d="M6 11 a6 6 0 0 0 12 0 M12 17 V21 M8 21 H16"/><path d="M2 5 l1 2 M22 5 l-1 2 M3 2 l1.5 1 M21 2 l-1.5 1"/>',
  krake: '<path d="M7 11 a5 5 0 0 1 10 0 v1 H7 Z"/><path d="M8 12 c-1 3 -3 4 -5 5 M10 12 c0 3 -1 5 -3 7 M14 12 c0 3 1 5 3 7 M16 12 c1 3 3 4 5 5"/><path d="M12 6 V2 M10 3 a3 3 0 0 1 4 0"/>',
  pyramide: '<path d="M2 21 L12 6 L22 21 Z M7 21 L12 13 L17 21"/><path d="M12 6 V2 M9 3.5 a4 4 0 0 1 6 0"/>',
  schrott: '<rect x="3" y="4" width="6" height="4" transform="rotate(-15 6 6)"/><path d="M15 3 l5 2 -2 4 -4 -2 Z"/><path d="M12 13 V21 M9 21 H15 M9 13 a3 3 0 0 1 6 0"/><path d="M3 17 l3 -1 M19 14 l2 3 M17 11 h2"/>',
  mars: '<path d="M3 13 H21 V17 H3 Z"/><circle cx="6" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="18" cy="19" r="1.6"/><path d="M15 13 V8 M15 8 L20 5 V11 Z"/><path d="M5 13 V10 H10 V13"/>',
  loch: '<circle cx="12" cy="12" r="3.5"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-20 12 12)"/><path d="M12 2 V5 M12 19 V22"/>',
  pulsar: '<circle cx="12" cy="12" r="2.5"/><path d="M12 2 V7 M12 17 V22 M4 4 L8 8 M16 16 L20 20 M2 12 H5 M19 12 H22 M20 4 L16 8 M8 16 L4 20"/>',
  sat: '<rect x="9.5" y="9.5" width="5" height="5" transform="rotate(45 12 12)"/><path d="M3 3 L8 8 M16 16 L21 21 M2 7 L7 2 M17 22 L22 17 M5 9 L9 5 M15 19 L19 15"/>',
  mond: '<path d="M15 3 a9 9 0 1 0 6 13 a7 7 0 0 1 -6 -13 Z"/><path d="M8 13 L6 21 M8 13 L10 21 M7 18 H9"/>',
  quant: '<path d="M12 2 V22 M8 22 H16"/><path d="M5 10 c2-4 5-4 7 0 s5 4 7 0 c-2 4-5 4-7 0 s-5-4-7 0 Z"/>',
  logo: '<path d="M12 10 L7 22 M12 10 L17 22 M8.5 18 H15.5 M9.7 15 H14.3"/><circle cx="12" cy="8" r="1.6"/><path d="M8.5 4.5 a5 5 0 0 0 0 7 M15.5 4.5 a5 5 0 0 1 0 7 M5.8 2 a8.5 8.5 0 0 0 0 12 M18.2 2 a8.5 8.5 0 0 1 0 12"/>',
  aluhut: '<path d="M5 16 L12 3 L19 16 Z"/><path d="M9 9 L11 11 M14 7 L13 10"/><circle cx="12" cy="19" r="3.2"/>',
  demo: '<path d="M7 15 L12 5 L17 15 Z"/><circle cx="12" cy="18.5" r="2.6"/><path d="M19 3 V13 M15.5 3 H22.5 V7.5 H15.5"/>',
  rute: '<path d="M12 21 V13 L5 3 M12 13 L19 3"/><path d="M3 7 a3 3 0 0 0 4 3 M21 7 a3 3 0 0 1 -4 3"/>',
  golden: '<path d="M12 6 L7 22 M12 6 L17 22 M9 16 H15"/><path d="M12 1 L13 4 L16 4 L13.5 5.8 L14.5 9 L12 7 L9.5 9 L10.5 5.8 L8 4 L11 4 Z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11 V7 a4 4 0 0 1 8 0 V11"/>',
  check: '<path d="M4 12 L10 18 L20 6"/>',
};

export function icon(name, size = 24, extra = '') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[name] || P.mast}</svg>`;
}

// Kleine Kartensymbole, zentriert auf (0,0), Einheiten der Karte.
export const GLYPH = {
  mast: 'M0 -7 L-4 6 M0 -7 L4 6 M-2.6 2 H2.6',
  tanne: 'M0 -8 L-5 0 H-2.5 L-6 6 H6 L2.5 0 H5 Z',
  kirche: 'M0 -9 V-6 M-3 0 L0 -5 L3 0 V7 H-3 Z',
  windrad: 'M0 -2 V8 M0 -2 L0 -9 M0 -2 L6 1.5 M0 -2 L-6 1.5',
  toaster: 'M-6 -3 H6 V6 H-6 Z M-3 -3 V-6 M3 -3 V-6',
  jet: 'M-8 1 L-2 0 L1 -5 H3 L1 0 L7 -1 L8 1 L1 2 L3 7 H1 L-2 2 Z',
  reptil: 'M-7 0 A7 4.5 0 1 0 7 0 A7 4.5 0 1 0 -7 0 M0 -4 C-1.2 -1.5 -1.2 1.5 0 4 C1.2 1.5 1.2 -1.5 0 -4',
  euro: 'M0 -6 L-4 7 M0 -6 L4 7 M-2.4 2.5 H2.4 M-7 -7 h2 M5 -7 h2 M-7 1 h2 M5 1 h2',
  norm: 'M0 -4 V8 M-4 8 H4 M-6 -4 Q0 -10 6 -4 M-2.5 3 H2.5',
  eurovision: 'M0 -8 A3 3 0 0 1 3 -5 V0 A3 3 0 0 1 -3 0 V-5 A3 3 0 0 1 0 -8 Z M-6 0 A6 6 0 0 0 6 0 M0 6 V9 M-3 9 H3',
  krake: 'M-5 0 A5 5 0 0 1 5 0 V1 H-5 Z M-4 1 C-5 4 -7 5 -8 6 M-1.5 1 C-1.5 4 -2.5 6 -3.5 8 M1.5 1 C1.5 4 2.5 6 3.5 8 M4 1 C5 4 7 5 8 6',
  pyramide: 'M-9 8 L0 -7 L9 8 Z M0 -7 V-10',
  schrott: 'M-8 -6 h5 v3 h-5 Z M3 -8 l4 2 -2 3 -3 -2 Z M0 1 V8 M-3 8 H3 M-3 1 A3 3 0 0 1 3 1',
  mars: 'M-8 0 H8 V4 H-8 Z M-5 7 A1.5 1.5 0 1 0 -5 6.9 M0 7 A1.5 1.5 0 1 0 0 6.9 M5 7 A1.5 1.5 0 1 0 5 6.9 M3 0 V-5 L8 -8 V-2 Z',
  loch: 'M-3 0 A3 3 0 1 0 3 0 A3 3 0 1 0 -3 0 M-9 2 C-4 -4 4 -4 9 -2 C4 4 -4 4 -9 2 Z',
  pulsar: 'M-2 0 A2 2 0 1 0 2 0 A2 2 0 1 0 -2 0 M0 -9 V-4 M0 4 V9 M-6 -6 L-3 -3 M3 3 L6 6 M-9 0 H-5 M5 0 H9 M6 -6 L3 -3 M-3 3 L-6 6',
  sat: 'M0 -3 L3 0 L0 3 L-3 0 Z M-3 -3 L-8 -8 M3 3 L8 8 M-8 -4 L-4 -8 M4 8 L8 4',
  mond: 'M3 -8 A8 8 0 1 0 8 4 A6 6 0 0 1 3 -8 Z',
  quant: 'M0 -9 V8 M-4 8 H4 M-7 -1 C-4 -6 -1 -6 0 -1 S4 4 7 -1 C4 4 1 4 0 -1 S-4 -6 -7 -1 Z',
  haarp: 'M-7 1 A7 7 0 0 0 7 1 Z M0 1 L4 -6 M-5 8 H5 M0 5 V8',
};
