# 5gsendemast.de

Satire-Website mit einem eskalierenden Idle-Game: Platziere 5G-Sendemasten auf einer Deutschlandkarte und „kontrolliere“ die Bevölkerung.

- Konzept und Spezifikation: [DESIGN.md](DESIGN.md)
- Hosting: Cloudflare Pages (+ Pages Functions und D1 für die Bestenliste)

## Lokal starten

Kein Build-Schritt nötig. Wegen der ES-Module muss die Seite über einen Webserver laufen (nicht per `file://`):

```bash
python -m http.server 8765
```

| URL | Zweck |
|---|---|
| http://localhost:8765/ | Spiel |
| http://localhost:8765/tests/ | Unit-Tests |
| http://localhost:8765/tests/e2e.html | End-to-End-Test (löscht den lokalen Spielstand!) |
| http://localhost:8765/tests/sim.html?cps=3&h=4 | Balancing-Simulation |
| http://localhost:8765/tests/seed.html?level=1\|2\|3 | Test-Spielstand mit Fortschritt erzeugen (überschreibt den eigenen!) |
| http://localhost:8765/tests/seed.html?phase=2\|3\|4\|5 | Test-Spielstand mitten in Phase 2–5 (optional `&tears=40`) |
| http://localhost:8765/tests/shot.html?phase=3&tab=prestige | Seed laden und Spiel in 1400 px zeigen (für Screenshots) |
| http://localhost:8765/tests/shot-mobile.html?phase=3 | dasselbe in Handy-Breite |
| http://localhost:8765/tests/maps.html | Vorschau der Europa- und Weltkarte |
| http://localhost:8765/tests/mobile.html | Handy-Vorschau (390 px / 360 px) |

## Struktur

```
assets/js/core/   Spiellogik (state, economy, game) – ohne DOM, testbar
assets/js/data/   Anlagen, Upgrades, Erfolge, News, Bundesländer, Kartendaten
assets/js/ui/     Karte, Shop, HUD
tools/            build_map.py – erzeugt map-de.js aus Natural-Earth-Daten (Bundesländer)
                  build_world.py – erzeugt map-eu.js und map-world.js (Länder, ne_50m_admin_0_countries)
```

## Lizenzen

- Kartendaten und Einwohner Europa/Welt: [Natural Earth](https://www.naturalearthdata.com/) (gemeinfrei)
- Schriften: VT323 und IBM Plex Mono, SIL Open Font License 1.1 (siehe `assets/fonts/`)

*Satire. Die Bundesanstalt für Gedankenfunk existiert nicht. 5G ist nach aktuellem Stand der Wissenschaft unbedenklich.*
