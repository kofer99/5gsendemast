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
  logo: '<path d="M12 10 L7 22 M12 10 L17 22 M8.5 18 H15.5 M9.7 15 H14.3"/><circle cx="12" cy="8" r="1.6"/><path d="M8.5 4.5 a5 5 0 0 0 0 7 M15.5 4.5 a5 5 0 0 1 0 7 M5.8 2 a8.5 8.5 0 0 0 0 12 M18.2 2 a8.5 8.5 0 0 1 0 12"/>',
  aluhut: '<path d="M5 16 L12 3 L19 16 Z"/><path d="M9 9 L11 11 M14 7 L13 10"/><circle cx="12" cy="19" r="3.2"/>',
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
  haarp: 'M-7 1 A7 7 0 0 0 7 1 Z M0 1 L4 -6 M-5 8 H5 M0 5 V8',
};
