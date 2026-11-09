# Designdokument: 5gsendemast.de – „Projekt Sendemast“

> Stand: 07.11.2026 · Version 0.2
> Verbindliche Grundlage für die Umsetzung. Änderungen werden hier zuerst eingetragen und dann umgesetzt.

---

## 0. Projektstand & Todos

> Hier steht immer, wo wir stehen geblieben sind. Bei jeder Sitzung aktualisieren.

> **▶ HIER GEHT'S WEITER (nächste Sitzung):**
> 0. **🟢 LIVE seit 09.11.2026:** https://5gsendemast.de (Cloudflare Pages-Projekt `sendemast`, auch https://sendemast.pages.dev). Spiel, Seiten und Bestenliste (D1) laufen. `IP_SALT` gesetzt, `www` und `http` leiten per 301 auf `https://5gsendemast.de` um (Pfad und Parameter bleiben). Offen: Spiel komplett durchspielen.
> 1. ~~**Online gehen (§11, M7)**~~, Schritt-für-Schritt in [`HOSTING-ANLEITUNG.md`](HOSTING-ANLEITUNG.md). Erledigt (09.11.2026): GitHub-Repo, D1-Datenbank, Domain in Cloudflare, **Nameserver auf Cloudflare umgestellt**. Offen: Pages-Projekt, Secret `IP_SALT`, Custom Domain. Die Bestenliste ist fertig, aber erst online testbar (lokal nur mit `?mock=1`).
> 2. Impressum und Datenschutz sind ausgefüllt (09.11.2026). Damit ist alles für den Live-Gang bereit: Pages-Projekt anlegen (HOSTING-ANLEITUNG.md Schritt 5/6).
> 3. Nach dem Online-Gang: Spiel komplett durchspielen, Bestenliste und Prestige echt testen.

### ❗ Offen (Stand 09.11.2026)
- [x] ~~Prestige-Balancing entscheiden~~: Kubikwurzel, +8 % je Träne, Patente billiger (09.11.2026, §4.9)
- [ ] Prestige im Spiel einmal durchspielen: Fühlen sich 5 Tränen nach der Welt bzw. 47 nach dem Universum gut an? (nach dem Online-Gang)
- [ ] Portal-Texte gegenlesen: 14 Rundschreiben, 8 Stellen, Kantinenplan, Organigramm, 8 Dienstgrade (`data/portal.js`).
- [ ] **Datenschutz:** Bestandsaufnahme, offene Maßnahmen und Checkliste für die Erklärung stehen in [`DATENSCHUTZ-NOTIZEN.md`](DATENSCHUTZ-NOTIZEN.md). Die vier Maßnahmen (IP kürzen, `ip_hash` nach 24 h löschen, Namenshinweis, Portal nur Sitzung) sind seit 09.11.2026 umgesetzt. Offen ist nur noch der Text der Erklärung.
- [x] ~~M3-Texte gegenlesen~~ („Das Spiel passt so“, 09.11.2026)
- [ ] Leertaste nach Klick auf eine Anlage drücken: Es darf **nichts** gekauft werden (automatisch nicht testbar).
- [ ] Einwohnerzahlen Europa/Welt stammen aus Natural Earth (POP_EST, Stand 2019, Welt ≈ 7,68 Mrd.). Vor dem Release ggf. aktualisieren (`tools/build_world.py`).
- [x] ~~Geheimakte prüfen~~, ~~Phasen 2–5 anspielen~~ (erledigt 09.11.2026)
- [x] ~~Zweiten Durchlauf nach Prestige simulieren~~ (`tests/sim-prestige.html`, 09.11.2026)

### Wo wir stehen geblieben sind (09.11.2026)
- **Neu am 09.11. (vierter Teil):** Datenschutz-Maßnahmen umgesetzt (siehe DATENSCHUTZ-NOTIZEN.md §4). Vorschaubild für Messenger: `assets/img/og.png`, eingebunden in Spiel, Geheimakte, Portal und Bestenliste.
- **Neu am 09.11. (dritter Teil): Bestenliste fertig** (§5). Pages Functions `functions/api/leaderboard.js` und `functions/api/score.js`, Logik in `functions/_lib/`, D1-Schema in `migrations/0001_init.sql`, `wrangler.toml`. Seite `/bestenliste/` mit Eintragen, Rang, „Diese Woche/Ewig“ und Austragen. Das Spiel meldet automatisch, sobald man eingetragen ist. Getestet ohne Cloudflare: Logik im Browser mit In-Memory-Speicher (`tests/index.html`, `tests/e2e-board.html` mit `?mock=1`), SQL mit `python tools/check_sql.py` gegen SQLite. **Noch nie gegen echtes D1 gelaufen.**
- **Neu am 09.11. (zweiter Teil): Mitarbeiterportal fertig** (§7). Fake-Login, Rundschreiben (teils über Erfolge freigeschaltet), Personalakte mit Laufbahn, Beförderungsurkunde als PNG, Stellenbörse, Kantinenplan, Organigramm. Tests: `tests/e2e-portal.html`, Screenshots: `tests/shot-portal.html?tab=urkunde`.
- **Neu am 09.11.: M3 ist komplett.**
  - **Aluhut-Demo:** fünf Figuren in einer Region, jede kostet 10 % Signal. Wer alle überzeugt, bekommt eine Prämie (§4.7).
  - **Wünschelruten-Trupp:** braucht drei Klicks und zieht alle 8 s in eine andere Region weiter.
  - **8 Synergie-Upgrades**, z. B. „Weihnachtsgottesdienst“: Kirchturm +1 % je Tanne.
  - **16 Bundesland-Upgrades:** je +1,5 % FP/s nach der Übernahme des Landes.
  - Dazu 6 neue Erfolge (jetzt 69) und 8 News.
- **Fehler in der alten Simulation behoben:** `tests/sim.js` hat Goldene Masten und Aluhüte per `queueMicrotask` angeklickt. Die Klicks liefen erst nach dem Ende der Simulation, die simulierten Spieler haben also **nie** auf Ereignisse reagiert. Mit echten Klicks war das Universum in 1 Std. 18 Min. erobert statt in 9 Std.
- **Ereignisse neu abgestimmt** (Werte als Konstanten oben in `core/game.js`):
  - Aluhut-Belohnung 6 s statt 30 s Produktion, Aluhut-Upgrades ×1,5 statt ×2.
  - Influencer ×4 statt ×10 (10 % statt 15 % Wahrscheinlichkeit).
  - Goldener Mast alle 5–10 Min. statt alle 2–5 Min.
  - Frequenzrausch ×4 für 44 s statt ×7 für 77 s.
  - Klickwahn ×77 statt ×777.
- **Zwei Exploits behoben:**
  - Klickwahn vervielfachte auch den Einweihungsbonus und die Aluhut-Prämien. Jetzt zählt dort der Impuls ohne Klickwahn.
  - Der Einweihungsbonus (5 s Produktion) lohnte sich mit billigen Funkmasten endlos. Er ist jetzt auf den halben Kaufpreis begrenzt.
- **Fehler behoben:** Nach einem Prestige gab es beim zweiten Universum keinen Abschlussdialog, weil `universeDone` den Neustart überlebt. Neu ist `universeRun` (gilt je Durchlauf).
- **Prestige umgestellt (Option a):** Tränen = Kubikwurzel statt Quadratwurzel, +8 % statt +2 % je Träne, Patente kosten 1–40 statt 1–250 Tränen. Die Texte im Spiel lesen den Bonus jetzt aus `TEAR_BONUS`.
- **Simulation:** Der Kern liegt jetzt in `tests/simcore.js`, die Ausgabe zeigt zusätzlich, woher die FP kommen. Neu ist `tests/sim-prestige.html` (mehrere Durchläufe, Neustart an Checkpoints).
- **Fertig (07./08.11.):** Spielkern, Karte, 12 Anlagen, 5 Phasen, Prestige mit Patenten, Geheimakte (11 Akten, 19 Quellen).
- **Impressum und Datenschutz:** ausgefüllt am 09.11.2026 (Datenschutz auf Basis von Datenschutz-Generator.de, angepasst). Bei Änderungen an Bestenliste, Browser-Speicher oder Hosting mitpflegen.
- **Lokal testen:** `python -m http.server 8765` → http://localhost:8765/ (Tests unter `/tests/`, siehe README). Headless-Läufe mit Edge immer mit einem **frischen** `--user-data-dir` (vorher löschen). Sonst landet der Test-Spielstand im echten Browserprofil, und lange nicht geänderte Module (z. B. `patents.js`) kommen nach einer Änderung noch aus dem Cache.
- **Neu am 09.11. (achter Teil): 4 europäische Musikstücke** (Frankreich, Polen, Italien, Finnland), ab Phase 2 in der Playlist (§4.15).
- **Neu am 09.11. (siebter Teil): Musik-Playlist** mit 6 Stücken (ca. 12 Min.), Anzeige des Titels und „Nächster Titel“ (§4.15).
- **Neu am 09.11. (sechster Teil): 8 neue Anlagen** (§4.3), je zwei für Europa, Welt, Orbit & Mond und Universum, mit Icons, Erfolgen und News. Tränen-Teiler angepasst.
- **Neu am 09.11. (fünfter Teil): Hintergrundmusik** (§4.15): selbst erzeugter Synthwave-Song, 2 Minuten, wird mit jeder Phase intensiver, standardmäßig aus.
- **Live:** https://5gsendemast.de seit 09.11.2026 (Pages-Projekt `sendemast`). Jeder Push auf `main` geht sofort live.
- **Code auf GitHub:** https://github.com/kofer99/5gsendemast (privat, Branch `main`, seit 09.11.2026). D1-Datenbank `sendemast-db` angelegt (ID in `wrangler.toml`), Tabelle `scores` per Konsole erstellt. Noch kein Pages-Projekt, also noch nicht live.

