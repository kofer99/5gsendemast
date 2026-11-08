# Designdokument: 5gsendemast.de – „Projekt Sendemast“

> Stand: 07.11.2026 · Version 0.2
> Verbindliche Grundlage für die Umsetzung. Änderungen werden hier zuerst eingetragen und dann umgesetzt.

---

## 0. Projektstand & Todos

> Hier steht immer, wo wir stehen geblieben sind. Bei jeder Sitzung aktualisieren.

### ❗ Offen (Stand 08.11.2026)
- [ ] **Geheimakte komplett durchlesen** (`/geheimakte/`). Inhalt und Ton prüfen und jede Aussage gegen die verlinkte Quelle gegenlesen. Erst danach geht die Seite online. Auffälligkeiten direkt hier notieren.
  - Besonders prüfen: Akte 03 (Grenzwerte: 4 W/kg, Faktor 50, 0,08 W/kg – im ICNIRP-PDF selbst nicht maschinell gelesen, nur über Sekundärquellen abgeglichen), Akte 05 (Krebs/IARC), Akte 08 (Elektrosensibilität – Ton).
  - Zwei Links waren beim Test nicht erreichbar: Quelle [10] (ARPANSA, Zeitüberschreitung) und der BfS-Dokumentenserver (DORIS, Serverfehler 503 – daher über nbn-resolving.org verlinkt). Im Browser nachprüfen.
- [ ] Spiel nach dem neuen Balancing einmal komplett durchspielen (OPTIONEN → „Neuer Einsatz“). Fühlt sich der Weg zu 100 % gut an?
- [ ] Leertaste nach Klick auf eine Anlage drücken: Es darf **nichts** gekauft werden (automatisch nicht testbar).
- [ ] **Phasen 2–5 anspielen:** `/tests/seed.html?phase=2` (bzw. 3, 4, 5) legt einen Spielstand mitten in der Phase an. Achtung: überschreibt den eigenen Spielstand – vorher exportieren! Prüfen: Gags der Länder (§4.5, `data/phases.js`) im Ton okay? Zwergstaaten auf der Europakarte gut anklickbar?
- [ ] Einwohnerzahlen Europa/Welt stammen aus Natural Earth (POP_EST, Stand 2019, Welt ≈ 7,68 Mrd.). Vor dem Release ggf. aktualisieren (`tools/build_world.py`).
- [ ] Zweiter Durchlauf nach Prestige ist noch nicht simuliert (wie viel schneller geht es mit Tränen und Patenten?).

### Wo wir stehen geblieben sind (08.11.2026)
- **Neu am 08.11.:** M4 ist fertig. Es gibt 5 Phasen mit eigener Karte (Europa 45 Länder, Welt 17 Regionen, Orbit & Mond, Universum), 4 neue Anlagen, Zwischensequenzen und einen Kartenwechsel per Tab. Prestige gibt Aluhut-Tränen und Himmlische Patente (§4.5, §4.9). Dazu kommen 23 neue Erfolge (jetzt 63), Upgrades und ca. 30 News. Alte Spielstände (v1) werden migriert: Wer Deutschland schon erobert hat, landet direkt in Europa.
- **Behobener Fehler:** Dialoge hingen manchmal, weil das `close`-Ereignis zu spät kam. Jetzt gibt es eine Warteschlange, und die Knöpfe schließen den Dialog selbst.
- **Fertig (07.11.):** Spielkern mit Karte, 8 Anlagen, Upgrades, Erfolgen, Aluhutträgern, Goldenem Mast, News-Ticker, Speichern/Export/Import, Offline-Fortschritt (M1–M3 Basis). Balancing überarbeitet (§4.3). Geheimakte mit 11 Akten und 19 Quellen (§6).
- **Behobene Fehler der letzten Sitzung:** „Neuer Einsatz“/Import wurde vom Autospeichern überschrieben; Leertaste löste fokussierten Kaufen-Knopf aus; stille Teilkäufe bei ×10/×100.
- **Platzhalter:** Portal, Bestenliste, Impressum, Datenschutz (Impressum/Datenschutz: eigene Daten eintragen!).
- **Lokal testen:** `python -m http.server 8765` → http://localhost:8765/ (Tests unter `/tests/`, siehe README).
- **Noch nicht online:** kein GitHub-Remote, kein Hosting. Repo ist lokal unter `D:\FunProjectDomain`.

