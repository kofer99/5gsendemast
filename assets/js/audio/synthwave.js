// Synthwave-Hintergrundmusik, komplett im Browser erzeugt (Web Audio API).
// Keine Audiodateien, keine fremden Samples – die Musik entsteht aus Oszillatoren und Rauschen
// und gehört damit vollständig zum Projekt (keine Lizenzfragen). DESIGN.md §4.15.
//
// Aufbau: 96 BPM, A-Moll, ein Song aus 6 Teilen à 8 Takten (A B A C D B = 48 Takte, ca. 2 Min.),
// danach von vorn. Jeder Teil hat eigene Akkorde, Bass-, Arpeggio- und Drum-Muster; C ist ein Breakdown.
// Intensität 1–5 folgt der Eskalationsphase:
// 1 Pads, Bass, leise Kick und Hi-Hats · 2 + Snare mit Hall, Fills · 3 + Arpeggio mit Echo, Crash
// 4 + volle Kick, 16tel-Hats, offener Filter · 5 + Lead-Melodien.

const BPM = 96;
const STEP = 60 / BPM / 4;          // Sechzehntel in Sekunden
const STEPS_PER_BAR = 16;
const LOOKAHEAD = 0.15;             // so weit im Voraus wird geplant (s)
const TICK_MS = 25;

const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);

// Akkorde: Pad-Voicing (eng geführt), Bass-Grundton, Arpeggio-Töne
const CHORDS = {
  Am: { pad: [57, 60, 64], bass: 33, arp: [69, 72, 76, 81] },
  F:  { pad: [57, 60, 65], bass: 29, arp: [65, 69, 72, 77] },
  C:  { pad: [55, 60, 64], bass: 36, arp: [67, 72, 76, 79] },
  G:  { pad: [55, 59, 62], bass: 31, arp: [67, 71, 74, 79] },
  Em: { pad: [55, 59, 64], bass: 28, arp: [64, 67, 71, 76] },
  E:  { pad: [56, 59, 64], bass: 28, arp: [64, 68, 71, 76] },
  Dm: { pad: [57, 62, 65], bass: 26, arp: [62, 65, 69, 74] },
};

// Arpeggio-Reihenfolgen (Index in chord.arp)
const ARPS = {
  updown: [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 3, 2, 1],
  climb:  [0, 2, 1, 3, 0, 2, 1, 3, 1, 3, 2, 3, 0, 2, 1, 3],
  pulse:  [0, 3, 1, 3, 2, 3, 1, 3, 0, 3, 1, 3, 2, 3, 1, 3],
};

// Lead-Melodien je Teil: [Takt, Schritt, MIDI-Ton, Länge in Schritten]
const LEAD_A = [
  [0, 0, 76, 6], [0, 6, 74, 2], [0, 8, 72, 8],
  [1, 0, 72, 4], [1, 4, 74, 4], [1, 8, 76, 8],
  [2, 0, 79, 6], [2, 6, 76, 2], [2, 8, 74, 8],
  [3, 0, 74, 4], [3, 4, 76, 4], [3, 8, 71, 8],
  [4, 0, 76, 6], [4, 6, 74, 2], [4, 8, 72, 8],
  [5, 0, 72, 4], [5, 4, 74, 4], [5, 8, 77, 8],
  [6, 0, 79, 8], [6, 8, 81, 8],
  [7, 0, 79, 4], [7, 4, 76, 12],
];
const LEAD_B = [
  [0, 0, 72, 4], [0, 4, 74, 4], [0, 8, 76, 8],
  [1, 0, 74, 4], [1, 4, 76, 4], [1, 8, 79, 8],
  [2, 0, 81, 12], [2, 12, 79, 4],
  [3, 0, 76, 16],
  [4, 0, 72, 4], [4, 4, 74, 4], [4, 8, 77, 8],
  [5, 0, 79, 8], [5, 8, 77, 4], [5, 12, 76, 4],
  [6, 0, 76, 8], [6, 8, 79, 8],
  [7, 0, 80, 16],
];
const LEAD_D = [
  [0, 0, 79, 6], [0, 6, 76, 2], [0, 8, 72, 8],
  [1, 0, 74, 6], [1, 6, 71, 2], [1, 8, 67, 8],
  [2, 0, 72, 4], [2, 4, 76, 4], [2, 8, 81, 8],
  [3, 0, 77, 8], [3, 8, 76, 4], [3, 12, 74, 4],
  [4, 0, 79, 6], [4, 6, 76, 2], [4, 8, 72, 8],
  [5, 0, 74, 6], [5, 6, 79, 2], [5, 8, 83, 8],
  [6, 0, 81, 8], [6, 8, 77, 8],
  [7, 0, 76, 8], [7, 8, 80, 8],
];

