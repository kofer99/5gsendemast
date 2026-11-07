// Erfolge. Jeder Erfolg gibt +1 % FP/Sek. check(s, d) wie bei Upgrades.
const owned = (id, n) => (s) => (s.owned[id] || 0) >= n;
const totalOwned = (s) => Object.values(s.owned).reduce((a, b) => a + b, 0);

export const ACHIEVEMENTS = [
  { id: 'click_1',    name: 'Erster Impuls',                    desc: 'Sende deinen ersten Strahlungsimpuls.',      check: (s) => s.clicks >= 1 },
  { id: 'click_100',  name: 'Fleißige:r Funker:in',             desc: '100 Impulse gesendet.',                       check: (s) => s.clicks >= 100 },
  { id: 'click_1k',   name: 'Sehnenscheidenentzündung im Dienst', desc: '1.000 Impulse gesendet.',                   check: (s) => s.clicks >= 1000 },
  { id: 'click_10k',  name: 'Der Zeigefinger der Macht',        desc: '10.000 Impulse gesendet.',                    check: (s) => s.clicks >= 10000 },

  { id: 'fp_1k',      name: 'Leises Rauschen',                  desc: '1.000 FP insgesamt gefunkt.',                 check: (s) => s.fpAll >= 1e3 },
  { id: 'fp_1m',      name: 'Starkes Signal',                   desc: '1 Mio. FP insgesamt gefunkt.',                check: (s) => s.fpAll >= 1e6 },
  { id: 'fp_1b',      name: 'Volle Balken',                     desc: '1 Mrd. FP insgesamt gefunkt.',                check: (s) => s.fpAll >= 1e9 },
  { id: 'fp_1t',      name: 'Funk-Billionär:in',                desc: '1 Bio. FP insgesamt gefunkt.',                check: (s) => s.fpAll >= 1e12 },

  { id: 'cps_10',     name: 'Es läuft von allein',              desc: '10 FP pro Sekunde.',                          check: (s, d) => d.rawCps >= 10 },
  { id: 'cps_1k',     name: 'Dauersendung',                     desc: '1.000 FP pro Sekunde.',                       check: (s, d) => d.rawCps >= 1e3 },
  { id: 'cps_100k',   name: 'Sendeanstalt des Jahres',          desc: '100.000 FP pro Sekunde.',                     check: (s, d) => d.rawCps >= 1e5 },

  { id: 'mast_1',     name: 'Der erste Mast',                   desc: 'Kaufe einen Kleinen Funkmast.',               check: owned('mast', 1) },
  { id: 'mast_50',    name: 'Mastenwald',                       desc: 'Besitze 50 Kleine Funkmasten.',               check: owned('mast', 50) },
  { id: 'tanne_1',    name: 'Oh Tannenbaum',                    desc: 'Kaufe eine Getarnte Tanne.',                  check: owned('tanne', 1) },
  { id: 'kirche_1',   name: 'Halleluja-Hertz',                  desc: 'Kaufe einen Kirchturm-Sender.',               check: owned('kirche', 1) },
  { id: 'windrad_1',  name: 'Rückenwind',                       desc: 'Kaufe ein Windrad.',                          check: owned('windrad', 1) },
  { id: 'toaster_1',  name: 'Frühstücksfernsehen',              desc: 'Kaufe ein Smart-Toaster-Netz.',               check: owned('toaster', 1) },
  { id: 'chem_1',     name: 'Lavendelhimmel',                   desc: 'Kaufe eine Chemtrail-Staffel.',               check: owned('chemtrail', 1) },
  { id: 'reptil_1',   name: 'Kaltblütig',                       desc: 'Kaufe ein Reptiloiden-Rechenzentrum.',        check: owned('reptil', 1) },
  { id: 'haarp_1',    name: 'Es existiert doch!',               desc: 'Baue die HAARP-Außenstelle in Bielefeld.',    check: owned('haarp', 1) },
  { id: 'build_100',  name: 'Infrastrukturprojekt',             desc: 'Besitze 100 Anlagen insgesamt.',              check: (s) => totalOwned(s) >= 100 },
  { id: 'build_500',  name: 'Schneller als die Deutsche Bahn',  desc: 'Besitze 500 Anlagen insgesamt.',              check: (s) => totalOwned(s) >= 500 },

  { id: 'ctrl_1k',    name: 'Ein ganzes Dorf',                  desc: '1.000 Menschen kontrolliert.',                check: (s, d) => d.controlled >= 1e3 },
  { id: 'ctrl_1m',    name: 'Eine Million Gedanken',            desc: '1 Mio. Menschen kontrolliert.',               check: (s, d) => d.controlled >= 1e6 },
  { id: 'ctrl_10m',   name: 'Zehn Millionen Aluhüte zu wenig',  desc: '10 Mio. Menschen kontrolliert.',              check: (s, d) => d.controlled >= 1e7 },
  { id: 'ctrl_half',  name: 'Die halbe Republik',               desc: 'Die Hälfte Deutschlands kontrolliert.',       check: (s, d) => d.controlled >= 42.3e6 },
  { id: 'ctrl_all',   name: 'Alles unter Kontrolle',            desc: 'Ganz Deutschland kontrolliert.',              check: (s) => s.taken.length >= 16 },

  { id: 'state_1',    name: 'Landnahme',                        desc: 'Übernimm dein erstes Bundesland.',            check: (s) => s.taken.length >= 1 },
  { id: 'state_8',    name: 'Halbzeit im Föderalismus',         desc: 'Übernimm 8 Bundesländer.',                    check: (s) => s.taken.length >= 8 },
  { id: 'state_SL',   name: 'Kleinstaaterei',                   desc: 'Übernimm das Saarland.',                      check: (s) => s.taken.includes('SL') },

  { id: 'alu_1',      name: 'Ein Aluhut weniger',               desc: 'Überzeuge einen Aluhutträger.',               check: (s) => s.aluhutConverted >= 1 },
  { id: 'alu_25',     name: 'WLAN für alle',                    desc: 'Überzeuge 25 Aluhutträger.',                  check: (s) => s.aluhutConverted >= 25 },
  { id: 'alu_100',    name: 'Albtraum der Alufolien-Industrie', desc: 'Überzeuge 100 Aluhutträger.',                 check: (s) => s.aluhutConverted >= 100 },

  { id: 'gold_1',     name: 'Goldkind',                         desc: 'Klicke einen Goldenen Mast.',                 check: (s) => s.goldenClicked >= 1 },
  { id: 'gold_7',     name: 'Glückssträhne',                    desc: 'Klicke 7 Goldene Masten.',                    check: (s) => s.goldenClicked >= 7 },
  { id: 'gold_77',    name: 'Goldgräber:in',                    desc: 'Klicke 77 Goldene Masten.',                   check: (s) => s.goldenClicked >= 77 },
  { id: 'funkloch',   name: 'Funkloch-Überlebende:r',           desc: 'Überstehe ein Funkloch.',                     check: (s) => s.funklochSeen >= 1 },

  { id: 'manual_25',  name: 'Handarbeit',                       desc: 'Platziere 25 Masten von Hand.',               check: (s) => s.manualPlaced >= 25 },
  { id: 'offline_1',  name: 'Die BAfG schläft nie',             desc: 'Kehre zurück und kassiere Offline-Funkpunkte.', check: (s) => s.offlineReturns >= 1 },
  { id: 'time_1h',    name: 'Überstunden',                      desc: 'Spiele eine Stunde lang.',                    check: (s) => s.playtime >= 3600 },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
