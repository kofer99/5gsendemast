// Karten für Phase 4 (Orbit & Mond) und Phase 5 (Universum) – von Hand gezeichnet, keine Geodaten.
const r1 = (n) => Math.round(n * 10) / 10;

function circle(cx, cy, r) {
  return `M${r1(cx - r)} ${r1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}
/** Kreisring (mit fill-rule: evenodd zeichnen). */
function ring(cx, cy, rOuter, rInner) {
  return circle(cx, cy, rOuter) + circle(cx, cy, rInner);
}
/** Halbe Scheibe: side = -1 links, +1 rechts. */
function half(cx, cy, r, side) {
  return `M${cx} ${cy - r}A${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${cx} ${cy + r}Z`;
}
/** Gedrehte Ellipse als Pfad. */
function ellipse(cx, cy, rx, ry, deg) {
  const a = (deg * Math.PI) / 180;
  const p = (t) => [r1(cx + rx * Math.cos(t) * Math.cos(a) - ry * Math.sin(t) * Math.sin(a)), r1(cy + rx * Math.cos(t) * Math.sin(a) + ry * Math.sin(t) * Math.cos(a))];
  const [x0, y0] = p(0);
  const [x1, y1] = p(Math.PI);
  return `M${x0} ${y0}A${rx} ${ry} ${deg} 0 1 ${x1} ${y1}A${rx} ${ry} ${deg} 0 1 ${x0} ${y0}Z`;
}
/** Spiralarme als Deko (nicht anklickbar). */
function spiral(cx, cy, rx, ry, deg, turns = 1.4) {
  const a = (deg * Math.PI) / 180;
  let d = '';
  for (const off of [0, Math.PI]) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * turns * Math.PI * 2;
      const k = 0.12 + 0.88 * (i / 40);
      const x = rx * k * Math.cos(t + off);
      const y = ry * k * Math.sin(t + off);
      pts.push(`${r1(cx + x * Math.cos(a) - y * Math.sin(a))} ${r1(cy + x * Math.sin(a) + y * Math.cos(a))}`);
    }
    d += 'M' + pts.join('L');
  }
  return d;
}

const EARTH = { x: 260, y: 300, r: 105 };
const MOON = { x: 650, y: 210, r: 80 };
const MARS = { x: 820, y: 470, r: 38 };
const issAngle = (-35 * Math.PI) / 180;
const ISS = { x: r1(EARTH.x + 137 * Math.cos(issAngle)), y: r1(EARTH.y + 137 * Math.sin(issAngle)) };

export const MAP_ORBIT = {
  viewBox: [0, 0, 900, 560],
  regions: {
    ERD: { d: circle(EARTH.x, EARTH.y, EARTH.r), cx: EARTH.x, cy: EARTH.y },
    LEO: { d: ring(EARTH.x, EARTH.y, 150, 122), cx: EARTH.x - 136, cy: EARTH.y, evenodd: 1, ring: [EARTH.x, EARTH.y, 122, 150] },
    GEO: { d: ring(EARTH.x, EARTH.y, 215, 188), cx: EARTH.x + 40, cy: EARTH.y + 198, evenodd: 1, ring: [EARTH.x, EARTH.y, 188, 215] },
    ISS: { d: circle(ISS.x, ISS.y, 7), cx: ISS.x, cy: ISS.y, tiny: 1 },
    MOV: { d: half(MOON.x, MOON.y, MOON.r, -1), cx: MOON.x - 38, cy: MOON.y },
    MOR: { d: half(MOON.x, MOON.y, MOON.r, 1), cx: MOON.x + 38, cy: MOON.y },
    MAR: { d: circle(MARS.x, MARS.y, MARS.r), cx: MARS.x, cy: MARS.y },
  },
  labels: [
    { x: EARTH.x - 30, y: EARTH.y + 4, text: 'ERDE // ERLEDIGT' },
    { x: ISS.x + 10, y: ISS.y - 8, text: 'ISS' },
    { x: MOON.x - 30, y: MOON.y + MOON.r + 18, text: 'MOND' },
    { x: MARS.x - 22, y: MARS.y + MARS.r + 18, text: 'MARS' },
  ],
  deco: [
    // Flugbahn Erde → Mond → Mars
    `M${EARTH.x + 150} ${EARTH.y - 40}Q${MOON.x - 160} ${MOON.y - 40} ${MOON.x - MOON.r - 6} ${MOON.y}`,
    `M${MOON.x + 20} ${MOON.y + MOON.r + 4}Q${MARS.x - 60} ${MARS.y - 160} ${MARS.x - 10} ${MARS.y - MARS.r - 6}`,
  ],
};

const GAL = [
  // code, cx, cy, rx, ry, Drehung
  ['MLS', 300, 300, 150, 52, -18],
  ['ANM', 640, 150, 110, 40, 28],
  ['TRI', 560, 330, 62, 30, -40],
  ['LMC', 150, 120, 52, 30, 12],
  ['SMB', 800, 330, 72, 22, -8],
  ['M51', 760, 480, 56, 46, 0],
  ['CAR', 470, 470, 58, 38, 20],
  ['BIE', 110, 470, 40, 26, -25],
];

export const MAP_UNIVERSE = {
  viewBox: [0, 0, 900, 560],
  regions: {
    ...Object.fromEntries(GAL.map(([c, x, y, rx, ry, deg]) => [c, { d: ellipse(x, y, rx, ry, deg), cx: x, cy: y }])),
    SOL: { d: circle(372, 286, 9), cx: 372, cy: 286, tiny: 1 },
    RAN: { d: 'M0 0H900V560H0Z' + 'M14 14V546H886V14Z', cx: 450, cy: 7, evenodd: 1, frame: 1 },
  },
  labels: [
    { x: 384, y: 282, text: 'SIE SIND HIER' },
    { x: 34, y: 34, text: 'RAND DES UNIVERSUMS' },
  ],
  deco: GAL.map(([, x, y, rx, ry, deg]) => spiral(x, y, rx * 0.92, ry * 0.92, deg)),
};