// Song-Teile. bass: eighth (Achtel mit Oktave) · gallop (16tel-Galopp) · long (lange Töne) · sync (synkopiert)
// drums: full · break (Breakdown: erst nur Hi-Hats, dann Aufbau mit Snare-Wirbel)
const SECTIONS = {
  A: { chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Em'], arp: 'updown', bass: 'eighth', drums: 'full', lead: LEAD_A },
  B: { chords: ['F', 'G', 'Am', 'Am', 'F', 'G', 'C', 'E'], arp: 'climb', bass: 'gallop', drums: 'full', lead: LEAD_B },
  C: { chords: ['Dm', 'Am', 'F', 'G', 'Dm', 'Am', 'F', 'E'], arp: 'pulse', bass: 'long', drums: 'break', lead: null },
  D: { chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'E'], arp: 'updown', bass: 'sync', drums: 'full', lead: LEAD_D },
};
const SONG = ['A', 'B', 'A', 'C', 'D', 'B'];
const BARS_PER_SECTION = 8;
const SONG_STEPS = SONG.length * BARS_PER_SECTION * STEPS_PER_BAR;

const BASS = {
  eighth: (s, lvl) => (s % 2 === 0 ? { oct: lvl >= 2 && s % 4 === 2, len: 1.8, vel: s % 4 === 0 ? 1 : 0.8 } : null),
  gallop: (s) => ([0, 2, 3].includes(s % 4) ? { oct: s % 8 === 3, len: s % 4 === 0 ? 1.8 : 0.9, vel: s % 4 === 0 ? 1 : 0.7 } : null),
  long:   (s) => (s === 0 ? { oct: false, len: 14, vel: 0.8 } : s === 14 ? { oct: true, len: 1.8, vel: 0.6 } : null),
  sync:   (s) => ([0, 3, 6, 8, 10, 11, 14].includes(s) ? { oct: s === 6 || s === 14, len: 1.6, vel: s === 0 || s === 8 ? 1 : 0.75 } : null),
};

export class Synthwave {
  constructor({ volume = 0.5, intensity = 1 } = {}) {
    this.volume = clamp01(volume);
    this.intensity = clampInt(intensity, 1, 5);
    this.ctx = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.wanted = false;   // soll laufen (unabhängig davon, ob der Tab gerade sichtbar ist)
    this.onVisibility = () => this.syncVisibility();
  }

  get playing() { return this.wanted; }

