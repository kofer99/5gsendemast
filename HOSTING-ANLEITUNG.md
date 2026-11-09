# Hosting vorbereiten – Schritt für Schritt

> Stand 09.11.2026. Ziel: alle Konten und die Datenbank anlegen, **ohne dass die Seite schon live geht**.
> Hosting: **Cloudflare Pages** (kostenlos). GitHub dient nur als Ablage für den Code – Cloudflare holt ihn sich von dort. GitHub Pages wird **nicht** verwendet.
> Die Menüs bei GitHub und Cloudflare ändern sich gelegentlich; Bezeichnungen können leicht abweichen.

Kosten: 0 € (abgesehen von der Domain). Pages, Functions und D1 sind im kostenlosen Tarif enthalten, ein privates GitHub-Repo ebenfalls.

---

## 1. GitHub

1. Konto anlegen bzw. vorhandenes nutzen (Git-Name `kofer99`) und **Zwei-Faktor-Anmeldung** einschalten.
2. Neues Repository anlegen, z. B. `5gsendemast`:
   - Sichtbarkeit vorerst **Private** (öffentlich stellen geht später mit einem Klick).
   - **Keine** README, .gitignore oder Lizenz anlegen lassen – sonst gibt es beim ersten Push einen Konflikt.
3. Am Rechner einmal bei GitHub anmelden: am einfachsten über **GitHub Desktop** (ist installiert) oder per `gh auth login`, falls die GitHub-CLI installiert ist.
4. → **Claude die Repo-Adresse schicken.** Claude richtet das Remote ein und pusht.

## 2. Cloudflare-Konto

1. Auf cloudflare.com ein kostenloses Konto anlegen.
2. **Zwei-Faktor-Anmeldung** einschalten.

## 3. D1-Datenbank (ist danach von außen nicht erreichbar)

1. Dashboard → **Storage & Databases → D1 → Create database**.
   - Name: `sendemast-db`
   - Region: Europa, falls angeboten
2. Datenbank öffnen → **Console** → Inhalt von `migrations/0001_init.sql` einfügen und ausführen.
3. Die **Database ID** kopieren.
4. → **Claude die Database ID schicken.** Sie kommt in `wrangler.toml` (kein Geheimnis).

## 4. Domain vorbereiten – Nameserver noch NICHT umstellen

> ✅ 09.11.2026: Zone in Cloudflare angelegt, DNS-Einträge abgeglichen und **Nameserver bereits auf Cloudflare umgestellt**. E-Mail über die Domain wird nicht gebraucht, die MX-Einträge sind daher egal. DNSSEC war nicht aktiv (gut so).

1. Cloudflare → **Add a site / Domain hinzufügen** → `5gsendemast.de`, kostenloser Tarif.
2. Cloudflare liest die vorhandenen DNS-Einträge ein. **Mit CheckDomain vergleichen**, besonders:
   - **MX-Einträge** (E-Mail-Empfang)
   - **TXT-Einträge**: SPF, DKIM, DMARC (E-Mail-Versand)
   - Fehlende Einträge in Cloudflare von Hand nachtragen.
3. Cloudflare zeigt zwei Nameserver an. **Noch nicht bei CheckDomain eintragen!** Solange das nicht passiert, ändert sich an Website und E-Mail nichts – die Zone steht nur als „Pending“ bereit.
4. Tipp: Jetzt schon **Screenshots aller DNS-Einträge bei CheckDomain** als Sicherung machen.

## 5. Pages-Projekt – erst beim Live-Gang anlegen

> ✅ 09.11.2026: Pages-Projekt `sendemast` angelegt, läuft unter https://sendemast.pages.dev und https://5gsendemast.de. Datenbank verbunden.
>
> **Stolperfalle:** Unter „Workers & Pages → Erstellen“ landet man standardmäßig bei **Workers**. Erkennbar am Feld „Deploy command: npx wrangler deploy“ und am Build-Fehler „Missing entry-point to Worker script“. Richtig ist der Reiter bzw. Link **Pages** → „Connect to Git“. Dort gibt es nur „Framework preset“, „Build command“ und „Build output directory“.

Sobald ein Pages-Projekt mit GitHub verbunden ist, ist die Seite **sofort öffentlich** unter `<name>.pages.dev` erreichbar, auch ohne eigene Domain. Deshalb erst anlegen, wenn Impressum und Datenschutzerklärung fertig sind.

Falls doch schon vorher:
- Beim Anlegen als Produktions-Branch einen noch nicht existierenden Branch angeben (z. B. `live`). Dann entstehen nur Vorschau-Versionen – deren Adressen sind zufällig, aber ebenfalls öffentlich.
- Zusätzlich unter **Settings → Access policy** den Zugriff auf die eigene E-Mail-Adresse beschränken (Cloudflare Zero Trust, bis 50 Nutzer kostenlos).

**Einstellungen beim Anlegen (später):**

| Einstellung | Wert |
|---|---|
| Quelle | GitHub-Repo `5gsendemast` |
| Framework preset | None |
| Build command | *(leer)* |
| Build output directory | `/` |
| Produktions-Branch | `main` (bzw. vorerst `live`, siehe oben) |
| D1-Binding | Variable `DB` → Datenbank `sendemast-db` |
| Secret (verschlüsselt) | `IP_SALT` = lange Zufallszeichenkette (z. B. 40+ Zeichen aus einem Passwortgenerator) |

## 6. Live-Gang (später, nicht jetzt)

1. Impressum und Datenschutzerklärung mit eigenen Daten fertigstellen (siehe `DATENSCHUTZ-NOTIZEN.md`).
2. Pages-Projekt anlegen (Schritt 5) bzw. Produktions-Branch auf `main` umstellen und Access-Schutz entfernen.
3. Unter `<name>.pages.dev` testen: Spiel, Bestenliste (Eintragen, Austragen), Portal, Geheimakte.
4. In Pages → **Custom domains**: `5gsendemast.de` und `www.5gsendemast.de` hinzufügen, Weiterleitung www → Hauptdomain.
5. ~~Nameserver bei CheckDomain umstellen~~ (bereits am 09.11.2026 erledigt). Die alten Einträge für `@` und `www` (CheckDomain-Parkseite, `88.99.101.251`) werden beim Verbinden der Custom Domain ersetzt.
6. Prüfen, dass `https://5gsendemast.de` die Seite zeigt. Dann „Always Use HTTPS“ aktivieren.

---

## Was Claude von dir braucht

- [x] GitHub-Repo-Adresse: https://github.com/kofer99/5gsendemast (gepusht am 09.11.2026)
- [x] D1 Database ID: `457a9e47-b0ac-480d-a30b-d07c81f4a698` (in `wrangler.toml`, Tabelle `scores` angelegt am 09.11.2026)

Weitere Details: `DESIGN.md` §5 (Bestenliste) und §11 (Hosting & Deployment).