### Nächste Schritte (Reihenfolge offen)
1. Mitarbeiterportal der BAfG (§7)
2. Bestenliste mit Cloudflare Pages Functions + D1 (§5)
3. GitHub-Repo (öffentlich) + Cloudflare Pages + Domain-Umzug inkl. E-Mail-Einträge (§11, M7)
4. Rest von M3: Aluhut-Demo, Wünschelruten-Trupp, Synergie- und Bundesland-Upgrades

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
| 9 | Euro-Funknetz | 1,2 Mrd. | 300.000 | „Brüssel hat's genehmigt.“ | ab Phase 2 |
| 10 | Satelliten-Schwarm „Gedankenlink“ | 30 Mrd. | 4 Mio. | „Jetzt auch mit Funkloch-Garantie.“ | ab Phase 3 |
| 11 | Mond-Sendemast | 500 Mrd. | 50 Mio. | „Erklärt die Gezeiten.“ | ab Phase 4 |
| 12 | ∞G-Quantenturm | 8 Bio. | 600 Mio. | „Sendet, bevor du denkst.“ | ab Phase 5 |

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
| Euro-Funknetz | 25 Mio. | gebietsweit |
| Satelliten-Schwarm | 160 Mio. | gebietsweit |
| Mond-Sendemast | 1,5 Mrd. | gebietsweit |
| ∞G-Quantenturm | 15 Bio. | gebietsweit |

„Landesweit“ heißt seit M4 **gebietsweit**: Die Anlagen wirken immer auf das ganze Gebiet der aktuellen Phase (europaweit, weltweit …). Lokale Anlagen wirken nur in der Region der aktuellen Phase, in der sie stehen. Die Masten in Deutschland bleiben stehen, zählen in Europa aber nicht mehr.

Dazu kommen 5 Reichweiten-Upgrades mit je **+20 %**, insgesamt ×2,49. Vorher waren es drei Upgrades mit ×2, das führte zu Sprüngen von 30 % auf 60 %.

**Regel:** Kein einzelner Kauf soll mehr als ca. 4 Prozentpunkte bringen. Ausnahme: späte Reichweiten-Upgrades (max. ca. 7) und HAARP als bewusstes Highlight.

Simulation (`tests/sim.html`: 3 Klicks/s, Goldene Masten und Aluhüte sofort angeklickt, Masten von Hand mit Einweihungsbonus):

| Zeit | Kontrolle |
|---|---|
| 15 Min. | 1 % |
| 30 Min. | 13 % |
| 45 Min. | 24 % |
| 60 Min. | 47 % |
| 1 Std. 38 Min. | 100 % |

Größter Einzelsprung: +7 Prozentpunkte (Reichweiten-Upgrade 3), Chemtrail-Staffel +1,4.

### 4.4 Die Karte & „Masten platzieren“

**Darstellung:** eine stilisierte SVG-Karte Deutschlands mit den **16 Bundesländern**. Grundlage sind Natural-Earth-Daten (gemeinfrei), vereinfacht mit mapshaper.

