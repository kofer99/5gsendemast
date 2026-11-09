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
| `ip_hash` | SHA-256(IP + Tagesdatum + geheimes Salz), auf 128 Bit gekürzt | **pseudonym, nicht anonym** (siehe unten) |
| `created_at`, `updated_at` | Zeitpunkte | allein keiner |

**Warum `ip_hash` nicht anonym ist:** Es gibt nur rund 4 Mrd. IPv4-Adressen. Wer das Salz und das Datum kennt, kann alle Adressen durchrechnen und die IP zurückgewinnen. Das tägliche Wechseln verhindert nur das Verknüpfen über mehrere Tage.

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
| `sendemast.portal.seen` | welche Rundschreiben im Portal gelesen wurden | **Komfort** – siehe offene Maßnahme 4 |

Nach § 25 TDDDG (früher TTDSG) ist das Speichern auf dem Gerät ohne Einwilligung erlaubt, wenn es für den gewünschten Dienst unbedingt erforderlich ist. Für den Spielstand ist das klar, für reine Komfort-Funktionen nicht.

Das Portal-Login speichert **keine** Eingaben: kein Formular, keine Übertragung, die Felder werden sofort geleert (geprüft in `tests/e2e-portal.html`).

## 4. Offene Maßnahmen (noch nicht umgesetzt)

Mit allen vier Punkten wäre die Datenbank nach spätestens einem Tag praktisch frei von Personenbezug, und es bräuchte keinen Einwilligungs-Banner.

- [ ] **`ip_hash` nach 24 Stunden löschen.** Er wird nur für das Rate-Limit gebraucht, das höchstens einen Tag zurückschaut. Umsetzung: Bei jeder Meldung `UPDATE scores SET ip_hash = '' WHERE updated_at < now - 86400`. Rate-Limit-Prüfungen ignorieren leere Werte.
- [ ] **IP vor dem Hashen kürzen:** bei IPv4 nur die ersten drei Blöcke, bei IPv6 die ersten 48 Bit (wie bei Matomo). Das Zurückrechnen führt dann nur noch auf ein Netz mit vielen Anschlüssen. Nachteil: Nutzer:innen im selben Netz teilen sich das Rate-Limit (bei 1/Minute unkritisch).
- [ ] **Hinweis beim Eintragen:** „Bitte nicht den echten Namen verwenden.“
- [ ] **`sendemast.portal.seen` nur für die Sitzung speichern** (sessionStorage) oder ganz weglassen. Dann ist jeder Browser-Speicher „unbedingt erforderlich“.

## 5. Was in die Datenschutzerklärung muss (Checkliste)

- [ ] Verantwortliche:r (Name, Anschrift, E-Mail) – gleiche Angaben wie im Impressum
- [ ] Hosting durch Cloudflare: welche Daten, Zweck, Rechtsgrundlage, Drittlandübermittlung, Auftragsverarbeitung
- [ ] Bestenliste: Daten aus Abschnitt 2, Zweck, Freiwilligkeit, Speicherdauer (bis „Austragen“; `ip_hash` 24 h, sobald Maßnahme 1 umgesetzt ist), Löschmöglichkeit
- [ ] Browser-Speicher aus Abschnitt 3, Hinweis auf § 25 TDDDG
- [ ] Keine Cookies, kein Tracking, keine Analyse, keine externen Schriften
- [ ] Rechte der Betroffenen (Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Beschwerde bei der Aufsichtsbehörde)
- [ ] Rechtsgrundlagen klären (Hosting vermutlich Art. 6 Abs. 1 lit. f, Bestenliste lit. a oder f) – **bitte fachkundig prüfen lassen**
- [ ] Stand/Datum der Erklärung

## Hinweis zur Veröffentlichung

Solange die Seite mit `pages_build_output_dir = "."` ausgeliefert wird, ist auch diese Datei öffentlich erreichbar (`/DATENSCHUTZ-NOTIZEN.md`). Bei einem öffentlichen Repo ist das unkritisch – sie enthält keine Geheimnisse.
