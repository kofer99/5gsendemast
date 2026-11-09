# Datenschutz – interne Notizen

> Technische Bestandsaufnahme (Stand 09.11.2026) als Grundlage für die Datenschutzerklärung unter `/datenschutz/`.
> **Keine Rechtsberatung.** Die eigentliche Erklärung bitte mit einem Generator (z. B. eRecht24) oder fachkundiger Hilfe erstellen und die Rechtsgrundlagen dort klären.

## Kurzfassung

Die Seite ist sehr sparsam: keine Accounts, keine E-Mail, kein Tracking, keine Werbung, keine Cookies, keine Klar-IPs in der Datenbank. **Ganz ohne personenbezogene Daten geht es trotzdem nicht.** Nach DSGVO fallen an:

1. **IP-Adressen beim Seitenaufruf** – unvermeidbar, verarbeitet vom Hoster Cloudflare (Server-Logs, Schutz vor Angriffen).
2. **Pseudonyme Daten in der Bestenliste** – nur bei Spieler:innen, die sich aktiv eintragen.
3. **Daten im Browser (localStorage)** – bleiben auf dem Gerät, werden nicht übertragen.

## 1. Hosting (alle Besucher:innen)

| Was | Wer | Hinweis |
|---|---|---|
| IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser-Kennung | Cloudflare (Pages, CDN) | Wie bei jeder Website. In der Erklärung Cloudflare als Hoster nennen, Vertrag zur Auftragsverarbeitung (DPA) von Cloudflare akzeptieren, Datenübermittlung in die USA erwähnen (Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert – vor Veröffentlichung prüfen). |

Die Seite lädt **keine externen Inhalte**: Schriften liegen auf dem eigenen Server, keine Google Fonts, keine CDNs, keine Analyse-Werkzeuge.

## 2. Bestenliste (nur nach „Eintragen“)

Gespeichert in Cloudflare D1 (Tabelle `scores`, siehe `migrations/0001_init.sql`):

| Feld | Inhalt | Personenbezug |
|---|---|---|
| `name` / `name_key` | selbst gewählter Spitzname | möglich, wenn jemand seinen echten Namen einträgt |
| `run_id` | Zufallskennung des Spielstands (24 Hex-Zeichen) | pseudonym (gehört zu einem Gerät) |
| `score`, `fp_all`, `phase`, `playtime` | Spielwerte | allein keiner |
| `ip_hash` | SHA-256(**gekürzte** IP + Tagesdatum + geheimes Salz), auf 128 Bit gekürzt, **nach 24 h gelöscht** | für 24 h pseudonym (siehe unten), danach leer |
| `created_at`, `updated_at` | Zeitpunkte | allein keiner |

**Warum `ip_hash` nicht ganz anonym ist:** Wer Salz und Datum kennt, könnte alle Netze durchrechnen. Weil vorher gekürzt wird (IPv4: nur die ersten drei Blöcke, IPv6: die ersten 48 Bit), führt das aber nur auf ein Netz mit vielen Anschlüssen, nie auf eine einzelne IP. Nach 24 Stunden wird der Wert gelöscht (`IP_HASH_TTL`, bei jeder neuen Meldung).

**Zweck:** Rangliste anzeigen; `ip_hash` nur gegen Spam (höchstens 1 Meldung pro Minute, 5 neue Einträge pro Tag je Anschluss).
**Öffentlich sichtbar:** nur Spitzname, Bestwert, Phase, Gesamt-FP, Zeitpunkt. `run_id` und `ip_hash` werden nie ausgeliefert.
**Löschen:** „Austragen“ auf `/bestenliste/` löscht den Eintrag sofort (`DELETE /api/score`). Sonst per Hand über die D1-Konsole.
**Freiwilligkeit:** Ohne Klick auf „Eintragen“ sendet das Spiel nichts an den Server.

## 3. Browser-Speicher (localStorage / sessionStorage)

