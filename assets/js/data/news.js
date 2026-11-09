// News-Ticker. when(s, d) optional – Meldung erscheint nur, wenn true.
// fact: true → echte Info, verlinkt auf die Geheimakte.
// ctrl: nur in Phase 1 (Deutschland). Spätere Phasen haben eigene Meldungen über `phase`.
const ctrl = (n) => (s, d) => s.phase === 1 && d.controlled >= n;
const phase = (p, n = 0) => (s, d) => s.phase === p && d.controlled >= n;
const from = (p) => (s) => s.phase >= p;
const has = (id, n = 1) => (s) => (s.owned[id] || 0) >= n;

export const NEWS = [
  // Anfang
  { text: 'Anwohner in Wanne-Eickel melden seltsames Kribbeln. Ursache: Sprudelwasser.' },
  { text: 'Telegram-Gruppe „Wahrheitsfunk“ entdeckt Mast in Wanne-Eickel – Aluhut-Absatz +300 %.' },
  { text: 'Bielefeld weiterhin nicht auffindbar. Behörden zucken mit den Schultern.' },
  { text: 'Oma Gisela (84) empfängt jetzt Radio über ihre Plomben. „Endlich wieder Schlager“, sagt sie.' },
  { text: 'BAfG-Pressesprecher: „Es gibt keine Bundesanstalt für Gedankenfunk.“ Er wirkte dabei sehr überzeugend.' },
  { text: 'Studie: 9 von 10 Tauben sind Drohnen. Die zehnte ist Beamter auf Probe.' },
  { text: 'Heilpraktiker verkauft Orgonit gegen Funkwellen. Funkwellen zeigen sich unbeeindruckt.' },
  { text: 'Mann wickelt Router in Alufolie. WLAN weg, Gedanken immer noch da. Verdächtig.' },
  { text: 'Neuer Bestseller: „Was SIE dir über 5G nicht sagen“ – 300 Seiten, davon 280 Großbuchstaben.' },
  { text: 'Bürger:innen-Initiative fordert Funkmast-freie Zone. Treffen per Videocall vereinbart.' },
  { text: 'Wünschelrutengänger findet Wasserader, Erdstrahlen und einen verlorenen Autoschlüssel.' },
  { text: 'Kreisverwaltung lehnt Bauantrag für Mast ab. Mast steht trotzdem. Akte nicht auffindbar.' },
  { text: 'Influencer verkauft „Anti-5G-Sticker“ fürs Handy. Handy funkt weiter. Influencer auch.' },
  { text: 'Kühe in Ostwestfalen geben neuerdings Milch mit Empfangsbalken.', when: has('mast', 10) },
  { text: 'Getarnte Tanne von Förster umarmt. Förster seitdem auffällig gut gelaunt.', when: has('tanne') },
  { text: 'Pfarrer wundert sich über volle Gottesdienste. Kirchturm-Sender läuft auf Hochtouren.', when: has('kirche') },
  { text: 'Windrad dreht sich bei Windstille. Ingenieure: „Das ist völlig normal.“ Sie lügen.', when: has('windrad') },
  { text: 'Toaster in Gelsenkirchen toastet das Wort „GEHORCHE“ ins Brot. Hersteller: Einzelfall.', when: has('toaster') },
  { text: 'Himmel über Kassel duftet nach Lavendel. Imker begeistert.', when: has('chemtrail') },
  { text: 'Rechenzentrum meldet Raumtemperatur von 38 °C. Mitarbeitende sonnen sich auf Heizsteinen.', when: has('reptil') },
  { text: 'Bielefeld plötzlich auf Google Maps sichtbar. Experten ratlos.', when: has('haarp') },
  { text: 'Stadtrat Bielefeld: „Wir haben schon immer existiert.“ Niemand glaubt ihm.', when: has('haarp') },

  // Fortschritt
  { text: 'Erste Dörfer melden: Alle denken plötzlich gleichzeitig an Mittagessen.', when: ctrl(1e4) },
  { text: 'Umfrage: 73 % der Kontrollierten sind „eigentlich ganz zufrieden“.', when: ctrl(1e5) },
  { text: 'Aluhut-Preise steigen. Alufolie bei Discountern ausverkauft.', when: ctrl(5e5) },
  { text: 'Talkshow zum Thema „Funkkontrolle“ – alle Gäste stimmen sich gegenseitig zu. Seltsam.', when: ctrl(1e6) },
  { text: 'Bundesweit gleichzeitig Lust auf Döner. Imbissbuden überlastet.', when: ctrl(5e6) },
  { text: 'Autobahn-Staus lösen sich auf: Alle fahren plötzlich im Reißverschlussverfahren.', when: ctrl(1e7) },
  { text: 'Deutsche Bahn erstmals pünktlich. BAfG dementiert jede Beteiligung.', when: ctrl(2e7) },
  { text: 'Finanzamt meldet: Steuererklärungen werden jetzt freiwillig früher abgegeben.', when: ctrl(3e7) },
  { text: 'Fußball-Stammtisch einigt sich zum ersten Mal auf eine Aufstellung.', when: ctrl(4e7) },
  { text: 'Nachbarschaftsstreit um Gartenzwerge beigelegt. Beide Seiten „wissen nicht, warum“.', when: ctrl(5e7) },
  { text: 'Telegram-Gruppen schrumpfen. Mitglieder schreiben: „Kein Bock mehr, geh lieber raus.“', when: ctrl(6e7) },
  { text: 'Letzte funkfreie Zone Deutschlands entdeckt: der Keller von Detlef (57).', when: ctrl(8e7) },

  // Phase 2: Europa
  { text: 'Brüssel prüft Funkkontrolle. Prüfung dauert voraussichtlich bis 2061.', when: phase(2) },
  { text: 'Neue EU-Norm: Gedanken müssen künftig mit USB-C empfangen werden.', when: phase(2) },
  { text: 'Österreich lehnt Funkkontrolle ab. Schmäh-Filter blockiert Signal zu 40 %.', when: phase(2) },
  { text: 'Schweiz bleibt neutral. Auch gegenüber Funkwellen. Vor allem gegenüber Funkwellen.', when: phase(2) },
  { text: 'Französische Masten streiken. Forderung: 35-Stunden-Woche für Funkwellen.', when: phase(2) },
  { text: 'Britische Masten senden ab sofort auf der linken Frequenzseite.', when: phase(2) },
  { text: 'Italienische Masten senden nur mit Handgesten. Reichweite trotzdem hervorragend.', when: phase(2) },
  { text: 'Vatikan prüft, ob Gedankenfunk als Wunder anerkannt werden kann.', when: phase(2) },
  { text: 'Eurovision Song Contest: Alle Länder vergeben 12 Punkte an die BAfG.', when: phase(2, 4e8) },
  { text: 'Skandinavische Masten jetzt mit Möbelhaus-Bauanleitung. Ein Sechskantschlüssel fehlt.', when: phase(2) },
  // Phase 3: Welt
  { text: 'UN-Vollversammlung stimmt einstimmig zu. Niemand weiß, wofür.', when: phase(3) },
  { text: 'Pinguine in der Antarktis beantragen Funkanschluss. Antrag liegt in Bielefeld.', when: phase(3) },
  { text: 'Amazonas-Papageien wiederholen jetzt BAfG-Pressemitteilungen.', when: phase(3) },
  { text: 'Kängurus hüpfen im Takt der Trägerfrequenz. Biologen sprechen von Zufall.', when: phase(3) },
  { text: 'Kreuzfahrtschiff meldet: Auf offener See endlich keine Telegram-Gruppen mehr.', when: phase(3) },
  { text: 'Neuer Weltrekord: 7 Mrd. Menschen denken gleichzeitig an Pizza.', when: phase(3, 5e9) },
  // Phase 4: Orbit & Mond
  { text: 'Mondkälber muhen erstmals in Stereo.', when: phase(4) },
  { text: 'ISS-Crew bittet um Funkpause. Die BAfG sendet stattdessen Fahrstuhlmusik.', when: phase(4) },
  { text: 'Satellit verliebt sich in Wettersatellit. Prognose: wolkig mit Schmetterlingen.', when: phase(4) },
  { text: 'Marsrover findet Spuren von Aluhüten. NASA-ähnliche Behörde: „Bitte keine Fragen.“', when: phase(4) },
  { text: 'Mond-Sendemast erklärt endlich die Gezeiten. Ozeanograph:innen sind beleidigt.', when: has('mond') },
  // Phase 5: Universum
  { text: 'Aliens beschweren sich über Roaming-Gebühren in der Milchstraße.', when: phase(5) },
  { text: 'Andromeda antwortet auf die Funkanfrage. Die Antwort kommt in 2,5 Mio. Jahren.', when: phase(5) },
  { text: 'Schwarzes Loch verschluckt Funksignal. Signal meldet sich vom anderen Ende.', when: phase(5) },
  { text: 'Intergalaktischer Aluhut-Kongress tagt. Thema: „Ist die BAfG real?“ Ergebnis: Ja.', when: phase(5) },
  { text: 'Bielefeld-Nebel entdeckt. Astronom:innen sind sich einig: Gibt es nicht.', when: phase(5) },
  { text: 'Quantenturm sendet Antwort, bevor jemand fragt. Die Frage war: „Warum?“', when: has('quant') },
  // Prestige
  { text: 'Menschheit per Software-Update zurückgesetzt. Changelog: „Fehlerbehebungen und Leistungsverbesserungen“.', when: (s) => s.prestiges >= 1 },
  { text: 'Erinnerungen an die Weltherrschaft? Alles nur ein Traum. Die Aluhut-Tränen sind aber echt.', when: (s) => s.prestiges >= 1 },

  // Aluhut & Events
  { text: 'Aluhutträger verlangt Beweise. Bekommt Beweise. Verlangt neue Beweise.', when: (s) => s.aluhutConverted >= 1 },
  { text: 'Ehemaliger Aluhutträger: „Das Gratis-WLAN war einfach zu gut.“', when: (s) => s.aluhutConverted >= 5 },
  { text: 'Goldener Mast gesichtet! Augenzeuge: „Er funkelte so… harmlos.“', when: (s) => s.goldenClicked >= 1 },
  { text: 'Telegram-Influencer startet Spendenaktion für „Strahlenschutz-Bunker“. Bunker = Gartenhäuschen.', when: (s, d) => d.rawCps >= 500 },
  { text: 'Aluhut-Demo angemeldet. Motto: „Wir sind das Funkloch!“ Teilnehmer: fünf. Plakate: zwölf.', when: (s, d) => d.rawCps >= 2e4 },
  { text: 'Demo-Teilnehmer verabreden sich per Messenger, um gegen Funkwellen zu protestieren. Die Nachricht kam pünktlich an.', when: (s) => s.demosDissolved >= 1 },
  { text: 'Polizeibericht: Aluhut-Demo löste sich friedlich auf. Grund: Das Gratis-WLAN am Bahnhof.', when: (s) => s.demosDissolved >= 3 },
  { text: 'Wünschelruten-Trupp meldet Strahlung im Stadtpark. Es war ein Hydrant.', when: (s, d) => d.rawCps >= 3000 },
  { text: 'Wünschelruten-Trupp findet Wasserader, Erdstrahlen und drei verlorene Autoschlüssel. Masten: keine.', when: (s) => s.truppsCaught >= 1 },
  { text: 'Neue Wünschelrute „Pro 5G Edition“ für 399 €. Besteht aus zwei Kleiderbügeln.', when: (s) => s.truppsCaught >= 3 },
  { text: 'Kirchengemeinde verwundert: Die Tanne im Altarraum hat jetzt Empfangsbalken.', when: (s) => s.upgrades.includes('syn_kirche_tanne') },
  { text: 'Bundesrat einstimmig: Alle 16 Länder senden jetzt im Gleichtakt. Erstmals seit 1949.', when: (s) => s.upgrades.filter((u) => u.startsWith('land_')).length >= 16 },

  // Fakten (echt!)
  { fact: true, text: 'Geheimakte: 5G nutzt Radiowellen – dieselbe Art Strahlung wie Radio, WLAN und LTE.', href: '/geheimakte/#was-ist-5g' },
  { fact: true, text: 'Geheimakte: Mobilfunkstrahlung ist nicht-ionisierend. Sie hat zu wenig Energie, um DNA zu schädigen.', href: '/geheimakte/#keine-gedanken' },
  { fact: true, text: 'Geheimakte: Die Grenzwerte in Deutschland liegen weit unter der Schwelle, ab der Gewebe merklich erwärmt wird.', href: '/geheimakte/#grenzwerte' },
  { fact: true, text: 'Geheimakte: Die meiste Strahlung bekommst du von deinem eigenen Handy am Ohr – nicht vom Mast.', href: '/geheimakte/#mehr-masten' },
  { fact: true, text: 'Geheimakte: Je besser der Empfang, desto weniger Leistung muss dein Handy senden.', href: '/geheimakte/#mehr-masten' },
  { fact: true, text: 'Geheimakte: Viren verbreiten sich nicht über Funkwellen. Wirklich nicht.', href: '/geheimakte/#corona' },
  { fact: true, text: 'Geheimakte: „Anti-5G“-Anhänger waren teils selbst radioaktiv – 5G ist es nicht.', href: '/geheimakte/#aluhut-industrie' },
  { fact: true, text: 'Geheimakte: Eine WHO-Studienauswertung (2024) fand keinen Zusammenhang zwischen Handys und Hirntumoren.', href: '/geheimakte/#krebs' },
  { fact: true, text: 'Geheimakte: Wo Sendeanlagen stehen, zeigt die echte EMF-Datenbank der Bundesnetzagentur.', href: '/geheimakte/#masten-karte' },
];
