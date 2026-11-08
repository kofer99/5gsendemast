"""Erzeugt assets/js/data/map-eu.js und map-world.js aus Natural-Earth-Daten (gemeinfrei).

Aufruf:
    python tools/build_world.py <ne_50m_admin_0_countries.geojson>

Quelle: https://github.com/nvkelso/natural-earth-vector (geojson/ne_50m_admin_0_countries.geojson)
Einwohner: Feld POP_EST (Stand 2019) – vor dem Release ggf. aktualisieren.
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DE_POP = 84.6e6  # Summe der Bundesländer in states.js – damit Phase 1 und 2 zusammenpassen

# Kleine Gebiete, die in ein größeres Land einfließen (Karte + Einwohner)
MERGE = {"ALD": "FIN", "FRO": "DNK", "JEY": "GBR", "GGY": "GBR", "IMN": "GBR"}

SUBREGIONS = {
    "Northern America": ("NAM", "Nordamerika"),
    "Central America": ("MAM", "Mittelamerika"),
    "Caribbean": ("KAR", "Karibik"),
    "South America": ("SAM", "Südamerika"),
    "Northern Africa": ("NAF", "Nordafrika"),
    "Western Africa": ("WAF", "Westafrika"),
    "Middle Africa": ("ZAF", "Zentralafrika"),
    "Eastern Africa": ("OAF", "Ostafrika"),
    "Southern Africa": ("SAF", "Südliches Afrika"),
    "Western Asia": ("WAS", "Westasien"),
    "Central Asia": ("ZAS", "Zentralasien"),
    "Southern Asia": ("SAS", "Südasien"),
    "Eastern Asia": ("OAS", "Ostasien"),
    "South-Eastern Asia": ("SOA", "Südostasien"),
    "Australia and New Zealand": ("AUS", "Australien & Neuseeland"),
    "Melanesia": ("PAZ", "Pazifikinseln"),
    "Micronesia": ("PAZ", "Pazifikinseln"),
    "Polynesia": ("PAZ", "Pazifikinseln"),
}


# ---------- Geometrie ----------

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


def clip(pts, x0, y0, x1, y1):
    """Sutherland-Hodgman gegen ein Rechteck."""
    def edge(pts, inside, inter):
        out = []
        for i, p in enumerate(pts):
            q = pts[i - 1]
            if inside(p):
                if not inside(q):
                    out.append(inter(q, p))
                out.append(p)
            elif inside(q):
                out.append(inter(q, p))
        return out

    def ix(xc):
        return lambda a, b: (xc, a[1] + (b[1] - a[1]) * (xc - a[0]) / (b[0] - a[0]))

    def iy(yc):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (yc - a[1]) / (b[1] - a[1]), yc)

    for inside, inter in (
        (lambda p: p[0] >= x0, ix(x0)), (lambda p: p[0] <= x1, ix(x1)),
        (lambda p: p[1] >= y0, iy(y0)), (lambda p: p[1] <= y1, iy(y1)),
    ):
        if not pts:
            break
        pts = edge(pts, inside, inter)
    return pts


def rings(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    return [poly[0] for poly in polys]  # nur Außenringe


def build(features, key_of, proj, box, tol, min_area, tiny_r=None):
    """features → {code: {d, cx, cy, area}}; key_of(props) → code oder None."""
    x0, y0, x1, y1 = box
    out = {}
    for f in features:
        code = key_of(f["properties"])
        if not code:
            continue
        reg = out.setdefault(code, {"parts": [], "best": (0.0, None), "area": 0.0})
        for ring in rings(f["geometry"]):
            pts = [proj(lon, lat) for lon, lat in ring]
            if pts[0] == pts[-1]:
                pts = pts[:-1]
            pts = clip(pts, x0, y0, x1, y1)
            if len(pts) < 3:
                continue
            ar, cen = area_centroid(pts)
            reg["area"] += ar
            if ar > reg["best"][0]:
                reg["best"] = (ar, cen)
            pts = simplify(pts + [pts[0]], tol)[:-1]
            if ar < min_area or len(pts) < 3:
                continue
            reg["parts"].append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
    res = {}
    for code, reg in out.items():
        cen = reg["best"][1]
        if cen is None:
            continue
        cx, cy = round(cen[0], 1), round(cen[1], 1)
        d = "".join(reg["parts"])
        tiny = False
        if (not d or reg["area"] < (tiny_r or 0) ** 2 * 3) and tiny_r:
            # Zwergstaat: als anklickbarer Kreis darstellen
            r = tiny_r
            d = f"M{cx - r:.1f} {cy:.1f}a{r} {r} 0 1 0 {2 * r} 0a{r} {r} 0 1 0 {-2 * r} 0Z"
            tiny = True
        if not d:
            continue
        res[code] = {"d": d, "cx": cx, "cy": cy}
        if tiny:
            res[code]["tiny"] = 1
    return res


# ---------- Projektionen ----------

def eu_proj(lon, lat):
    k = 22.0
    return ((lon + 25.0) * k * math.cos(math.radians(52)), (72.0 - lat) * k)


def ne1(lon, lat):
    """Natural-Earth-I-Projektion (Šavrič et al.)."""
    l, p = math.radians(lon), math.radians(lat)
    p2 = p * p
    p4 = p2 * p2
    x = l * (0.870700 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)))
    y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
    return x, y


def world_proj(lon, lat):
    x, y = ne1(lon, lat)
    k = 150.0
    return ((x + XMAX) * k, (1.42 - y) * k)


XMAX = ne1(180, 0)[0]


def write(name, var, obj):
    target = ROOT / "assets/js/data" / name
    target.write_text(
        "// Automatisch erzeugt von tools/build_world.py – nicht von Hand bearbeiten.\n"
        "// Kartendaten und Einwohner (POP_EST 2019): Natural Earth (gemeinfrei), vereinfacht.\n"
        f"export const {var} = " + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"{target}: {target.stat().st_size} Bytes, {len(obj['regions'])} Regionen")


def main(src):
    data = json.loads(Path(src).read_text(encoding="utf-8"))
    feats = data["features"]

    # ---------- Europa ----------
    eu_feats = [f for f in feats if f["properties"]["CONTINENT"] == "Europe"]
    key_eu = lambda p: MERGE.get(p["ADM0_A3"], p["ADM0_A3"])
    w = round(70 * 22 * math.cos(math.radians(52)))
    h = round((72 - 34) * 22)
    regions = build(eu_feats, key_eu, eu_proj, (-2, -2, w + 2, h + 2), 0.6, 6.0, tiny_r=4)
    meta = {}
    for f in eu_feats:
        p = f["properties"]
        code = key_eu(p)
        m = meta.setdefault(code, {"name": None, "pop": 0})
        m["pop"] += p["POP_EST"]
        if code == p["ADM0_A3"]:
            m["name"] = p["NAME_DE"]
    meta["DEU"]["pop"] = DE_POP
    for code, m in meta.items():
        if code in regions:
            regions[code]["name"] = m["name"]
            regions[code]["pop"] = m["pop"]
    write("map-eu.js", "MAP_EU", {"viewBox": [0, 0, w, h], "regions": regions})

    # ---------- Welt ----------
    def key_world(p):
        if p["CONTINENT"] == "Europe":
            return "EUR"
        sub = SUBREGIONS.get(p["SUBREGION"])
        return sub[0] if sub else None

    wx1, wy0 = world_proj(180, 0)[0], world_proj(0, 84)[1]
    wy1 = world_proj(0, -57)[1]
    regions = build(feats, key_world, world_proj, (0, wy0, wx1, wy1), 0.5, 4.0)
    pops, names = {}, {"EUR": "Europa"}
    for f in feats:
        p = f["properties"]
        code = key_world(p)
        if code:
            pops[code] = pops.get(code, 0) + p["POP_EST"]
    for sub, (code, name) in SUBREGIONS.items():
        names[code] = name
    eur = sum(r["pop"] for r in json.loads((ROOT / "assets/js/data/map-eu.js").read_text(encoding="utf-8").split("= ", 1)[1].rstrip(";\n"))["regions"].values())
    pops["EUR"] = eur
    for code, r in regions.items():
        r["name"] = names[code]
        r["pop"] = pops[code]
    out = {"viewBox": [0, round(wy0, 1), round(wx1), round(wy1 - wy0)], "regions": regions}
    write("map-world.js", "MAP_WORLD", out)


if __name__ == "__main__":
    main(sys.argv[1])