### Nächste Schritte (Reihenfolge offen)
3. Cloudflare Pages anlegen und Custom Domain verbinden (§11, M7). Repo, D1 und DNS sind fertig.

---

## 1. Vision

5gsendemast.de ist eine **Satire-Website**, die 5G-Verschwörungsmythen auf die Schippe nimmt. Herzstück ist ein **eskalierendes Idle-/Clicker-Spiel** im Stil von Cookie Clicker: Der Spieler arbeitet für die fiktive **„Bundesanstalt für Gedankenfunk“ (BAfG)** und stellt Sendemasten auf einer Deutschlandkarte auf, um die Bevölkerung zu „kontrollieren“. Das Spiel beginnt klein und endet völlig absurd mit der Kontrolle über das Universum.

Die Pointe kommt mit der **„Geheimakte“**: Sie ist witzig verpackt, aber inhaltlich korrekt und erklärt, warum 5G harmlos ist.

**Ziele**
1. Ein Spiel, das wirklich Spaß macht und süchtig macht. Der Gag allein trägt nicht.
2. Die Seite soll geteilt werden („Ich kontrolliere schon 12 Mio. Deutsche“).
3. Echte Aufklärung, ohne belehrend zu sein.
4. Kosten von 0 € im Betrieb (abgesehen von der Domain).

**Nicht-Ziele**
- Kein Login, keine Accounts, kein Tracking, keine Werbung.
- Keine Monetarisierung.
- Kein Framework- oder Build-Overhead.

---

## 2. Ton & Satire-Richtlinien

| Erlaubt / erwünscht | Tabu |
|---|---|
| Mythen überzeichnen (Chemtrails, Reptiloiden, Mikrochips, Bielefeld) | Echte Personen namentlich verspotten |
| Abzocke durch Aluhut-Händler und Abschirmprodukte persiflieren | Menschen mit echten Beschwerden verhöhnen (z. B. „Elektrosensible“: Die Symptome sind real, nur die Ursache ist nicht 5G) |
| Behördensprache und Bürokratie parodieren | Echte Logos, Marken oder Behörden imitieren (Telekom, Vodafone, BNetzA, BfS …) |
| Absurde Steigerung bis ins Weltall | Falschinformationen *ohne* erkennbaren Witz |
| Echte Fakten auf der Faktenseite | Verwechslungsgefahr mit einer echten Behörde |

- Die **BAfG ist erkennbar fiktiv**. Sie hat kein Bundesadler-Logo und keine Bundesfarben im Behördenlook.
- Jede Seite hat im Footer einen **Satire-Hinweis**: *„Satire. Die Bundesanstalt für Gedankenfunk existiert nicht. 5G ist nach aktuellem Stand der Wissenschaft unbedenklich → Geheimakte“*.
- Sprache: Deutsch, Du-Form im Spiel, Beamtendeutsch im Portal.

---

## 3. Seitenstruktur

| Pfad | Inhalt |
|---|---|
| `/` | Das Spiel (Hauptbildschirm) |
| `/geheimakte/` | Faktenseite: „Was die BAfG dir verschweigt“ (der Gag: Es ist einfach die Wahrheit) |
| `/portal/` | Fake-Mitarbeiterportal der BAfG |
| `/bestenliste/` | Globale Bestenliste (Top 100, Filter: diese Woche / ewig) |
| `/impressum/` | Impressum (Platzhalter) |
| `/datenschutz/` | Datenschutzerklärung (Platzhalter) |
| `/api/*` | Backend für die Bestenliste (Cloudflare Pages Functions) |

Die Navigation im Spiel-Header enthält Geheimakte, Bestenliste und Portal. Der Footer enthält Impressum, Datenschutz und den Satire-Hinweis.

---

## 4. Spielmechanik

### 4.1 Ressourcen

| Wert | Bedeutung |
|---|---|
| **Funkpunkte (FP)** | Währung. Entsteht durch Klicks und Anlagen, wird für Anlagen und Upgrades ausgegeben. |
| **Kontrollierte Bürger** | Fortschrittswert, wird nie ausgegeben. Er ergibt sich aus der Abdeckung der Bundesländer (siehe 4.4) und ist die **Hauptzahl** im Header und in der Bestenliste. |
| **Aluhut-Tränen** | Prestige-Währung (siehe 4.9). |

> Hinweis zu den Mockups: Dort steht nur „kontrollierte Bürger“. In der Umsetzung kommt die FP-Anzeige direkt darunter dazu.

### 4.2 Klicken
- Ein Klick auf die Karte oder auf den Button **„Strahlungsimpuls senden“** bringt FP pro Klick (Start: 1).
- Visuelles Feedback: eine Funkwellen-Animation an der Klickstelle und eine aufsteigende Zahl „+1.250“.
- Die Klick-Upgrades skalieren mit (z. B. „Klick = +1 % der FP/s“).

### 4.3 Anlagen (Generatoren)

Die Kosten steigen pro Kauf: `Preis = Basispreis × 1,15^Anzahl`. Werte sind Startwerte für das Balancing.

| # | Anlage | Basispreis (FP) | FP/s | Flavor-Text | Ort |
|---|---|---|---|---|---|
| 1 | Kleiner Funkmast | 15 | 0,1 | „Völlig harmlos. Offiziell.“ | Karte DE |
| 2 | Getarnte Tanne | 100 | 1 | „Nadeln aus Glasfaser.“ | Karte DE |
| 3 | Kirchturm-Sender | 1.100 | 8 | „Sonntags doppelte Reichweite.“ | Karte DE |
| 4 | Windrad | 12.000 | 47 | „Dreht sich nur zur Tarnung.“ | Karte DE |
| 5 | Smart-Toaster-Netz | 130.000 | 260 | „Toastet auch Gedanken.“ | Karte DE |
| 6 | Chemtrail-Staffel | 1,4 Mio. | 1.400 | „Jetzt mit Lavendelduft.“ | Karte DE |
| 7 | Reptiloiden-Rechenzentrum | 20 Mio. | 7.800 | „Klimaanlage auf 38 °C.“ | Karte DE |
| 8 | HAARP-Außenstelle Bielefeld | 330 Mio. | 44.000 | „Existiert nicht. Wie Bielefeld.“ | Karte DE (fester Ort) |
| 9 | EU-Normantenne *(neu 09.11.)* | 250 Mio. | 83.000 | „Krümmung gemäß Verordnung (EU) 5G/2026.“ | ab Phase 2 |
| 10 | Euro-Funknetz | 1,2 Mrd. | 300.000 | „Brüssel hat's genehmigt.“ | ab Phase 2 |
| 11 | Eurovisions-Sendezentrale *(neu)* | 7 Mrd. | 1,4 Mio. | „Douze points für jede Frequenz.“ | ab Phase 2 |
| 12 | Tiefseekabel-Krake *(neu)* | 9 Mrd. | 1,5 Mio. | „Acht Arme, überall Empfang.“ | ab Phase 3 |
| 13 | Satelliten-Schwarm „Gedankenlink“ | 30 Mrd. | 4 Mio. | „Jetzt auch mit Funkloch-Garantie.“ | ab Phase 3 |
| 14 | Pyramiden-Sendeanlage Gizeh *(neu)* | 50 Mrd. | 6,5 Mio. | „Wurde nie für Pharaonen gebaut.“ | ab Phase 3 |
| 15 | Weltraumschrott-Antennenpark *(neu)* | 180 Mrd. | 20 Mio. | „Recycling auf 400 km Höhe.“ | ab Phase 4 |
| 16 | Mond-Sendemast | 500 Mrd. | 50 Mio. | „Erklärt die Gezeiten.“ | ab Phase 4 |
| 17 | Mars-Rover mit Megafon *(neu)* | 1 Bio. | 95 Mio. | „Fährt 4 cm pro Stunde. Sendet schneller.“ | ab Phase 4 |
| 18 | Schwarzes-Loch-Verstärker *(neu)* | 2,4 Bio. | 200 Mio. | „Nichts entkommt ihm. Auch keine Gedanken.“ | ab Phase 5 |
| 19 | ∞G-Quantenturm | 8 Bio. | 600 Mio. | „Sendet, bevor du denkst.“ | ab Phase 5 |
| 20 | Pulsar-Leuchtfeuer *(neu)* | 60 Bio. | 4 Mrd. | „Blinkt seit Milliarden Jahren. Jetzt mit Inhalt.“ | ab Phase 5 |