  /** Muss beim ersten Mal aus einer Nutzeraktion heraus aufgerufen werden (Autoplay-Regeln der Browser). */
  async start() {
    this.wanted = true;
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.build(this.ctx, this.ctx.destination);
      document.addEventListener('visibilitychange', this.onVisibility);
    }
    if (this.ctx.state !== 'running') await this.ctx.resume().catch(() => {});
    if (this.ctx.state !== 'running') return false;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(this.targetGain(), t + 1.5);
    if (!this.timer) {
      this.step = 0;
      this.nextTime = t + 0.05;
      this.timer = setInterval(() => this.schedule(), TICK_MS);
    }
    return true;
  }

  stop() {
    this.wanted = false;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.4);
    clearInterval(this.timer);
    this.timer = null;
    setTimeout(() => { if (!this.wanted) this.ctx.suspend().catch(() => {}); }, 500);
  }

  setVolume(v) {
    this.volume = clamp01(v);
    if (this.ctx && this.wanted) this.master.gain.setTargetAtTime(this.targetGain(), this.ctx.currentTime, 0.05);
  }

  setIntensity(n) {
    this.intensity = clampInt(n, 1, 5);
    if (this.ctx) this.pad.filter.frequency.setTargetAtTime(this.padCutoff(), this.ctx.currentTime, 2);
  }

  targetGain() { return this.volume ** 2 * 0.9; } // quadratisch: Regler fühlt sich natürlicher an

  /** Im Hintergrund drosseln Browser Timer – dann lieber pausieren als stottern. */
  syncVisibility() {
    if (!this.ctx || !this.wanted) return;
    if (document.hidden) {
      clearInterval(this.timer);
      this.timer = null;
      this.ctx.suspend().catch(() => {});
    } else {
      this.ctx.resume().then(() => {
        if (!this.timer && this.wanted) {
          this.nextTime = this.ctx.currentTime + 0.05;
          this.timer = setInterval(() => this.schedule(), TICK_MS);
        }
      }).catch(() => {});
    }
  }

  // ---------- Klangerzeugung ----------

  /** Baut Effekte und Busse. ctx kann auch ein OfflineAudioContext sein (Tests). */
  build(ctx, destination) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    this.master.connect(comp).connect(destination);

    this.dry = ctx.createGain();
    this.dry.connect(this.master);

    // Hall: vier parallele Rückkopplungs-Echos mit Tiefpass (Schroeder-Prinzip), wie ein 80er-Hallgerät.
    // Kein ConvolverNode: braucht keinen großen Impuls-Puffer und weniger Rechenleistung.
    this.reverb = ctx.createGain();
    const revOut = ctx.createGain(); revOut.gain.value = 0.32;
    revOut.connect(this.master);
    [0.0445, 0.0557, 0.0617, 0.0656].forEach((time, i) => {
      const d = ctx.createDelay(0.2); d.delayTime.value = time;
      const damp = ctx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 3200 - i * 300;
      const fbk = ctx.createGain(); fbk.gain.value = 0.78;
      this.reverb.connect(d);
      d.connect(damp).connect(fbk).connect(d);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
      if (pan.pan) pan.pan.value = i % 2 ? 0.6 : -0.6;
      damp.connect(pan).connect(revOut);
    });

    // Echo im punktierten Achtel – das typische Synthwave-Arpeggio
    this.delay = ctx.createDelay(2);
    this.delay.delayTime.value = STEP * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2800;
    this.delay.connect(tone).connect(fb).connect(this.delay);
    const delOut = ctx.createGain(); delOut.gain.value = 0.55;
    tone.connect(delOut).connect(this.master);

    // Pad-Bus mit langsam „atmendem“ Tiefpass
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass'; padFilter.Q.value = 2; padFilter.frequency.value = this.padCutoff();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 350;
    lfo.connect(lfoAmt).connect(padFilter.frequency);
    lfo.start();
    const padOut = ctx.createGain(); padOut.gain.value = 1;
    padFilter.connect(padOut);
    padOut.connect(this.dry);
    const padSend = ctx.createGain(); padSend.gain.value = 0.35;
    padOut.connect(padSend).connect(this.reverb);
    this.pad = { filter: padFilter, lfo };

    this.noise = noiseBuffer(ctx);
  }

  padCutoff() { return [0, 900, 1100, 1400, 1900, 2300][this.intensity]; }

  schedule() {
    const ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step = (this.step + 1) % SONG_STEPS;
    }
  }

  /** Spielt alles, was auf einen Sechzehntel-Schritt fällt (step = Position im ganzen Song). */
  playStep(step, t) {
    const lvl = this.intensity;
    const songBar = Math.floor(step / STEPS_PER_BAR) % (SONG.length * BARS_PER_SECTION);
    const sec = SECTIONS[SONG[Math.floor(songBar / BARS_PER_SECTION)]];
    const bar = songBar % BARS_PER_SECTION;   // Takt innerhalb des Teils
    const s = step % STEPS_PER_BAR;
    const chord = CHORDS[sec.chords[bar]];
    const brk = sec.drums === 'break';
    const lastBar = bar === BARS_PER_SECTION - 1;

    // Pads: einmal pro Takt, weich überblendet
    if (s === 0) for (const m of chord.pad) this.padNote(m, t, STEP * STEPS_PER_BAR);

    // Bass nach Muster des Teils
    const b = BASS[sec.bass](s, lvl);
    if (b) this.bassNote(chord.bass + (b.oct ? 12 : 0), t, STEP * b.len, b.vel);

    // Arpeggio ab Stufe 3 (im Breakdown schon ab Stufe 1, dort trägt es den Teil)
    if (lvl >= 3 || brk) this.arpNote(chord.arp[ARPS[sec.arp][s]], t, STEP * 0.9, (s % 4 === 0 ? 1 : 0.75) * (brk && lvl < 3 ? 0.7 : 1));

    // Crash zu Beginn jedes Teils (außer Breakdown)
    if (lvl >= 3 && bar === 0 && s === 0 && !brk) this.crash(t);

    // Drums
    if (brk) {
      // Breakdown: Takt 1–4 nur Hi-Hats, 5–7 halbe Kick, Takt 8 Snare-Wirbel als Aufbau
      if (s % 4 === 2) this.hat(t, 0.7, false);
      if (bar >= 4 && bar < 7 && (s === 0 || s === 8)) this.kick(t, 0.6);
      if (lastBar && lvl >= 2 && (s % 4 === 0 || s >= 8)) this.snare(t, 0.35 + 0.65 * (s / 15));
      return;
    }
    const fullKick = lvl >= 4;
    if (s === 0 || s === 8 || (fullKick && (s === 4 || s === 12))) this.kick(t, fullKick ? 1 : 0.7);
    if (lvl >= 2 && (s === 4 || s === 12)) this.snare(t, 1);
    if (lvl >= 2 && lastBar && s >= 13) this.snare(t, 0.55);          // kleiner Fill vor dem nächsten Teil
    if (lvl >= 4 ? true : s % 4 === 2) this.hat(t, s % 4 === 2 ? 1 : 0.5, false);
    if (lvl >= 4 && s === 14) this.hat(t, 0.8, true);

    // Lead-Melodie ab Stufe 5
    if (lvl >= 5 && sec.lead) for (const [lb, st, m, len] of sec.lead) if (lb === bar && st === s) this.leadNote(m, t, STEP * len);
  }

  padNote(midi, t, dur) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.055, t + 0.8);
    g.gain.setValueAtTime(0.055, t + dur - 0.1);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.9);
    g.connect(this.pad.filter);
    for (const det of [-9, 9]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = midiHz(midi); o.detune.value = det;
      o.connect(g); o.start(t); o.stop(t + dur + 1);
    }
  }

  bassNote(midi, t, dur, vel) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiHz(midi);
    const sub = ctx.createOscillator(); sub.type = 'square'; sub.frequency.value = midiHz(midi - 12);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(300 + 900 * vel, t);
    f.frequency.exponentialRampToValueAtTime(140, t + dur);
    const g = ctx.createGain();
    env(g.gain, t, 0.005, dur, 0.16 * vel, 0.05);
    const subG = ctx.createGain(); subG.gain.value = 0.35;
    o.connect(f); sub.connect(subG).connect(f); f.connect(g).connect(this.dry);
    o.start(t); sub.start(t); o.stop(t + dur + 0.1); sub.stop(t + dur + 0.1);
  }

  arpNote(midi, t, dur, vel) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = midiHz(midi);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800 + 400 * this.intensity; f.Q.value = 3;
    const g = ctx.createGain();
    env(g.gain, t, 0.003, dur, 0.035 * vel, 0.06);
    o.connect(f).connect(g);
    g.connect(this.dry); g.connect(this.delay);
    o.start(t); o.stop(t + dur + 0.1);
  }

  leadNote(midi, t, dur) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    env(g.gain, t, 0.04, dur, 0.05, 0.4);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600; f.Q.value = 1;
    const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
    const vibAmt = ctx.createGain(); vibAmt.gain.setValueAtTime(0, t); vibAmt.gain.linearRampToValueAtTime(12, t + 0.4);
    vib.connect(vibAmt);
    for (const det of [-6, 6]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiHz(midi); o.detune.value = det;
      vibAmt.connect(o.detune);
      o.connect(f); o.start(t); o.stop(t + dur + 0.5);
    }
    vib.start(t); vib.stop(t + dur + 0.5);
    f.connect(g);
    g.connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 0.5;
    g.connect(send).connect(this.reverb);
    g.connect(this.delay);
  }

  kick(t, vel) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g).connect(this.dry);
    o.start(t); o.stop(t + 0.4);
  }

  snare(t, vel = 1) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * vel, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    n.connect(f).connect(g);
    g.connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 0.9; // großer 80er-Hall
    g.connect(send).connect(this.reverb);
    const body = ctx.createOscillator(); body.type = 'triangle';
    body.frequency.setValueAtTime(220, t); body.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t); bg.gain.exponentialRampToValueAtTime(0.12 * vel, t + 0.003); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    body.connect(bg).connect(this.dry);
    n.start(t, Math.random() * 0.5, 0.3); body.start(t); body.stop(t + 0.15);
  }

  crash(t) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    n.connect(f).connect(g);
    g.connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 0.4;
    g.connect(send).connect(this.reverb);
    n.loop = true; // Rauschpuffer ist 1 s lang, der Crash klingt länger
    n.start(t, Math.random() * 0.5); n.stop(t + 1.7);
  }

  hat(t, vel, open) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
    const g = ctx.createGain();
    const len = open ? 0.25 : 0.045;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045 * vel, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.connect(f).connect(g).connect(this.dry);
    n.start(t, Math.random() * 0.5, len + 0.02);
  }

  /** Rendert einige Takte offline (für Tests und Vorschau). Gibt einen AudioBuffer zurück. */
  static async renderOffline({ bars = 4, startBar = 0, intensity = 5, sampleRate = 22050, volume = 1 } = {}) {
    const seconds = bars * STEPS_PER_BAR * STEP + 2;
    const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
    const sw = new Synthwave({ volume, intensity });
    sw.build(ctx, ctx.destination);
    sw.master.gain.value = sw.targetGain();
    const first = startBar * STEPS_PER_BAR;
    for (let i = 0; i < bars * STEPS_PER_BAR; i++) sw.playStep((first + i) % SONG_STEPS, 0.05 + i * STEP);
    return ctx.startRendering();
  }
}

export const MUSIC = { BPM, STEP, STEPS_PER_BAR, SONG, SECTIONS, BARS: SONG.length * BARS_PER_SECTION, SECONDS: SONG_STEPS * STEP };

function env(param, t, attack, hold, peak, release) {
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + attack);
  param.setValueAtTime(peak, t + Math.max(attack, hold - release));
  param.linearRampToValueAtTime(0, t + hold + release);
}

function noiseBuffer(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function clamp01(x) { return Math.min(1, Math.max(0, Number(x) || 0)); }
function clampInt(x, lo, hi) { return Math.min(hi, Math.max(lo, Math.round(Number(x) || lo))); }
