# 5gsendemast.de

Satire-Website mit einem eskalierenden Idle-Game: Platziere 5G-Sendemasten auf einer Deutschlandkarte und „kontrolliere“ die Bevölkerung.

- Konzept und Spezifikation: [DESIGN.md](DESIGN.md)
- Hosting: Cloudflare Pages (+ Pages Functions und D1 für die Bestenliste)

## Lokal starten

Kein Build-Schritt nötig. Wegen der ES-Module muss die Seite über einen Webserver laufen (nicht per `file://`). Die Bestenlisten-API läuft lokal nicht (dafür bräuchte es wrangler), deshalb gibt es den Mock-Modus `?mock=1`:

```bash
python -m http.server 8765
```

| URL | Zweck |
|---|---|
| http://localhost:8765/ | Spiel |
| http://localhost:8765/tests/ | Unit-Tests |
| http://localhost:8765/tests/e2e.html | End-to-End-Test (löscht den lokalen Spielstand!) |
| http://localhost:8765/bestenliste/?mock=1 | Bestenliste mit Server im Browser (nur localhost, Beispieldaten) |
| http://localhost:8765/tests/e2e-board.html | End-to-End-Test Bestenliste im Mock-Modus (überschreibt den eigenen Spielstand!) |
| http://localhost:8765/tests/e2e-portal.html | End-to-End-Test Mitarbeiterportal (überschreibt den eigenen Spielstand!) |
| http://localhost:8765/tests/shot-portal.html?tab=urkunde | Portal angemeldet zeigen (für Screenshots), Reiter: rundschreiben, personalakte, urkunde, stellen, kantine, organigramm |
| http://localhost:8765/tests/sim.html?cps=3&h=16 | Balancing-Simulation eines Durchlaufs (`ev=0` ohne Ereignisse, `manual=0` Auto-Platzieren, `off=syn_,land_` Upgrades abschalten) |
| http://localhost:8765/tests/sim-prestige.html | Prestige-Simulation: mehrere Durchläufe, Neustart an Checkpoints (`plans=U|4,U|5,U`) |
| http://localhost:8765/tests/seed.html?level=1\|2\|3 | Test-Spielstand mit Fortschritt erzeugen (überschreibt den eigenen!). Ist als Test markiert und kommt nie in die Bestenliste |
| http://localhost:8765/tests/seed.html?phase=2\|3\|4\|5 | Test-Spielstand mitten in Phase 2–5 (optional `&tears=40`) |
| http://localhost:8765/tests/shot.html?phase=3&tab=prestige | Seed laden und Spiel in 1400 px zeigen (für Screenshots), `spawn=demo,trupp` erzeugt Gegenspieler |
| http://localhost:8765/tests/shot-mobile.html?phase=3 | dasselbe in Handy-Breite |
| http://localhost:8765/tests/music.html | Musik-Playlist: jedes Stück in wählbarer Stufe anhören, Pegelprüfung aller Stücke (dauert einige Minuten) |
| http://localhost:8765/tests/maps.html | Vorschau der Europa- und Weltkarte |
| http://localhost:8765/tests/mobile.html | Handy-Vorschau (390 px / 360 px) |

## Vorschaubild (Open Graph)

`assets/img/og.png` (1200 × 630) wird aus der Vorlage `tools/og.html` erzeugt. Nach Änderungen bei laufendem Server neu aufnehmen:

```bash
msedge --headless=new --hide-scrollbars --user-data-dir=<leerer Ordner> --window-size=1200,630 --screenshot=assets/img/og.png http://localhost:8765/tools/og.html
```

## Struktur

```
assets/js/core/   Spiellogik (state, economy, game) – ohne DOM, testbar
assets/js/data/   Anlagen, Upgrades, Erfolge, News, Bundesländer, Kartendaten
assets/js/ui/     Karte, Shop, HUD
functions/        Cloudflare Pages Functions der Bestenliste (api/), Logik und Speicher in _lib/
migrations/       D1-Schema
tools/            check_sql.py – prüft die SQL-Befehle der Bestenliste gegen SQLite
                  build_map.py – erzeugt map-de.js aus Natural-Earth-Daten (Bundesländer)
                  build_world.py – erzeugt map-eu.js und map-world.js (Länder, ne_50m_admin_0_countries)
```

## Lizenzen

- Kartendaten und Einwohner Europa/Welt: [Natural Earth](https://www.naturalearthdata.com/) (gemeinfrei)
- Schriften: VT323 und IBM Plex Mono, SIL Open Font License 1.1 (siehe `assets/fonts/`)

*Satire. Die Bundesanstalt für Gedankenfunk existiert nicht. 5G ist nach aktuellem Stand der Wissenschaft unbedenklich.*