**Seit 09.11.2026** hat jede spätere Phase drei Anlagen statt einer (vorher: Deutschland 8, jede weitere Phase 1). Die neuen Anlagen liegen preislich vor bzw. nach der bestehenden, das Verhältnis Preis zu FP/s steigt gleichmäßig von 3.000 (Normantenne) bis 15.000 (Pulsar). Alle wirken gebietsweit und bleiben in späteren Phasen nützlich. Je Anlage gibt es automatisch 7 Stufen-Upgrades und einen Erfolg (jetzt 77 Erfolge). Wirkung laut Simulation: Durchlauf ca. 8 % schneller (ohne Ereignisse 6:46 → 6:15), deshalb Tränen-Teiler 4,6e9 → 2,1e9, damit das Universum weiterhin ca. 47 Tränen bringt.

Die Anlagen 9–12 waren ursprünglich deutlich teurer (5,1 Mrd. bis 14 Bio.). Damit dauerte allein die Welt über 5 Stunden. Sie wurden am 08.11.2026 per Simulation angepasst.

- Eine Anlage wird erst sichtbar, wenn insgesamt 30 % ihres Basispreises verdient wurden. Davor erscheint sie als „??? Gesperrt“. Der Kleine Funkmast ist immer sichtbar.
- Kaufmenge ist umschaltbar: ×1, ×10, ×100, Max.

**Reichweite (Stand Balancing 07.11.2026, zweite Runde):**

| Anlage | Reichweite je Stück | Wirkung |
|---|---|---|
| Funkmast | 1.000 | lokal |
| Tanne | 6.000 | lokal |
| Kirchturm | 30.000 | lokal |
| Windrad | 150.000 | lokal |
| Smart-Toaster | 700.000 | lokal |
| Chemtrail | 700.000 | landesweit |
| Reptiloiden | 2 Mio. | landesweit |
| HAARP | 15 Mio. | landesweit (steht fest in Bielefeld) |
| EU-Normantenne | 4 Mio. | gebietsweit |
| Euro-Funknetz | 25 Mio. | gebietsweit |
| Eurovisions-Sendezentrale | 55 Mio. | gebietsweit |
| Tiefseekabel-Krake | 40 Mio. | gebietsweit |
| Satelliten-Schwarm | 160 Mio. | gebietsweit |
| Pyramiden-Sendeanlage | 170 Mio. | gebietsweit |
| Weltraumschrott-Antennenpark | 350 Mio. | gebietsweit |
| Mond-Sendemast | 1,5 Mrd. | gebietsweit |
| Mars-Rover mit Megafon | 2,2 Mrd. | gebietsweit |
| Schwarzes-Loch-Verstärker | 2 Bio. | gebietsweit |
| ∞G-Quantenturm | 15 Bio. | gebietsweit |
| Pulsar-Leuchtfeuer | 60 Bio. | gebietsweit |

„Landesweit“ heißt seit M4 **gebietsweit**: Die Anlagen wirken immer auf das ganze Gebiet der aktuellen Phase (europaweit, weltweit …). Lokale Anlagen wirken nur in der Region der aktuellen Phase, in der sie stehen. Die Masten in Deutschland bleiben stehen, zählen in Europa aber nicht mehr.

Dazu kommen 5 Reichweiten-Upgrades mit je **+20 %**, insgesamt ×2,49. Vorher waren es drei Upgrades mit ×2, das führte zu Sprüngen von 30 % auf 60 %.

**Regel:** Kein einzelner Kauf soll mehr als ca. 4 Prozentpunkte bringen. Ausnahme: späte Reichweiten-Upgrades (max. ca. 7) und HAARP als bewusstes Highlight.

Simulation: aktuelle Zeiten siehe §4.5. Die älteren Zahlen in diesem Abschnitt stammen aus der fehlerhaften Simulation, die nie auf Ereignisse reagiert hat (siehe §0).

### 4.4 Die Karte & „Masten platzieren“

**Darstellung:** eine stilisierte SVG-Karte Deutschlands mit den **16 Bundesländern**. Grundlage sind Natural-Earth-Daten (gemeinfrei), vereinfacht mit mapshaper.

