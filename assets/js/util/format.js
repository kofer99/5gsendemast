// Deutsches Zahlenformat für sehr große Zahlen.
const SUFFIXES = [
  'Mio.', 'Mrd.', 'Bio.', 'Brd.', 'Trio.', 'Trd.', 'Quadr.', 'Quadrd.',
  'Quint.', 'Quintd.', 'Sext.', 'Sextd.', 'Sept.', 'Septd.', 'Okt.', 'Oktd.',
  'Non.', 'Nond.', 'Dez.', 'Dezd.',
];

const nf = (digits) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const NF = [nf(0), nf(1), nf(2)];
const NF_INT = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

const floorTo = (v, digits) => Math.floor(v * 10 ** digits + 1e-9) / 10 ** digits;

/** Kurzformat: 999.999 → "999.999", 12.345.678 → "12,3 Mio." */
export function fmt(n, { decimals = false } = {}) {
  if (Number.isNaN(n)) return '0';
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return '−' + fmt(-n, { decimals });
  if (n < 1e6) {
    if (decimals && n < 100 && n % 1 !== 0) return NF[1].format(floorTo(n, 1));
    return NF_INT.format(Math.floor(n));
  }
  const exp = Math.floor(Math.log10(n) + 1e-12);
  const group = Math.floor((exp - 6) / 3);
  if (group >= SUFFIXES.length) {
    return n.toExponential(2).replace('.', ',').replace('e+', 'e');
  }
  const v = n / 10 ** (6 + group * 3);
  const digits = v < 10 ? 2 : v < 100 ? 1 : 0;
  return NF[digits].format(floorTo(v, digits)) + ' ' + SUFFIXES[group];
}

/** Ganze Zahl mit Tausenderpunkten (für die große Bürger-Anzeige). */
export function fmtInt(n) {
  if (!Number.isFinite(n)) return '∞';
  if (n >= 1e15) return fmt(n);
  return NF_INT.format(Math.floor(n));
}

export function fmtPct(ratio, digits = 1) {
  const v = floorTo(ratio * 100, digits);
  return nf(digits).format(v) + ' %';
}

export function fmtDuration(sec) {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d) return `${d} T. ${h} Std.`;
  if (h) return `${h} Std. ${m} Min.`;
  if (m) return `${m} Min. ${s} Sek.`;
  return `${s} Sek.`;
}
