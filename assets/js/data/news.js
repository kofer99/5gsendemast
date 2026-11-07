// News-Ticker. when(s, d) optional – Meldung erscheint nur, wenn true.
// fact: true → echte Info, verlinkt auf die Geheimakte.
const ctrl = (n) => (s, d) => d.controlled >= n;
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

  // Aluhut & Events
  { text: 'Aluhutträger verlangt Beweise. Bekommt Beweise. Verlangt neue Beweise.', when: (s) => s.aluhutConverted >= 1 },
  { text: 'Ehemaliger Aluhutträger: „Das Gratis-WLAN war einfach zu gut.“', when: (s) => s.aluhutConverted >= 5 },
  { text: 'Goldener Mast gesichtet! Augenzeuge: „Er funkelte so… harmlos.“', when: (s) => s.goldenClicked >= 1 },
  { text: 'Telegram-Influencer startet Spendenaktion für „Strahlenschutz-Bunker“. Bunker = Gartenhäuschen.', when: (s, d) => d.rawCps >= 500 },

  // Fakten (echt!)
  { fact: true, text: 'Geheimakte: 5G nutzt Radiowellen – dieselbe Art Strahlung wie Radio, WLAN und LTE.' },
  { fact: true, text: 'Geheimakte: Mobilfunkstrahlung ist nicht-ionisierend. Sie hat zu wenig Energie, um DNA zu schädigen.' },
  { fact: true, text: 'Geheimakte: Die Grenzwerte in Deutschland liegen weit unter der Schwelle, ab der Gewebe merklich erwärmt wird.' },
  { fact: true, text: 'Geheimakte: Die meiste Strahlung bekommst du von deinem eigenen Handy am Ohr – nicht vom Mast.' },
  { fact: true, text: 'Geheimakte: Je besser der Empfang, desto weniger Leistung muss dein Handy senden.' },
  { fact: true, text: 'Geheimakte: Viren verbreiten sich nicht über Funkwellen. Wirklich nicht.' },
  { fact: true, text: 'Geheimakte: Wo Sendeanlagen stehen, zeigt die echte EMF-Datenbank der Bundesnetzagentur.' },
];
