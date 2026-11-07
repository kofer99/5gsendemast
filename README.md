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
| http://localhost:8765/tests/seed.html?level=1\|2\|3 | Test-Spielstand mit Fortschritt erzeugen |
| http://localhost:8765/tests/mobile.html | Handy-Vorschau (390 px / 360 px) |

## Struktur

```
assets/js/core/   Spiellogik (state, economy, game) – ohne DOM, testbar
assets/js/data/   Anlagen, Upgrades, Erfolge, News, Bundesländer, Kartendaten
assets/js/ui/     Karte, Shop, HUD
tools/            build_map.py – erzeugt map-de.js aus Natural-Earth-Daten
```

## Lizenzen

- Kartendaten: [Natural Earth](https://www.naturalearthdata.com/) (gemeinfrei)
- Schriften: VT323 und IBM Plex Mono, SIL Open Font License 1.1 (siehe `assets/fonts/`)

*Satire. Die Bundesanstalt für Gedankenfunk existiert nicht. 5G ist nach aktuellem Stand der Wissenschaft unbedenklich.*