| Schlüssel | Inhalt | Nötig? |
|---|---|---|
| `sendemast.save` | Spielstand | ja – ohne ihn kein Spiel (unbedingt erforderlich) |
| `sendemast.lb` | nur der Spitzname für die Bestenliste | ja, nach aktivem Eintragen |
| `sendemast.portal.session` (sessionStorage) | nur „angemeldet: ja“ im Portal, weg beim Schließen des Tabs | ja, für die gewünschte Funktion |
| `sendemast.portal.seen` (sessionStorage) | welche Rundschreiben im Portal gelesen wurden, weg beim Schließen des Tabs | ja, für die gewünschte Funktion (nur Sitzung) |

Nach § 25 TDDDG (früher TTDSG) ist das Speichern auf dem Gerät ohne Einwilligung erlaubt, wenn es für den gewünschten Dienst unbedingt erforderlich ist. Für den Spielstand ist das klar, für reine Komfort-Funktionen nicht.

Das Portal-Login speichert **keine** Eingaben: kein Formular, keine Übertragung, die Felder werden sofort geleert (geprüft in `tests/e2e-portal.html`).

## 4. Umgesetzte Maßnahmen (09.11.2026)

Damit ist die Datenbank nach spätestens einem Tag praktisch frei von Personenbezug (außer jemand wählt seinen echten Namen als Spitznamen), und es braucht keinen Einwilligungs-Banner.

- [x] **`ip_hash` nach 24 Stunden löschen:** Bei jeder Meldung `UPDATE scores SET ip_hash = '' WHERE updated_at < jetzt − 24 h`. Leere Werte zählen fürs Rate-Limit nicht. Hinweis: Gelöscht wird nur, wenn überhaupt jemand meldet. Kommt tagelang keine Meldung, bleiben die letzten Prüfsummen so lange stehen (sie sind aber ohnehin nur auf Netze rückführbar).
- [x] **IP vor dem Hashen kürzen:** IPv4 auf die ersten drei Blöcke, IPv6 auf die ersten 48 Bit (`anonymizeIp` in `functions/_lib/handlers.js`). Nutzer:innen im selben Netz teilen sich das Rate-Limit (bei 1 Meldung pro Minute unkritisch).
- [x] **Hinweis beim Eintragen:** „Bitte nicht den echten Namen verwenden. Der Spitzname ist öffentlich sichtbar.“
- [x] **`sendemast.portal.seen` nur für die Sitzung** (sessionStorage).

Getestet: `tests/index.html` (Kürzen, Löschen nach 24 h), `python tools/check_sql.py` (SQL des Löschens).

## 5. Was in die Datenschutzerklärung muss (Checkliste)

- [ ] Verantwortliche:r (Name, Anschrift, E-Mail) – gleiche Angaben wie im Impressum
- [ ] Hosting durch Cloudflare: welche Daten, Zweck, Rechtsgrundlage, Drittlandübermittlung, Auftragsverarbeitung
- [ ] Bestenliste: Daten aus Abschnitt 2, Zweck, Freiwilligkeit, Speicherdauer (bis „Austragen“; `ip_hash` höchstens etwa 24 h), Löschmöglichkeit
- [ ] Browser-Speicher aus Abschnitt 3, Hinweis auf § 25 TDDDG
- [ ] Keine Cookies, kein Tracking, keine Analyse, keine externen Schriften
- [ ] Rechte der Betroffenen (Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Beschwerde bei der Aufsichtsbehörde)
- [ ] Rechtsgrundlagen klären (Hosting vermutlich Art. 6 Abs. 1 lit. f, Bestenliste lit. a oder f) – **bitte fachkundig prüfen lassen**
- [ ] Stand/Datum der Erklärung

## Hinweis zur Veröffentlichung

Solange die Seite mit `pages_build_output_dir = "."` ausgeliefert wird, ist auch diese Datei öffentlich erreichbar (`/DATENSCHUTZ-NOTIZEN.md`). Bei einem öffentlichen Repo ist das unkritisch – sie enthält keine Geheimnisse.