**Platzieren:**
- Nach dem Kauf einer Kartenanlage (#1–7) hat der Spieler „einen Mast in der Hand“. Ein Klick auf die Karte stellt ihn dort auf. Bei lokalen Anlagen (#1–5) entscheidet der Ort über die Wirkung. Bei landesweiten Anlagen (#6–7) ist der Ort nur Optik, das steht auch in der Hand-Anzeige. Die HAARP-Außenstelle (#8) erscheint immer automatisch in Bielefeld.
- Die Reichweite jeder Anlage steht sichtbar in der Shop-Zeile („Reichweite 400 · im Bundesland“). Abdeckungskreise auf der Karte wachsen logarithmisch mit der Reichweite.
- Der Tooltip eines Bundeslands zeigt, wie viele Menschen durch Anlagen im Land und wie viele durch landesweite Anlagen erreicht werden.
- Gegen Klick-Ermüdung gibt es den Schalter **„Auto-Platzieren“**. Er setzt neue Masten automatisch ins schwächste Bundesland. Bei Käufen ×10 und mehr ist er immer aktiv.
- Jede Anlage hat eine Reichweite *R* (Mast 1, Tanne 3, Kirchturm 20 … in „Bürger-Einheiten“, zum Balancing).

**Einweihungsbonus:** Wer einen Mast von Hand platziert, bekommt `max(5 s Produktion, 3 Impulse)` FP. Das belohnt aktives Spielen. Wer gezielt kleine Länder wie Bremen oder das Saarland füllt, übernimmt außerdem früher das erste Bundesland. Auto-Platzieren verteilt dagegen gleichmäßig.

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

**Simulation** (`tests/sim.html?cps=3&h=16`, aktiv, Stand 08.11.2026):

| Phase fertig | aktiv (3 Klicks/s, von Hand) | gemütlich (1 Klick/s, Auto-Platzieren) |
|---|---|---|
| Deutschland | 1 Std. 37 Min. | 2 Std. 7 Min. |
| Europa | 3 Std. 47 Min. | 4 Std. 13 Min. |
| Welt (Prestige möglich, ca. 10 Tränen) | 5 Std. 8 Min. | 6 Std. 26 Min. |
| Orbit & Mond | 6 Std. 56 Min. | 8 Std. 25 Min. |
| Universum (ca. 300 Tränen) | 9 Std. 22 Min. | 11 Std. 9 Min. |

In späteren Phasen springt die Kontrolle pro Kauf um bis zu 10–19 Prozentpunkte. Das ist gewollt, weil es dort weniger, aber größere Anschaffungen gibt.

### 4.6 Upgrades
- Pro Anlage: ×2-Upgrades bei 1 / 5 / 25 / 50 / 100 / 150 / 200 Stück (Cookie-Clicker-Muster). Beispiele: „5G+“, „5G Ultra“, „5G Ultra Max Pro“, „5,5G“, „Aluhut-Durchdringung“.
- Klick-Upgrades: „Doppelklick-Erlass“, „Dienstfinger aus Titan“.
- Synergien, z. B. „Kirchturm × Tanne: Weihnachtsgottesdienst-Bonus“.
- Bundesland-Upgrades nach der Übernahme.

### 4.7 Gegenspieler: Aluhutträger
- Alle 30–90 s erscheint ein **Aluhutträger** in einem kontrollierten Bundesland. Er tritt erst ab 2.000 kontrollierten Menschen auf, gleichzeitig sind höchstens 1–4 aktiv.
- Jeder aktive Aluhutträger senkt die gesamte Produktion um 10 % (höchstens −50 %).
- Ein Klick „überzeugt“ ihn per Gratis-WLAN. Dafür gibt es `max(30 s Produktion, 10 Impulse)` FP, und er zieht ab.
- **Telegram-Influencer** (umgesetzt): erscheint ab 500 FP/s mit 15 % Wahrscheinlichkeit, braucht 10 Klicks und bringt die 10-fache Belohnung.
- Geplant: **Aluhut-Demo** (5 Figuren) und **Wünschelruten-Trupp** (wandert über die Karte).
- Nach 60 s ohne Reaktion verschwindet er von selbst. Es gibt keine dauerhafte Strafe, damit das Spiel idle-tauglich bleibt.

### 4.8 Bonus-Events: der „Goldene Mast“
Ein goldener Mast erscheint alle 2–5 min an einer zufälligen Stelle und bleibt 13 s sichtbar.

| Effekt | Wirkung | Dauer |
|---|---|---|
| Frequenzrausch | FP/s ×7 | 77 s |
| Glücksfund | +15 % des Guthabens (max. 15 min Produktion) | sofort |
| Klickwahn | FP pro Klick ×777 | 13 s |
| Funkloch *(selten, negativ)* | FP/s ×0,5 | 30 s |

### 4.9 Prestige: „Neustart nach Weltherrschaft“

**Status:** ✅ umgesetzt (Tab „Prestige“, `data/patents.js`, `Game.prestige()`).
- Verfügbar, sobald im aktuellen Durchlauf die Welt erobert ist (Phase ≥ 4) und mindestens eine neue Träne fällig wäre.
- **Aluhut-Tränen** insgesamt: `floor(sqrt(Gesamt-FP_jemals / 4e9))`. Ein Neustart bringt die Differenz zu den schon erhaltenen Tränen. Laut Simulation sind das bei der Welt ca. 10, beim Universum ca. 300.
- Jede Träne bringt dauerhaft +2 % FP/s. **Ausgegebene Tränen behalten ihren Bonus** (wie bei Cookie Clicker): Patente kosten nur die Entscheidung.
- **Bleibt erhalten:** Tränen, Patente, Erfolge, Gesamt-FP, Statistik (Klicks, Aluhüte, Goldene Masten, Spielzeit), Einstellungen. **Wird zurückgesetzt:** FP, Anlagen, Masten, Upgrades, übernommene Gebiete, Phase.
- Nach dem Neustart wird die Seite neu geladen (einfacher und robuster als alle Karten im Betrieb zurückzubauen).
- **Himmlische Patente** (Kosten in Tränen): Startpaket Funkmast (1) · Goldene Antenne (2) · Nachtschicht-Zulage, offline 75 % (3) · Dauer-Impuls, 1 Impuls/s (5) · Aluhut-Gewerkschaft ×3 (5) · Erfolgsprämie +2 % je Erfolg (10) · Express-Genehmigung, Übernahme-Boni ×2 (15) · Weitsicht-Erlass, Reichweite +50 % (20) · Beamten-Startgeld 1 Mio. FP (30) · Ewige Frequenz (60) · Impuls-Automat Mk II (100) · Diplomatischer Pass, 1 Mrd. FP Startgeld (250). Startgeld zählt nicht als verdient, sonst gäbe es Tränen aus dem Nichts.
- Flavor: „Die Menschheit wurde per Software-Update zurückgesetzt.“

### 4.10 News-Ticker
- Fortlaufende Meldungen, abhängig von Fortschritt und Phase. Zum Start mindestens 80 Texte.
- Beispiele:
  - „Telegram-Gruppe ‚Wahrheitsfunk‘ entdeckt Mast in Wanne-Eickel. Aluhut-Absatz +300 %“
  - „Oma Gisela (84) empfängt jetzt Radio über ihre Plomben“
  - „Studie: 9 von 10 Tauben sind Drohnen. Die zehnte ist Bundesbeamter.“
  - „Heilpraktiker verkauft Orgonit gegen Funkwellen. Funkwellen unbeeindruckt.“
- Gelegentlich steht eine **echte Fakten-Meldung** im Ticker, gekennzeichnet mit „🔍 Geheimakte:“. Sie verlinkt auf die Faktenseite.

### 4.11 Achievements
Etwa 40 zum Start. Beispiele: „Erster Mast“, „Bielefeld existiert doch!“, „Ganz Bayern hört mit“, „Ein Aluhut weniger“ (100 überzeugt), „Funkloch-Überlebender“, „Das Ende der Welt (und der Anfang des Mondes)“. Jedes Achievement gibt +1 % FP/s.

### 4.12 Speichern & Offline-Fortschritt
- Gespeichert wird in `localStorage` als versioniertes JSON (`save.version` für Migrationen), automatisch alle 30 s und beim Schließen des Tabs.
- Export und Import als Text-String (Base64) für Backups und Gerätewechsel.
- Offline-Fortschritt: 50 % der FP/s, höchstens 12 h. Beim Zurückkommen erscheint ein Dialog: „Während du weg warst, hat die BAfG 4,2 Mio. FP für dich gefunkt.“
- „Spielstand löschen“ mit doppelter Bestätigung.

### 4.13 Zahlenformat
- Deutsches Format mit `Intl.NumberFormat('de-DE')`.
- Große Zahlen: Tsd., Mio., Mrd., Bio., Brd., Trio., Trd., Quadr., … und danach wissenschaftlich (1,23e45).
- Für die Spielwerte reichen JS-Doubles (max. ≈ 1,8e308).

### 4.14 Teilen
- Der Button **„Prahlen“** nutzt die Web Share API. Fallback: Text in die Zwischenablage kopieren.
- Text: *„Ich kontrolliere bereits 12,4 Mio. Deutsche 📡 Wie viele schaffst du? 5gsendemast.de“*
- Open-Graph-Bild (statisch) für schöne Vorschauen in Messengern.

---

## 5. Bestenliste

**Eintrag:** Der Spieler gibt nur einen Spitznamen ein (3–16 Zeichen, a–z, 0–9, Umlaute, `-` und `_`). Name und Score werden vom Server gespeichert. Es gibt keinen Login und keine E-Mail.

**Gewertet wird:** die Zahl der jemals kontrollierten Bürger beziehungsweise der Gesamt-FP inklusive Prestige (endgültig beim Balancing festlegen).

**API (Cloudflare Pages Functions + D1)**

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/leaderboard?range=week\|all` | Top 100 |
| `POST` | `/api/score` | Eintrag oder Update: `{ name, score, phase, playtimeSec, runId }` |

**Datenbank (D1, SQLite)**
```sql
CREATE TABLE scores (
  run_id      TEXT PRIMARY KEY,   -- zufällige ID je Spielstand (im Save)
  name        TEXT NOT NULL,
  score       REAL NOT NULL,
  phase       INTEGER NOT NULL,
  playtime    INTEGER NOT NULL,
  ip_hash     TEXT NOT NULL,      -- SHA-256(IP + täglich rotierendes Salt), nie Klar-IP
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX idx_scores_score ON scores(score DESC);
```

**Missbrauchsschutz (plausibilisieren statt verhindern)**

Ein reines Browser-Spiel lässt sich nie vollständig gegen Cheats absichern. Das ist bewusst akzeptiert.
- Der Server prüft die Plausibilität: Ist der Score für diese Spielzeit überhaupt möglich (maximale theoretische Rate)?
- Rate-Limit: höchstens 1 Submit pro Minute je `ip_hash`.
- Namensfilter: Schimpfwort- und Blockliste, keine URLs.
- Admins können Einträge per `wrangler d1 execute` löschen.

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

Eine Parodie auf ein Behörden-Intranet mit übertriebener Bürokratie.
- **Login-Seite (Fake):** Benutzername und Passwort werden **nicht** übertragen und nicht gespeichert. Jede Eingabe führt zu „Zugang gewährt. Wir wussten ohnehin, dass Sie es sind.“ Es gibt **kein echtes Formular**, das irgendwohin sendet.
- **Stellenangebote:** „Reptiloid (m/w/d) in Teilzeit“, „Chemtrail-Pilot:in mit Lavendel-Erfahrung“, „Sachbearbeiter:in Bielefeld-Leugnung“.
- **Rundschreiben:** „Dienstanweisung 5G/2026-17: Masten sind ab sofort als Tannen zu tarnen.“
- **Kantinenplan:** „Montag: Mikrochip-Suppe. Dienstag: Gedankenstrom-Auflauf.“
- **Organigramm** mit absurden Abteilungen.
- Mit dem Spiel verknüpft: Achievements schalten Portal-Inhalte frei, z. B. eine „Beförderungsurkunde“ als teilbares Bild.

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

1. **GitHub:** privates oder öffentliches Repository, Push auf `main`
2. **Cloudflare Pages:** mit dem GitHub-Repo verbinden. Build-Befehl: keiner. Ausgabeordner: `/`. Jeder Push deployt automatisch, Branches erhalten Preview-URLs.
3. **D1:** Datenbank `sendemast-db` anlegen, Migration ausführen und in den Pages-Einstellungen binden (`DB`)
4. **Domain:** `5gsendemast.de` in Cloudflare als Zone hinzufügen und **die Nameserver bei CheckDomain** auf die beiden Cloudflare-Nameserver umstellen
5. In Pages die Custom Domains `5gsendemast.de` und `www.5gsendemast.de` hinzufügen, mit Weiterleitung von www auf die Hauptdomain
6. HTTPS (automatisch) prüfen und „Always Use HTTPS“ aktivieren
7. Vorhandene DNS-Einträge (z. B. E-Mail/MX bei CheckDomain) **vor** dem Nameserver-Wechsel in Cloudflare übernehmen

---

## 12. Meilensteine

| # | Meilenstein | Ergebnis |
|---|---|---|
| M0 ✅ | Konzept | Dieses Dokument, Mockups, Stil-Entscheidung |
| M1 ✅ | Spielkern | Klicken, Anlagen 1–8, Speichern, Zahlenformat, Ticker (statische Karte) |
| M2 ✅ | Karte | Bundesländer-SVG, Masten platzieren, Kontrolle, Übernahme-Effekte |
| M3 ✅ (Basis) | Würze | Upgrades, Aluhutträger, Goldener Mast, Achievements, Offline-Fortschritt. Offen: Aluhut-Demo, Wünschelruten-Trupp, Synergie- und Bundesland-Upgrades, mehr News |
| M4 ✅ | Eskalation | Phasen 2–5 mit eigenen Karten, Prestige mit Tränen und Patenten (08.11.2026) |
| M5 (teilweise) | Seiten | ✅ Geheimakte (11 Akten, 19 geprüfte Quellen, Stand 07.11.2026). Offen: Portal, Impressum/Datenschutz ausfüllen |
| M6 | Online | Bestenliste (Functions + D1), Teilen, OG-Bild |
| M7 | Launch | Hosting, Domain, Balancing-Feinschliff, Mobile-Test |

---

## 13. Offene Entscheidungen

- [x] **Artstil:** A – Geheimbehörde-Terminal (entschieden 07.11.2026)
- [ ] Endgültiger Spielname („Projekt Sendemast“?)
- [x] Score-Basis der Bestenliste: **kontrollierte Menschen** (höchster je erreichter Wert, über Prestige hinweg kumuliert)
- [x] Repository: **öffentlich**
- [x] E-Mail läuft über die Domain bei CheckDomain → MX/TXT-Einträge beim DNS-Umzug (M7) unbedingt übernehmen