**Platzieren:**
- Nach dem Kauf einer Kartenanlage (#1–7) hat der Spieler „einen Mast in der Hand“. Ein Klick auf die Karte stellt ihn dort auf. Bei lokalen Anlagen (#1–5) entscheidet der Ort über die Wirkung. Bei landesweiten Anlagen (#6–7) ist der Ort nur Optik, das steht auch in der Hand-Anzeige. Die HAARP-Außenstelle (#8) erscheint immer automatisch in Bielefeld.
- Die Reichweite jeder Anlage steht sichtbar in der Shop-Zeile („Reichweite 400 · im Bundesland“). Abdeckungskreise auf der Karte wachsen logarithmisch mit der Reichweite.
- Der Tooltip eines Bundeslands zeigt, wie viele Menschen durch Anlagen im Land und wie viele durch landesweite Anlagen erreicht werden.
- Gegen Klick-Ermüdung gibt es den Schalter **„Auto-Platzieren“**. Er setzt neue Masten automatisch ins schwächste Bundesland. Bei Käufen ×10 und mehr ist er immer aktiv.
- Jede Anlage hat eine Reichweite *R* (Mast 1, Tanne 3, Kirchturm 20 … in „Bürger-Einheiten“, zum Balancing).

**Einweihungsbonus:** Wer einen Mast von Hand platziert, bekommt `max(3 Impulse, min(5 s Produktion, halber Kaufpreis))` FP. Die Grenze beim halben Kaufpreis gilt seit dem 09.11.2026. Vorher konnte man in späten Phasen endlos billige Funkmasten kaufen und einweihen. Das belohnt aktives Spielen. Wer gezielt kleine Länder wie Bremen oder das Saarland füllt, übernimmt außerdem früher das erste Bundesland. Auto-Platzieren verteilt dagegen gleichmäßig.

**Kontrolle pro Bundesland:**
```
lokal_BL    = Σ (Anlagen im BL × Reichweite × Reichweiten-Multiplikator)   (Überschuss verfällt)
Rest_BL     = max(0, Einwohner_BL − lokal_BL)
national    = Σ (landesweite Anlagen × Reichweite × Multiplikator)
Füllgrad    = min(1, national / Σ Rest_BL)
Kontrolle_BL = (min(Einwohner_BL, lokal_BL) + Rest_BL × Füllgrad) / Einwohner_BL
Kontrollierte Menschen = Σ Einwohner_BL × Kontrolle_BL
```
Landesweite Anlagen füllen also die Lücken proportional auf, ohne dass Reichweite verschwendet wird.
- Die Einfärbung des Bundeslands richtet sich nach dem Kontrollgrad.
- Bei 100 % gilt das Bundesland als **„übernommen“**: Es gibt eine Bonus-Animation, eine Ticker-Meldung und +5 % FP/s dauerhaft.
- Jedes Bundesland hat einen eigenen Gag bei der Übernahme (Bayern: „Weißwurst-Frequenz aktiviert“, Saarland: „War eh schon in der Kantine“, Berlin: „Flughafen-Sender fertig, Eröffnung 2047“).

**Einwohner (gerundet, Mio.):** NRW 18,1 · Bayern 13,4 · Baden-Württemberg 11,3 · Niedersachsen 8,1 · Hessen 6,4 · Rheinland-Pfalz 4,2 · Sachsen 4,1 · Berlin 3,9 · Schleswig-Holstein 3,0 · Brandenburg 2,6 · Sachsen-Anhalt 2,2 · Thüringen 2,1 · Hamburg 1,9 · Mecklenburg-Vorpommern 1,6 · Saarland 1,0 · Bremen 0,7 → **≈ 84,6 Mio.** (Zahlen vor dem Release noch einmal mit Destatis abgleichen)

**Bielefeld-Gag:** Bielefeld wird als „? nicht gefunden“ markiert. Die HAARP-Außenstelle (#8) kann nur dort gebaut werden. Danach erscheint Bielefeld, mit Achievement „Es existiert doch!“.

### 4.5 Eskalationsphasen

**Status:** ✅ umgesetzt (`data/phases.js`, Karten `map-eu.js`/`map-world.js` aus `tools/build_world.py`, `map-space.js` von Hand gezeichnet).

| Phase | Karte | Regionen | Bevölkerung | Übernahme-Bonus | Freischaltung |
|---|---|---|---|---|---|
| 1 | Deutschland | 16 Bundesländer | 84,6 Mio. | +5 % je Land | Start |
| 2 | Europa | 44 Länder + Deutschland | ≈ 748 Mio. | +2 % je Land | 100 % Deutschland |
| 3 | Welt | 16 Weltregionen + Europa | ≈ 7,68 Mrd. | +5 % je Region | 100 % Europa |
| 4 | Orbit & Mond | ISS, Satellitengürtel, geostationärer Orbit, Mond (Vorder-/Rückseite), Mars + Erde | ≈ 103 Mrd. „Lebewesen“ | +10 % je Zone | 100 % Welt |
| 5 | Universum | 8 Galaxien, Rand des Universums + Sonnensystem | ≈ 1,5 Brd. | +10 % je Galaxie | 100 % Orbit & Mond |

- **Geerbte Region:** Auf jeder Karte erscheint das bereits eroberte Gebiet als *eine* Region (Deutschland in Europa, Europa in der Welt …). Es zählt immer zu 100 % und ist nicht bebaubar.
- **Phase 5** wird jetzt mit 100 % Orbit freigeschaltet statt mit „Mond-Sendemast ×1“. So endet jede Phase gleich.
- **Zwergstaaten** (Vatikan, Monaco, San Marino, Liechtenstein, Andorra, Malta) sind auf der Europakarte anklickbare Punkte. Der Vatikan (825 Menschen) ist mit einem Funkmast übernommen. Erfolg „Zwergenaufstand“.
- Kleine Gebiete werden zusammengefasst: Åland → Finnland, Färöer → Dänemark, Jersey/Guernsey/Isle of Man → Vereinigtes Königreich. Die Türkei, Zypern und der Kaukasus liegen laut Natural Earth in Asien und kommen deshalb erst in Phase 3.
- **Kartenwechsel:** Über der Karte gibt es Tabs (DE · EU · WELT · ORBIT · ALL) für alle erreichten Phasen. Gebaut wird nur auf der aktuellen Karte. Kauft man eine Anlage, während eine alte Karte angezeigt wird, springt die Ansicht zurück.
- **Zwischensequenz** bei jedem Phasenwechsel (Dienstwagen → Reisebus → Linienflugzeug → Raumschiff → Warp-Antrieb) mit „Prahlen“-Knopf. Nach dem Universum folgt ein Abschlussdialog mit einem Hinweis auf die Geheimakte.
- Ab Phase 4 heißt der Zähler „Kontrollierte Lebewesen“. Ab 1 Bio. wird er abgekürzt („45,1 Bio.“), sonst sprengt er die Kopfzeile.

**Simulation** (`tests/sim.html?h=16`, Stand 09.11.2026, mit M3). „Ereignisse an“ heißt: Jeder Goldene Mast und jeder Aluhut wird nach 2 s angeklickt. Das ist die Obergrenze, echte Spieler verpassen einige.

| Phase fertig | 3 Klicks/s, von Hand, Ereignisse an | 3 Klicks/s, von Hand, Ereignisse aus | 1 Klick/s, Auto-Platzieren, Ereignisse aus |
|---|---|---|---|
| Deutschland | 1 Std. 5 Min. | 1 Std. 30 Min. | 1 Std. 50 Min. |
| Europa | 1 Std. 56 Min. | 2 Std. 57 Min. | 3 Std. 26 Min. |
| Welt (Prestige möglich, ca. 6 Tränen) | 2 Std. 31 Min. | 3 Std. 52 Min. | 4 Std. 26 Min. |
| Orbit & Mond (ca. 15 Tränen) | 3 Std. 1 Min. | 4 Std. 41 Min. | 5 Std. 24 Min. |
| Universum (ca. 46 Tränen) | 3 Std. 50 Min. | 6 Std. 15 Min. | 7 Std. 7 Min. |

Stand mit den 8 neuen Anlagen (09.11.2026, dritte Spalte: 1 Klick/s mit Auto-Platzieren, ohne Ereignisse).

Herkunft der FP bei „Ereignisse an“: Aluhüte ca. 7 %, Demos ca. 7 %, Influencer ca. 6 %, Trupps ca. 3 %, Einweihung ca. 5 %, Impulse ca. 7 %, der Rest kommt aus den Anlagen. Aktives Spielen ist damit etwa 1,6× schneller.

In späteren Phasen springt die Kontrolle pro Kauf um bis zu 10–19 Prozentpunkte. Das ist gewollt, weil es dort weniger, aber größere Anschaffungen gibt.

### 4.6 Upgrades
- Pro Anlage: ×2-Upgrades bei 1 / 5 / 25 / 50 / 100 / 150 / 200 Stück (Cookie-Clicker-Muster). Beispiele: „5G+“, „5G Ultra“, „5G Ultra Max Pro“, „5,5G“, „Aluhut-Durchdringung“.
- Klick-Upgrades: „Doppelklick-Erlass“, „Dienstfinger aus Titan“.
- **Synergien** ✅ (8 Stück, `data/upgrades.js` → `SYNERGIES`): Anlage A bekommt +x % je Stück von Anlage B. Beispiele: „Weihnachtsgottesdienst“ (Kirchturm +1 % je Tanne), „Warmhalteplatte für Reptiloiden“ (Reptiloiden +1 % je Toaster), „Mondsüchtige Satelliten“ (Mond +1,5 % je Satelliten-Schwarm). Sie werden frei, sobald man von beiden Anlagen genug besitzt. Die erste Fassung mit doppelten Werten machte das Spiel ohne Ereignisse fast doppelt so schnell und wurde deshalb halbiert.
- **Bundesland-Upgrades** ✅ (16 Stück, `LAND`): Nach der Übernahme eines Bundeslands gibt es ein Upgrade mit +1,5 % FP/s und Lokalkolorit („Maibaum-Antennen“, „Kehrwoche für Funkwellen“, „Stadtmusikanten-Verstärker“). Preis: 20 FP je Einwohner. Die gebietsweiten Anlagen füllen alle Länder gleichmäßig auf, deshalb fallen die meisten Länder erst am Ende von Phase 1. Die Upgrades sind daher vor allem ein Startschub für Europa. Wer kleine Länder gezielt von Hand füllt, bekommt sie früher.

### 4.7 Gegenspieler: Aluhutträger
- Alle 30–90 s erscheint ein **Aluhutträger** in einem kontrollierten Bundesland. Er tritt erst ab 2.000 kontrollierten Menschen auf, gleichzeitig sind höchstens 1–4 aktiv.
- Jeder aktive Aluhutträger senkt die gesamte Produktion um 10 % (höchstens −50 %).
- Ein Klick „überzeugt“ ihn per Gratis-WLAN. Dafür gibt es `max(6 s Produktion, 5 Impulse)` FP (vor dem 09.11.: 30 s, siehe §0), und er zieht ab. Impulse zählen dabei ohne Klickwahn.
- **Telegram-Influencer**: erscheint ab 500 FP/s mit 10 % Wahrscheinlichkeit, braucht 10 Klicks und bringt die 4-fache Belohnung.
- **Wünschelruten-Trupp** ✅: erscheint ab 3.000 FP/s mit 12 % Wahrscheinlichkeit. Er braucht 3 Klicks, zieht alle 8 s in eine andere Region (gleitet über die Karte) und bringt die 3-fache Belohnung. Er bleibt 40 s.
- **Aluhut-Demo** ✅: erscheint ab 20.000 FP/s mit 8 % Wahrscheinlichkeit, aber nur, wenn gerade kein anderer Aluhut aktiv ist. Fünf Figuren tauchen in einer Region auf, jede kostet 10 % (zusammen −50 %). Jede Figur bringt die normale Belohnung. Wer alle fünf überzeugt, bekommt zusätzlich die 3-fache Prämie. Die Demo bleibt 50 s.
- Nach 60 s ohne Reaktion verschwindet er von selbst. Es gibt keine dauerhafte Strafe, damit das Spiel idle-tauglich bleibt.

### 4.8 Bonus-Events: der „Goldene Mast“
Ein goldener Mast erscheint alle 5–10 min an einer zufälligen Stelle und bleibt 13 s sichtbar (vor dem 09.11.: alle 2–5 min, siehe §0).

| Effekt | Wirkung | Dauer |
|---|---|---|
| Frequenzrausch | FP/s ×4 | 44 s |
| Glücksfund | +15 % des Guthabens (max. 15 min Produktion) | sofort |
| Klickwahn | FP pro Klick ×77 | 13 s |
| Funkloch *(selten, negativ)* | FP/s ×0,5 | 30 s |

### 4.9 Prestige: „Neustart nach Weltherrschaft“

**Status:** ✅ umgesetzt (Tab „Prestige“, `data/patents.js`, `Game.prestige()`).
- Verfügbar, sobald im aktuellen Durchlauf die Welt erobert ist (Phase ≥ 4) und mindestens eine neue Träne fällig wäre.
- **Aluhut-Tränen** insgesamt: `floor(Kubikwurzel(Gesamt-FP_jemals / 2,1e9))` (seit 09.11.2026; zuerst 4,6e9, mit den 8 neuen Anlagen 2,1e9; davor Quadratwurzel durch 4e9). Ein Neustart bringt die Differenz zu den schon erhaltenen Tränen. Laut Simulation sind das nach der Welt ca. 6, nach Orbit & Mond ca. 15 und nach dem Universum ca. 46.
- Jede Träne bringt dauerhaft +8 % FP/s (vorher +2 %). **Ausgegebene Tränen behalten ihren Bonus** (wie bei Cookie Clicker): Patente kosten nur die Entscheidung.
- **Bleibt erhalten:** Tränen, Patente, Erfolge, Gesamt-FP, Statistik (Klicks, Aluhüte, Goldene Masten, Spielzeit), Einstellungen. **Wird zurückgesetzt:** FP, Anlagen, Masten, Upgrades, übernommene Gebiete, Phase.
- Nach dem Neustart wird die Seite neu geladen (einfacher und robuster als alle Karten im Betrieb zurückzubauen).
- **Himmlische Patente** (Kosten in Tränen, seit 09.11.2026): Startpaket Funkmast (1) · Goldene Antenne (1) · Nachtschicht-Zulage, offline 75 % (2) · Dauer-Impuls, 1 Impuls/s (2) · Aluhut-Gewerkschaft ×3 (3) · Erfolgsprämie +2 % je Erfolg (4) · Express-Genehmigung, Übernahme-Boni ×2 (6) · Weitsicht-Erlass, Reichweite +50 % (8) · Beamten-Startgeld 1 Mio. FP (10) · Ewige Frequenz (15) · Impuls-Automat Mk II (25) · Diplomatischer Pass, 1 Mrd. FP Startgeld (40). Mit den Tränen aus dem ersten Universum (47) sind die ersten neun Patente drin. Startgeld zählt nicht als verdient, sonst gäbe es Tränen aus dem Nichts.
- Flavor: „Die Menschheit wurde per Software-Update zurückgesetzt.“

**Simulation mit Prestige** (`tests/sim-prestige.html`, Stand 09.11.2026). Ein Plan legt für jeden Durchlauf fest, wann neu gestartet wird: **4** = sofort nach der Welt (frühester Zeitpunkt), **5** = nach Orbit & Mond, **U** = nach dem Universum. Patente kauft der Spieler nach jedem Neustart, billigste zuerst. Zeiten in Std:Min.

| Plan | Universum nach (aktiv, Ereignisse an) | letzter Durchlauf | Universum nach (Ereignisse aus) | letzter Durchlauf | Tränen am Ende |
|---|---|---|---|---|---|
| U (kein Neustart) | 4:19 | 4:19 | 6:46 | 6:46 | 47 |
| 4 → U | 6:00 | 3:11 | 9:43 | 5:33 | 47 |
| 5 → U | 5:04 | 1:35 | 9:08 | 3:50 | 48 |
| 4 → 4 → U | 7:30 | 2:52 | 12:35 | 5:13 | 47 |
| 4 → 5 → U | 6:45 | 1:34 | 12:11 | 3:49 | 49 |
| 5 → 5 → U | 6:06 | 1:26 | 11:39 | 3:34 | 48 |
| U → U | 5:07 | 0:48 | 8:35 | 1:48 | 55 |
| U → U → U | 5:51 | 0:45 | 10:11 | 1:36 | 61 |

**Vorher (Quadratwurzel, +2 % je Träne):** Welt 12 Tränen, Universum 349. Der zweite Universum-Durchlauf dauerte 33 Min., der dritte 21 Min. Ein Neustart nach der Welt kostete 1,5 Std.

**Befund nach der Umstellung:**
1. Nach dem Universum bleibt das Spiel länger interessant: Der zweite Durchlauf dauert 48 Min. statt 33 Min. (ohne Ereignisse 1:48), der dritte 45 Min. statt 21 Min. Weitere Universen bringen nur noch wenige Tränen (+8, dann weniger). Das ist ein natürliches Ende, ähnlich wie bei Cookie Clicker.
2. Frühe Tränen sind relativ mehr wert: Die Welt bringt jetzt 11 % der Universum-Tränen statt 3 %.
3. **Ein früher Neustart lohnt sich trotzdem nicht.** Das ist strukturell: Die FP wachsen je Phase etwa um den Faktor 30, und die Tränen hängen an den Gesamt-FP. Ein zweiter Welt-Durchlauf bringt deshalb nur +1 Träne, egal welche Wurzel. Der Bonus je Träne ändert daran kaum etwas (5 % statt 8 % getestet: Unterschied von wenigen Minuten).
4. Die Zwischensequenz nach der Welt sagt das jetzt ehrlich: „Nach dem Universum sind es fast zehnmal so viele.“

**Falls frühe Neustarts sich lohnen sollen (nicht umgesetzt):** Tränen je erreichtem Checkpoint vergeben statt aus den Gesamt-FP, z. B. Welt 3, Orbit 6, Universum 12 Tränen **pro Durchlauf**. Dann lohnen sich schnelle Welt-Schleifen, sobald ein Durchlauf schnell genug ist. Nachteil: Man braucht eine Obergrenze oder abnehmende Erträge, sonst lässt sich endlos farmen.

### 4.15 Hintergrundmusik

**Status:** ✅ umgesetzt am 09.11.2026 (`assets/js/audio/synthwave.js`).
- **Selbst erzeugter 80er-Synthwave** mit der Web Audio API: keine Audiodateien, keine fremden Samples, daher keine Lizenzfragen und kein externer Abruf (Datenschutz unverändert). Die Datei ist ca. 42 KB groß (ungepackt, gzip deutlich kleiner).
- **Playlist (seit 09.11.2026):** 10 Stücke, zusammen ca. 19 Min. (6 von Anfang an, 4 europäische ab Phase 2), Start bei einem zufälligen Stück, danach der Reihe nach mit kurzer Pause:
  1. Gedankenfunk (96 BPM, A-Moll, 2:00) · 2. Nachtschicht in Bielefeld (86, D-Moll, Halftime, 2:14) · 3. Autobahn nach Brüssel (112, E-Moll, treibend, 2:00) · 4. Chemtrail-Sonnenuntergang (100, hell, 1:55) · 5. Mondbasis Alpha (80, Fis-Moll, spärlich, 2:00) · 6. Kosmische Verwaltungsreform (118, H-Moll, 1:54).
  - Jedes Stück besteht aus Teilen à 8 Takten mit eigenen Akkorden, Bass-, Arpeggio- und Drum-Mustern (Stile: full, drive, half, sparse, break), dazu eigene Klangfarben (Arpeggio-Welle, Echo-Länge, Helligkeit). Breakdowns setzen die Drums aus und bauen mit Snare-Wirbel auf.
  - Melodien: Stück 1 von Hand, Stücke 2–6 regelbasiert aus den Akkordtönen erzeugt (`makeLead`, fester Seed, also immer gleich).
  - **Europa-Stücke (ab Phase 2, seit 09.11.2026):** 7. Café de la Fréquence 🇫🇷 (Musette: Akkordeon-Lead, Umpa-Bass, harmonisches Moll) · 8. Góralski Sygnał 🇵🇱 (Mazurka im 3/4-Takt, lydisch wie in der Tatra, Geige, Bordun) · 9. Amore a 3,6 GHz 🇮🇹 (Italo Disco: Oktav-Bass, Clap, Bläser-Hook) · 10. Revontulten tango 🇫🇮 (finnischer Tango, Habanera-Bass, Kantele-Arpeggio). Eigene Kompositionen im Stil des Landes, keine bestehenden Lieder. In Phase 1 laufen nur die Stücke 1–6, ab Phase 2 alle 10 gemischt (ca. 19 Min.); maßgeblich ist die aktuelle Phase (`playlistFor`).
  - Neues Stück: Eintrag in `SONGS` (`assets/js/audio/synthwave.js`), Tonart über `transpose`, Taktart über `spb` (12 = 3/4), Freischaltung über `from` (Phase), Melodie über `'gen:<seed>[:<Tonleiter>]'` oder eine Notenliste. Lead-Stimmen: sawtooth, square, triangle, accordion, fiddle, brass; Arpeggio zusätzlich pluck (Kantele). Drum-Stile: full, drive, half, sparse, break, musette, mazurka, italo, tango.
- **Instrumente:** Pads (verstimmte Sägezähne, atmender Tiefpass), Bass (Säge + Sub), Arpeggio (Rechteck mit punktiertem Achtel-Echo), Kick, Snare mit Hall, Hi-Hats, Crash, Lead (Säge mit Vibrato). Hall aus vier Rückkopplungs-Echos (kein ConvolverNode).
- **Intensität folgt der Phase:** 1 Pads, Bass, leise Drums · 2 + Snare, Fills · 3 + Arpeggio, Crash · 4 + volle Kick, 16tel-Hats, hellerer Klang · 5 + Lead-Melodien in A, B und D.
- **Bedienung:** standardmäßig **aus**. Knopf „♪ MUSIK“ in der Kopfzeile. Unter Optionen → Audio: Lautstärkeregler (Standard 50 %), aktueller Titel und „Nächster Titel“. Beides wird im Spielstand gemerkt (`settings.music`, `settings.musicVolume`). War die Musik an, startet sie nach dem Neuladen mit der ersten Interaktion (Autoplay-Regeln der Browser). Im Hintergrund-Tab pausiert sie.
- **iOS/Safari (seit 09.11.2026):** Beim Einschalten wird die Audio-Session auf „playback“ gestellt (`navigator.audioSession`, iOS 17+; ältere Versionen: stilles `<audio>` in Schleife). Die Musik spielt dadurch auch bei eingeschaltetem Stummschalter, wie eine Musik-App. Freigeschaltet wird beim Loslassen (`touchend`/`click`), nicht beim Drücken. Ist der Audio-Kontext noch nicht bereit oder unterbrochen (Anruf), bleibt die Musik an und startet bei der nächsten Berührung. **Noch nicht auf einem echten iPhone bestätigt.**
- **Test und Vorschau:** `tests/music.html` rendert alle Stücke offline (Stufe 5 und 1), prüft Pegel (keine Übersteuerung, kein Teil still; dauert einige Minuten) und bietet jedes Stück in wählbarer Stufe zum Anhören.

---

## 5. Bestenliste

**Status:** ✅ umgesetzt am 09.11.2026, noch nicht online getestet (es gibt lokal kein wrangler/Node).

**Eintrag:** Der Spieler trägt sich auf `/bestenliste/` mit einem Spitznamen ein (3–16 Zeichen, a–z, 0–9, Umlaute, ß, `-` und `_`, Groß/Klein egal eindeutig). Es gibt keinen Login und keine E-Mail. Im Browser wird nur der Spitzname gemerkt (`sendemast.lb`). Danach meldet das Spiel den Bestwert automatisch: bei jedem Phasenwechsel und beim Universum sofort, sonst höchstens alle 5 Min. und nur bei neuem Bestwert. Wer nie auf „Eintragen“ klickt, sendet nichts. „Austragen“ löscht den Eintrag auf dem Server.

**Gewertet wird** (entschieden 09.11.2026): `bestControlledAll`, also die höchste je erreichte Zahl kontrollierter Menschen/Lebewesen, über Prestige hinweg. Wer das Universum erobert, hat immer denselben Höchstwert (1,5 Brd.). Bei Gleichstand entscheiden deshalb die insgesamt gefunkten FP (`fpAll`), dann der frühere Eintrag. „Diese Woche“ = in den letzten 7 Tagen gemeldet.

**API (Cloudflare Pages Functions + D1)**

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/leaderboard?range=week\|all` | Top 100: `{ range, total, entries: [{ rank, name, score, fpAll, phase, updatedAt }] }`, 30 s Cache |
| `POST` | `/api/score` | Eintrag oder Verbesserung: `{ name, runId, score, fpAll, phase, playtime }` → `{ ok, rank, rankWeek, score, name }` |
| `DELETE` | `/api/score` | Eintrag löschen: `{ runId }` |

Fehler: `400` (`error: name` oder `invalid`, mit deutschem `reason`), `409` Name vergeben, `429` Rate-Limit, `413` Anfrage zu groß, `503` Datenbank nicht verbunden. Werte gehen beim Melden nur nach oben (Bestwert, FP, Phase, Spielzeit). Der Name darf sich ändern. `runId` und `ip_hash` werden nie ausgeliefert.

**Aufbau:** `functions/api/*.js` sind dünne Hüllen. Die Logik steckt in `functions/_lib/handlers.js` (nur Web-Standard-APIs), der Speicher in `functions/_lib/store.js` (`d1Store` für Produktion, `memoryStore` für Tests). Die Regeln (Namensfilter, Plausibilität, Grenzwerte) stehen in `assets/js/data/leaderboard-rules.js` und gelten im Browser und auf dem Server gleich.

**Datenbank (D1, SQLite):** siehe `migrations/0001_init.sql`. Die Datei enthält bewusst **keine Kommentare**: Die D1-Konsole im Dashboard fügt Zeilen zusammen, ein `--` kommentiert dann den Rest aus („incomplete input: SQLITE_ERROR“). Tabelle `scores` mit `run_id` (Primärschlüssel), `name`, `name_key` (eindeutig), `score`, `fp_all`, `phase`, `playtime`, `ip_hash`, `created_at`, `updated_at`.

**Missbrauchsschutz (plausibilisieren statt verhindern)**

Ein reines Browser-Spiel lässt sich nie vollständig gegen Cheats absichern. Das ist bewusst akzeptiert.
- **Plausibilität:** Der Wert darf nicht größer sein als alle Einwohner der gemeldeten Phase und nicht kleiner als die der Vorphase. Mindest-Spielzeit je Phase: Europa 20 Min., Welt 40 Min., Orbit 60 Min., Universum-Phase 75 Min., ganzes Universum 90 Min. (etwa ein Drittel des schnellsten simulierten Durchlaufs). Gesamt-FP höchstens 1e22.
- **Rate-Limit:** höchstens 1 Meldung pro Minute und höchstens 5 neue Einträge pro Tag je `ip_hash`.
- **`ip_hash`** = SHA-256(gekürzte IP + Tagesdatum + Secret `IP_SALT`), auf 128 Bit gekürzt. Gekürzt wird auf das Netz (IPv4 drei Blöcke, IPv6 48 Bit). Nach 24 h wird der Wert gelöscht (bei jeder Meldung). Die IP wird nie gespeichert.
- **Namensfilter:** kurze Sperrliste (Beleidigungen, NS-Begriffe), auch mit Ziffern statt Buchstaben („N4zi“). Dazu reservierte Namen wie „Admin“ oder „BAfG“. URLs sind durch den Zeichensatz ausgeschlossen.
- **Test-Spielstände:** Spielstände von Testseiten (`tests/seed.html`, e2e) tragen `test: true`. Das bleibt über Prestige und Export/Import erhalten und verschwindet erst mit „Neuer Einsatz“. Spiel und Bestenlisten-Seite melden sie nie, der Server lehnt sie zusätzlich ab. `tests/e2e-board.html` läuft nur auf localhost, damit online keine echten Einträge entstehen. Gegen absichtliches Schummeln hilft das nicht, nur gegen versehentliche Testeinträge.
- Admins können Einträge per `wrangler d1 execute sendemast-db --remote --command "DELETE FROM scores WHERE name_key = '…'"` löschen.

**Tests ohne Cloudflare:** `tests/index.html` (Regeln und Handler mit `memoryStore`), `tests/e2e-board.html` (Seite mit `?mock=1`: die echten Handler laufen im Browser), `python tools/check_sql.py` (alle SQL-Befehle gegen SQLite inkl. Upsert, Sortierung, Rang, Eindeutigkeit). Der Mock-Modus funktioniert nur auf `localhost`.

---

## 6. Geheimakte (Faktenseite)

**Status:** ✅ umgesetzt (`geheimakte/index.html`, Stil `assets/css/akte.css`), Quellen abgerufen am 07.11.2026. **Vor dem Launch vom Projektinhaber gegenlesen (siehe §0).**

**Aufmachung:** Geleaktes Dokument mit Stempel „STRENG GEHEIM“ und geschwärztem Aktenzeichen. Der Witz: Es steht einfach die Wahrheit drin. Jede Akte beginnt mit einer rot markierten „BAfG-intern“-Behauptung, darunter steht „Was wirklich stimmt“ mit nummerierten Quellenverweisen. Oben gibt es eine Kurzfassung für Eilige und ein Inhaltsverzeichnis, unten ein Fazit mit „Akte weiterleiten“ und das Quellenverzeichnis.

**Akten**
1. Was 5G wirklich ist – Radiowellen; v. a. 2-GHz-Band und 3,6 GHz, künftig auch 26 GHz; Beamforming
2. Warum 5G keine Gedanken liest – ionisierend vs. nicht-ionisierend; Erwärmung als Hauptmechanismus
3. Unsere Grenzwerte (leider) – 26. BImSchV, ICNIRP 2020: 4 W/kg ≈ 1 °C, Grenzwert 50-fach darunter (0,08 W/kg)
4. Mehr Masten, weniger Strahlung – eigenes Handy erzeugt stärkere Felder als Basisstationen; Leistungsregelung
5. Und Krebs? – IARC 2B (2011), WHO-beauftragte Übersichtsarbeit 2024 (Karipidis et al.): kein Zusammenhang mit Hirntumoren
6. Corona? Nicht unsere Abteilung – CORRECTIV-Faktencheck (WHO-Mythbusters enthält 5G nicht mehr)
7. Die toten Vögel von Den Haag – kein 5G-Test im Oktober 2018; Aufprallverletzungen (Full Fact)
8. Elektrosensibilität – **ohne Witz**: Beschwerden sind real; Doppelblind-Studien zeigen keinen Zusammenhang mit Feldern
9. Die Aluhut-Industrie – radioaktive „Anti-5G“-Produkte (ANVS/RIVM 2021); MIT-Alufolienhelm-Versuch 2005
10. Wo stehen die Masten? – EMF-Datenbank der Bundesnetzagentur
11. Was noch erforscht wird – Frequenzen > 20 GHz, IARC-Neubewertung, BfS-Vorsorgeempfehlung

**Bewusst weggelassen**, weil nicht in einer Primärquelle bestätigt: „Basisstationen meist unter 1 % des Grenzwerts“, „Handy sendet bei gutem Empfang bis zu 99,9 % weniger“, 700-MHz-Band.

**Regeln:** Für die Faktenseite gilt **null Fantasie** – jede Aussage braucht eine Quelle. Quellen mit Abrufdatum; Links vor jeder Veröffentlichung erneut prüfen (z. B. `curl`-Schleife über alle `href`). Fakten-Meldungen im News-Ticker verlinken auf die passende Akte (`href` in `news.js`).

---

## 7. Mitarbeiterportal der BAfG

Eine Parodie auf ein Behörden-Intranet mit übertriebener Bürokratie. **Status:** ✅ umgesetzt am 09.11.2026 (`portal/index.html`, `assets/js/portal.js`, Inhalte in `assets/js/data/portal.js`, Stil in `assets/css/portal.css`).

- **Login-Seite (Fake):** Es gibt **kein `<form>`** und keine `name`-Attribute. Die Felder werden beim Klick auf „Anmelden“ sofort geleert, nichts wird gesendet oder gespeichert (der e2e-Test prüft das). Jede Eingabe führt zu „Zugang gewährt. Wir wussten ohnehin, dass Sie es sind.“ Gespeichert wird nur der Merker „angemeldet“ in `sessionStorage`, er ist beim Schließen des Tabs weg. Ein Hinweis unter dem Formular sagt, dass es Satire ist und man kein echtes Passwort eingeben soll.
- **Bereiche** (Reiter, per Link direkt erreichbar, z. B. `/portal/#urkunde`):
  - **Rundschreiben:** 14 Stück, 4 immer sichtbar (darunter das „Leck“, das auf die Geheimakte verlinkt). 10 werden über Erfolge freigeschaltet (erster Aluhut, HAARP, Demo, Trupp, Europa, Welt, ISS, Prestige, Universum …). Gesperrte erscheinen geschwärzt mit Hinweis. Ungelesene haben eine Zahl am Reiter. Welche gelesen sind, merkt sich der Browser (`localStorage`).
  - **Personalakte:** Dienstgrad, Besoldungsgruppe, Personalnummer (aus der Spielstand-ID), Dienstzeit, Bestwert, Erfolge, dienstliche Beurteilung und die ganze Laufbahn mit Voraussetzungen.
  - **Beförderungsurkunde:** Canvas-Bild 1200 × 630 mit Name (optional, vorbelegt mit dem Spitznamen), Dienstgrad, Bestwert, Datum und Stempel. „Herunterladen“ speichert ein PNG. „Teilen“ nutzt die Web Share API mit Bild, sonst nur den Text bzw. die Zwischenablage. Der Name wird nicht gespeichert.
  - **Stellenbörse:** 8 Stellen, z. B. „Reptiloid (m/w/d) in Teilzeit“ oder „Sachbearbeiter:in Bielefeld-Leugnung“. Die Stelle für den Mond-Sendemast wird erst nach der Weltherrschaft ausgeschrieben. „Bewerben“ zeigt nur eine Antwort an.
  - **Kantine:** Mo–Fr mit aktueller Kalenderwoche, der heutige Tag ist markiert. Am Wochenende: „Die Masten senden trotzdem.“
  - **Organigramm:** Präsident:in (vakant, nach dem Universum „Sie“), Stabsstellen und 7 Abteilungen, Abt. 4 Bielefeld durchgestrichen.
- **Dienstgrade** (aus dem Spielstand, bleiben über Prestige erhalten): Funkanwärter:in → Funksekretär:in (1. Bundesland) → Oberfunksekretär:in (halbe Republik) → Funkinspektor:in (Deutschland) → Funkamtsrat/-rätin (Europa) → Oberfunkrat/-rätin (Welt) → Ministerialdirigent:in für Orbitalfunk (Orbit) → Präsident:in der BAfG (Universum).
- Das Portal liest den Spielstand nur und schreibt ihn nie. Ohne Spielstand ist man Funkanwärter:in und bekommt einen Hinweis aufs Spiel.

---

## 8. Rechtliches (Deutschland)

> Das ist keine Rechtsberatung. Bei Unsicherheit einen Anwalt oder einen Generator wie e-recht24 nutzen.

- **Impressum** (§ 5 DDG) mit Platzhaltern für Name, Anschrift und E-Mail.
- **Datenschutzerklärung:**
  - Hosting bei Cloudflare (Verarbeitung der IP-Adresse beim Seitenaufruf, Auftragsverarbeitung)
  - Bestenliste: Spitzname, Score und gehashte IP, mit Zweck, Speicherdauer und Rechtsgrundlage
  - `localStorage` nur für Spielstand und Einstellungen. Das ist technisch notwendig und vom Nutzer gewünscht (§ 25 Abs. 2 TDDDG), deshalb ist **kein Cookie-Banner** nötig.
- **Keine externen Ressourcen:** Schriften (VT323, IBM Plex Mono bzw. Bangers, Nunito) werden **selbst gehostet**, kein Google-Fonts-CDN (DSGVO, vgl. LG München 2022). Es gibt kein Analytics und keine externen Skripte.
- **Satire-Kennzeichnung** auf allen Seiten, keine fremden Marken oder Logos.
- **Schriftlizenzen:** Alle genannten Fonts stehen unter der SIL Open Font License. Die Lizenztexte werden mit ausgeliefert.

---

## 9. Visuelles Design

**Mockups beider Stile:** https://claude.ai/artifact/RjhqHpwmQNhnUzk9bDgqLo

| | Stil A: Geheimbehörde-Terminal | Stil B: Bunter Comic |
|---|---|---|
| Hintergrund | #070B08, Raster und Scanlines | #FFF1C9 mit Halbton-Punkten |
| Primär | Phosphorgrün #3DFF8A | Rot #C62E22, Blau #2F6FE4, Gelb #FFC93C |
| Warnung | Bernstein #FFB02E | Gelb und schwarzer Rand |
| Schrift | VT323 (Zahlen, Titel), IBM Plex Mono | Bangers (Titel), Nunito (Text) |
| Formen | 1px-Linien, eckig, Glow | 3px schwarze Konturen, runde Ecken, Offset-Schatten |
| Wirkung | „Wir sind die Verschwörung“ | Lustig, zugänglich, teilbar |

**→ Entschieden: Stil A (Geheimbehörde-Terminal)** gilt für alle Seiten. Die Geheimakte darf als „gescanntes Dokument“ heller sein (Papier, Stempel), bleibt aber im Behörden-Look.

**Layout Hauptbildschirm (Desktop ≥ 1024 px):**
- Header: Logo, Bürger-Zähler, FP/s, Navigation
- Links (ca. 60 %): Karte mit Abdeckungsbalken und Impuls-Button
- Rechts (ca. 40 %): Shop mit den Tabs Anlagen, Upgrades und Prestige
- Unten: News-Ticker

**Mobil (< 1024 px):** Header kompakt mit Zähler, darunter die Karte im Vollbild. Der Shop ist ein ausklappbares Bottom-Sheet, der Ticker sitzt über der Bottom-Navigation.

**Barrierefreiheit**
- Echte `<button>`-Elemente, vollständig per Tastatur bedienbar (Leertaste = Impuls)
- Kontrast mindestens 4,5:1
- `prefers-reduced-motion` schaltet Flackern, Scanlines und Wackeln ab
- Zahlenänderungen werden nicht per Screenreader-Spam angesagt (`aria-live` gedrosselt)

---

## 10. Technik

**Stack:** reines HTML, CSS und JavaScript mit ES-Modulen. Kein Framework und kein Build-Schritt nötig.

**Ordnerstruktur**
```
/
├── index.html                 # Spiel
├── geheimakte/index.html
├── portal/index.html
├── bestenliste/index.html
├── impressum/index.html
├── datenschutz/index.html
├── assets/
│   ├── css/                   # base.css, game.css, pages.css
│   ├── fonts/                 # selbst gehostet + OFL-Lizenzen
│   ├── img/                   # og-image, Icons (SVG)
│   └── js/
│       ├── main.js            # Einstieg, Game-Loop
│       ├── state.js           # Spielzustand, Save/Load, Migration
│       ├── data/              # buildings.js, upgrades.js, news.js, achievements.js, states.js (Bundesländer)
│       ├── systems/           # economy.js, map.js, events.js, prestige.js, offline.js
│       ├── ui/                # render.js, shop.js, ticker.js, dialogs.js
│       └── util/format.js     # Zahlenformat
├── functions/api/             # Cloudflare Pages Functions
│   ├── leaderboard.js
│   └── score.js
├── migrations/0001_init.sql   # D1-Schema
├── tools/                     # Skripte (z. B. Karten-Vereinfachung)
├── wrangler.toml
├── DESIGN.md
└── README.md
```

**Game-Loop**
- Die Logik läuft in festen Ticks mit 10 Hz (`setInterval`).
- Gerendert wird per `requestAnimationFrame`, und nur geänderte DOM-Teile werden aktualisiert.
- Bei verstecktem Tab läuft keine Darstellung. Der Fortschritt wird per Zeitdifferenz nachgerechnet.

**Daten statt Code:** Anlagen, Upgrades, News und Achievements sind reine Datenlisten. Das erleichtert Balancing und neue Gags.

**Tests:** Die Kernformeln (Kosten, Produktion, Kontrolle, Offline, Prestige) bekommen kleine Unit-Tests ohne Abhängigkeiten. Dazu kommt ein Balancing-Skript, das einen Durchlauf simuliert, um die Zeit bis zur jeweiligen Phase zu prüfen.

**Balancing-Ziele (Richtwerte)**
- Erste Anlage nach ca. 15 s, erstes übernommenes Bundesland nach ca. 5 min
- Deutschland zu 100 % nach ca. 1–2 h aktivem Spiel
- Erster Prestige nach ca. 1–2 Tagen (inklusive Idle-Zeit)

**Performance:** Startseite unter 300 KB übertragen (ohne Fonts), Lighthouse ≥ 90. Stand 08.11.2026: ca. 365 KB ungepackt bzw. ca. 130 KB mit gzip (Cloudflare komprimiert automatisch). Die Karten machen ca. 190 KB davon aus. Falls nötig, könnten Europa- und Weltkarte erst beim Phasenwechsel nachgeladen werden (`import()`).

---

## 11. Hosting & Deployment

> Ausführliche Anleitung mit Live-Gang: [`HOSTING-ANLEITUNG.md`](HOSTING-ANLEITUNG.md).

1. **GitHub:** privates oder öffentliches Repository, Push auf `main`
2. **Cloudflare Pages:** mit dem GitHub-Repo verbinden. Build-Befehl: keiner. Ausgabeordner: `/`. Jeder Push deployt automatisch, Branches erhalten Preview-URLs.
3. **D1:** Datenbank `sendemast-db` anlegen (`wrangler d1 create sendemast-db` oder im Dashboard), die `database_id` in `wrangler.toml` eintragen, Migration ausführen (`wrangler d1 migrations apply sendemast-db --remote`, oder den Inhalt von `migrations/0001_init.sql` in der D1-Konsole ausführen) und in den Pages-Einstellungen als `DB` binden. Secret `IP_SALT` setzen (lange Zufallszeichenkette, Pages → Einstellungen → Umgebungsvariablen, verschlüsselt).
   - Achtung: Mit `pages_build_output_dir = "."` werden auch `tests/`, `tools/` und `DESIGN.md` öffentlich ausgeliefert. Bei einem öffentlichen Repo ist das unkritisch. Wer es nicht will, legt die Seiten in einen Unterordner (z. B. `public/`) oder blockt die Pfade mit `_redirects`.
4. **Domain:** `5gsendemast.de` in Cloudflare als Zone hinzufügen und **die Nameserver bei CheckDomain** auf die beiden Cloudflare-Nameserver umstellen
5. In Pages die Custom Domains `5gsendemast.de` und `www.5gsendemast.de` hinzufügen, mit Weiterleitung von www auf die Hauptdomain
6. HTTPS (automatisch) prüfen und „Always Use HTTPS“ aktivieren
7. ~~Vorhandene DNS-Einträge vor dem Nameserver-Wechsel übernehmen~~: Nameserver am 09.11.2026 auf Cloudflare umgestellt. E-Mail über die Domain wird **nicht** gebraucht.

---

## 12. Meilensteine

| # | Meilenstein | Ergebnis |
|---|---|---|
| M0 ✅ | Konzept | Dieses Dokument, Mockups, Stil-Entscheidung |
| M1 ✅ | Spielkern | Klicken, Anlagen 1–8, Speichern, Zahlenformat, Ticker (statische Karte) |
| M2 ✅ | Karte | Bundesländer-SVG, Masten platzieren, Kontrolle, Übernahme-Effekte |
| M3 ✅ | Würze | Upgrades, Aluhutträger, Goldener Mast, Achievements, Offline-Fortschritt. Seit 09.11.2026 auch Aluhut-Demo, Wünschelruten-Trupp, Synergie- und Bundesland-Upgrades |
| M4 ✅ | Eskalation | Phasen 2–5 mit eigenen Karten, Prestige mit Tränen und Patenten (08.11.2026) |
| M5 (teilweise) | Seiten | ✅ Geheimakte (11 Akten, 19 geprüfte Quellen, Stand 07.11.2026). ✅ Mitarbeiterportal (09.11.2026). Offen: Impressum/Datenschutz ausfüllen |
| M6 ✅ | Online | Bestenliste (Functions + D1, 09.11.2026, noch nicht online getestet), Teilen (Prahlen-Knopf, Urkunde), Vorschaubild `assets/img/og.png` (Vorlage `tools/og.html`) |
| M7 | Launch | Hosting, Domain, Balancing-Feinschliff, Mobile-Test |

---

## 13. Offene Entscheidungen

- [x] **Artstil:** A – Geheimbehörde-Terminal (entschieden 07.11.2026)
- [ ] Endgültiger Spielname („Projekt Sendemast“?)
- [x] Score-Basis der Bestenliste: **kontrollierte Menschen** (höchster je erreichter Wert, über Prestige hinweg kumuliert)
- [x] Repository: **öffentlich**
- [x] E-Mail über die Domain wird nicht gebraucht (entschieden 09.11.2026). MX-Einträge können in Cloudflare gelöscht werden.
