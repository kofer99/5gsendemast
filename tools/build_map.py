"""Erzeugt assets/js/data/map-de.js aus Natural-Earth-Daten (gemeinfrei).

Aufruf:
    python tools/build_map.py <ne_10m_admin_1_states_provinces.geojson>

Quelle: https://github.com/nvkelso/natural-earth-vector (geojson/ne_10m_admin_1_states_provinces.geojson)
"""
import json
import math
import sys
from pathlib import Path

LON0, LAT0 = 5.8, 55.1          # linke obere Ecke
SCALE = 100.0                    # px pro Breitengrad
KX = SCALE * math.cos(math.radians(51.2))
TOLERANCE = 0.55                 # Douglas-Peucker-Toleranz in px
MIN_AREA = 12.0                  # kleinere Inseln (px²) werden verworfen

CITIES = [
    ("Berlin", 13.40, 52.52), ("Hamburg", 10.00, 53.55), ("München", 11.58, 48.14),
    ("Köln", 6.96, 50.94), ("Frankfurt", 8.68, 50.11), ("Stuttgart", 9.18, 48.78),
    ("Düsseldorf", 6.77, 51.23), ("Leipzig", 12.37, 51.34), ("Dresden", 13.74, 51.05),
    ("Hannover", 9.73, 52.37), ("Nürnberg", 11.08, 49.45), ("Bremen", 8.80, 53.08),
    ("Kiel", 10.13, 54.32), ("Rostock", 12.10, 54.09), ("Erfurt", 11.03, 50.98),
    ("Magdeburg", 11.63, 52.13), ("Saarbrücken", 7.00, 49.23), ("Mainz", 8.27, 50.00),
    ("Potsdam", 13.06, 52.39), ("Schwerin", 11.41, 53.63), ("Wiesbaden", 8.24, 50.08),
    ("Wanne-Eickel", 7.17, 51.53),
]
BIELEFELD = (8.53, 52.02)


def proj(lon, lat):
    return ((lon - LON0) * KX, (LAT0 - lat) * SCALE)


def perp_dist(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        s, e = stack.pop()
        dmax, idx = 0.0, -1
        for i in range(s + 1, e):
            d = perp_dist(pts[i], pts[s], pts[e])
            if d > dmax:
                dmax, idx = d, i
        if dmax > tol and idx > 0:
            keep[idx] = True
            stack += [(s, idx), (idx, e)]
    return [p for p, k in zip(pts, keep) if k]


def area_centroid(pts):
    a = cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        c = x1 * y2 - x2 * y1
        a += c
        cx += (x1 + x2) * c
        cy += (y1 + y2) * c
    a *= 0.5
    if a == 0:
        return 0.0, pts[0]
    return abs(a), (cx / (6 * a), cy / (6 * a))


def main(src):
    data = json.loads(Path(src).read_text(encoding="utf-8"))
    states = {}
    for f in data["features"]:
        p = f["properties"]
        if p.get("adm0_a3") != "DEU":
            continue
        code = p["iso_3166_2"].split("-")[1]
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        parts, best = [], (0.0, (0, 0))
        for poly in polys:
            ring = [proj(lon, lat) for lon, lat in poly[0]]  # nur Außenring
            ring = simplify(ring, TOLERANCE)
            ar, cen = area_centroid(ring[:-1] if ring[0] == ring[-1] else ring)
            if ar < MIN_AREA or len(ring) < 4:
                continue
            if ar > best[0]:
                best = (ar, cen)
            parts.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in ring[:-1]) + "Z")
        states[code] = {"d": "".join(parts), "cx": round(best[1][0], 1), "cy": round(best[1][1], 1)}

    w = round((15.1 - LON0) * KX)
    h = round((LAT0 - 47.2) * SCALE)
    out = {
        "viewBox": [0, 0, w, h],
        "states": states,
        "cities": [{"name": n, "x": round(proj(lo, la)[0], 1), "y": round(proj(lo, la)[1], 1)} for n, lo, la in CITIES],
        "bielefeld": {"x": round(proj(*BIELEFELD)[0], 1), "y": round(proj(*BIELEFELD)[1], 1)},
    }
    target = Path(__file__).resolve().parent.parent / "assets/js/data/map-de.js"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        "// Automatisch erzeugt von tools/build_map.py – nicht von Hand bearbeiten.\n"
        "// Kartendaten: Natural Earth (gemeinfrei), vereinfacht.\n"
        "export const MAP_DE = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"{target}: {target.stat().st_size} Bytes, {len(states)} Bundesländer")


if __name__ == "__main__":
    main(sys.argv[1])
