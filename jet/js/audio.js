// Synth sounds (no samples): jet engine whine, wind, boost roar, chimes and beeps, and a synthwave race BGM.
// ---------------------------------------------------------------- music data
// chords as MIDI triads around middle C; patterns are 16 steps per bar
const NOTE = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const tri = (name) => { const m = name.match(/^([A-G]b?)(m?)$/); const r = 48 + NOTE[m[1]]; const R = r < 52 ? r + 12 : r; return [R, R + (m[2] ? 3 : 4), R + 7]; };
const prog = (s) => s.split(' ').map(tri);
const DRUMS = {
  dnb:    { k: 'X.........X.....', s: '....X.......X...', h: 'x.x.x.xOx.x.x.xO' },
  dnb2:   { k: 'X.....x...X..x..', s: '....X.......X..x', h: 'xxxxxxxxxxxxxxxx' },
  four:   { k: 'X...X...X...X...', s: '....X.......X...', h: '..O...O...O...O.' },
  trance: { k: 'X...X...X...X...', s: '....X.......X...', h: 'x.Ox.x.Ox.Ox.xO.' },
  house:  { k: 'X...X...X...X...', s: '....X.......X...', h: 'x.O.x.O.x.O.x.Ox' },
  brk:    { k: 'X.....x...X.....', s: '....X..x....X...', h: 'x.x.x.x.x.x.x.x.' },
  half:   { k: 'X.......x.X.....', s: '........X.......', h: 'x.x.x.x.x.x.x.x.' },
};
const BASS = {
  oct8:  'x.o.x.o.x.o.x.o.',
  off:   '..x...x...x...x.',
  roll:  'xxoxxxoxxxoxxxox',
  funk:  'x..o..x.-.x.o.x.',
  pulse: 'x-..x-..x-..x-..',
  gallop:'x.xo.xx.xo.xx.xo',
};
const ARPS = {
  up:    '0123012301230123',
  updn:  '0123432101234321',
  stab:  '..c...c...c..c..',
  skip:  '0.2.1.3.0.2.1.3.',
  off:   '.0.1.2.3.0.1.2.3',
};
const MINOR = [0, 2, 3, 5, 7, 8, 10], MAJOR = [0, 2, 4, 5, 7, 9, 11], DORIAN = [0, 2, 3, 5, 7, 9, 10], PHRYG = [0, 1, 3, 5, 7, 8, 10];
// lead hooks: 32 steps (2 bars) of scale degrees (null = rest)
const hook = (s) => s.split(' ').map((v) => (v === '.' ? null : +v));
const SONGS = {
  sky: [
    { name: 'Sunset Overdrive', bpm: 150, key: 57, scale: MINOR, chords: prog('Am F C G Am F G E'), drums: 'dnb', bass: 'oct8', arp: 'up',
      lead: hook('7 . . 9 . . 8 . 7 . 9 . 10 . 9 . 7 . . 9 . . 8 . 11 . 10 . 9 . 8 .') },
    { name: 'Neon Horizon', bpm: 128, key: 52, scale: MINOR, chords: prog('Em C G D'), drums: 'four', bass: 'off', arp: 'updn', leadWave: 'square',
      lead: hook('7 . 8 . 9 . . . 11 . 10 . 9 . . . 7 . 8 . 9 . 11 . 12 . . . 11 . 9 .') },
    { name: 'Cloud Rider', bpm: 140, key: 50, scale: MINOR, chords: prog('Dm Bb F C'), drums: 'trance', bass: 'gallop', arp: 'skip', padVol: 0.03,
      lead: hook('9 . 9 . 8 . 7 . 9 . . . 11 . 12 . 9 . 9 . 8 . 7 . 5 . . . 7 . . .') },
  ],
  twist: [
    { name: 'Event Horizon', bpm: 172, key: 50, scale: PHRYG, chords: prog('Dm Eb Dm C'), drums: 'dnb2', bass: 'roll', arp: 'up', bassWave: 'square', bassCut: 300,
      lead: hook('7 . . 8 . . 7 . 5 . . . 4 . 5 . 7 . . 8 . . 10 . 8 . 7 . 5 . 4 .') },
    { name: 'Zero Gravity', bpm: 138, key: 53, scale: MINOR, chords: prog('Fm Db Ab Eb'), drums: 'half', bass: 'pulse', arp: 'updn', arpWave: 'sawtooth', leadWave: 'triangle', leadLen: 3,
      lead: hook('7 . . . 9 . . . 10 . . . 9 . 7 . 11 . . . 10 . . . 9 . . . 7 . . .') },
    { name: 'Corkscrew', bpm: 160, key: 47, scale: MINOR, chords: prog('Bm G D A Bm G A F#m'.replace('F#m', 'Gbm')), drums: 'brk', bass: 'oct8', arp: 'off', swing: 0.12,
      lead: hook('7 8 9 . 9 . 8 . 7 . 5 . 7 . . . 9 10 11 . 11 . 10 . 9 . 8 . 7 . . .') },
  ],
  ocean: [
    { name: 'Blue Lagoon', bpm: 124, key: 48, scale: MAJOR, chords: prog('C G Am F'), drums: 'house', bass: 'funk', arp: 'stab', arpWave: 'triangle', leadWave: 'square', padWave: 'triangle', padVol: 0.04,
      lead: hook('7 . 9 . 11 . 9 . 7 . . . 4 . 5 . 7 . 9 . 11 . 12 . 11 . 9 . 7 . . .') },
    { name: 'Wave Surfer', bpm: 136, key: 53, scale: MAJOR, chords: prog('F G Em Am Dm G C C'), drums: 'trance', bass: 'off', arp: 'up', arpWave: 'sawtooth',
      lead: hook('9 . 9 8 9 . 11 . 12 . 11 . 9 . 8 . 7 . 7 8 9 . 8 . 7 . 5 . 4 . . .') },
    { name: 'Trade Winds', bpm: 116, key: 50, scale: DORIAN, chords: prog('Dm G Dm G Am G F G'), drums: 'brk', bass: 'funk', arp: 'skip', swing: 0.18, leadWave: 'triangle', leadLen: 2.4, padWave: 'triangle',
      lead: hook('7 . . 9 . 10 . 9 7 . . . 5 . 7 . 9 . . 10 . 12 . 10 9 . 7 . . . . .') },
  ],
  neon: [
    { name: 'Midnight Spiral', bpm: 174, key: 53, scale: MINOR, chords: prog('Fm Db Ab Eb'), drums: 'dnb', bass: 'roll', arp: 'updn', bassWave: 'square', bassCut: 280,
      lead: hook('7 . . 7 . . 8 . 10 . . 8 . . 7 . 5 . . 5 . . 7 . 8 . 7 . 5 . 3 .') },
    { name: 'Chrome City', bpm: 126, key: 48, scale: MINOR, chords: prog('Cm Ab Eb Bb'), drums: 'four', bass: 'pulse', arp: 'off', arpWave: 'sawtooth', leadFrom: 1,
      lead: hook('7 . . . 7 . 8 . 7 . 5 . 3 . . . 5 . . . 5 . 7 . 8 . 7 . 5 . . .') },
    { name: 'Tower Rush', bpm: 152, key: 55, scale: MINOR, chords: prog('Gm Eb Bb F Gm Eb F D'), drums: 'trance', bass: 'gallop', arp: 'up',
      lead: hook('9 10 9 . 7 . 9 . 10 . 12 . 10 . 9 . 7 8 7 . 5 . 7 . 8 . 10 . 9 . 6 .') },
  ],
};

export class Sound {
  constructor() { this.ctx = null; this.on = true; }
  start() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.on ? 0.7 : 0; this.master.connect(c.destination);
    const noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = () => { const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(); return s; };
    // engine: two detuned saws through a low-pass
    this.eLP = c.createBiquadFilter(); this.eLP.type = 'lowpass'; this.eLP.frequency.value = 900; this.eLP.Q.value = 4;
    this.eG = c.createGain(); this.eG.gain.value = 0; this.eLP.connect(this.eG); this.eG.connect(this.master);
    this.o1 = c.createOscillator(); this.o1.type = 'sawtooth'; this.o2 = c.createOscillator(); this.o2.type = 'square';
    this.o1.connect(this.eLP); const g2 = c.createGain(); g2.gain.value = 0.35; this.o2.connect(g2); g2.connect(this.eLP); this.o1.start(); this.o2.start();
    // jet hiss + wind
    this.wBP = c.createBiquadFilter(); this.wBP.type = 'bandpass'; this.wBP.frequency.value = 800; this.wBP.Q.value = 0.6;
    this.wG = c.createGain(); this.wG.gain.value = 0; noise().connect(this.wBP); this.wBP.connect(this.wG); this.wG.connect(this.master);
    this.bHP = c.createBiquadFilter(); this.bHP.type = 'lowpass'; this.bHP.frequency.value = 500;
    this.bG = c.createGain(); this.bG.gain.value = 0; noise().connect(this.bHP); this.bHP.connect(this.bG); this.bG.connect(this.master);
    this.noiseBuf = noiseBuf;
    this.startMusic();
  }

  // ---------------------------------------------------------------- BGM
  // Songs are data (below SONGS): tempo, chords, drum / bass / arp patterns, a lead hook and timbres. Each stage has
  // three; a new one is picked for every race. level 0 = lobby (pads, bass, soft beat), 1 = race (everything).
  startMusic() {
    const c = this.ctx;
    this.mG = c.createGain(); this.mG.gain.value = 0.32; this.mG.connect(this.master);
    this.dly = c.createDelay(1);
    const fb = c.createGain(); fb.gain.value = 0.32; const dl = c.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2600;
    this.dly.connect(dl); dl.connect(fb); fb.connect(this.dly); dl.connect(this.mG);
    this.level = 0; this.lvlS = 0; this.step = 0; this.next = c.currentTime + 0.1;
    if (!this.song) this.pickSong(this.stage || 'sky');
    this.timer = setInterval(() => this.schedule(), 25);
  }
  setMusic(level) { this.level = level; }
  // choose a song for the stage (a different one from last time); takes effect at the next bar
  pickSong(stage) {
    const list = SONGS[stage] || SONGS.sky;
    let k = Math.floor(Math.random() * list.length);
    if (list.length > 1 && list[k] === this.song) k = (k + 1) % list.length;
    this.stage = stage; this.pending = list[k];
    if (!this.song) { this.song = this.pending; this.pending = null; }
    if (this.dly) this.dly.delayTime.value = 60 / this.song.bpm * 0.75;
  }
  schedule() {
    const c = this.ctx; if (!c || c.state !== 'running') { if (c) this.next = c.currentTime + 0.05; return; }
    if (this.next < c.currentTime - 0.2) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.12) {
      if (this.step % 16 === 0 && this.pending) { this.song = this.pending; this.pending = null; this.step = 0; this.dly.delayTime.value = 60 / this.song.bpm * 0.75; }
      const sp = 60 / this.song.bpm / 4;            // a 16th
      this.playStep(this.step, this.next, sp); this.next += sp; this.step = (this.step + 1) % 512;
    }
  }
  playStep(st, t, sp) {
    const S = this.song;
    if (st % 16 === 0) this.lvlS = this.level;
    const full = this.lvlS > 0.5, bar = Math.floor(st / 16), s16 = st % 16;
    const ch = S.chords[bar % S.chords.length], root = ch[0] - 24;
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const on = (pat) => pat[s16] !== '.';
    const swing = S.swing && s16 % 2 ? sp * S.swing : 0; t += swing;
    // drums
    const D = DRUMS[S.drums];
    if (full) {
      if (on(D.k)) this.kick(t, D.k[s16] === 'X' ? 1 : 0.8);
      if (on(D.s)) this.snare(t, D.s[s16] === 'X' ? 0.5 : 0.2);
      if (on(D.h)) this.hat(t, D.h[s16] === 'O' ? 0.09 : 0.06, D.h[s16] === 'O' ? 0.14 : 0.03);
      if (bar % 8 === 7 && s16 >= 12) this.snare(t, 0.22 + (s16 - 12) * 0.08);   // fill into the next phrase
    } else {
      if (s16 === 0 || (S.bpm < 135 && s16 === 8)) this.kick(t, 0.45);
      if (s16 % 4 === 2) this.hat(t, 0.04, 0.03);
    }
    // bass
    const B = BASS[S.bass];
    if (on(B)) {
      const oct = B[s16] === 'o' ? 12 : B[s16] === 'f' ? 7 : 0;
      this.note(S.bassWave || 'sawtooth', hz(root + oct), t, sp * (B[s16 + 1] === '-' ? 3.4 : 1.6), full ? 0.15 : 0.1, (S.bassCut || 420) + (full ? 500 : 0), 0.01);
    }
    // pad
    if (s16 === 0 && S.pad !== false) for (const m of ch) for (const d of [-7, 7]) this.note(S.padWave || 'sawtooth', hz(m) * Math.pow(2, d / 1200), t, sp * 16, S.padVol || 0.026, S.padCut || 1300, 0.4, true);
    if (!full) return;
    // arpeggio / stabs
    const A = ARPS[S.arp];
    if (A[s16] !== '.') {
      const tones = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[1] + 24];
      if (A[s16] === 'c') for (const m of ch) this.note(S.arpWave || 'square', hz(m + 12), t, sp * 0.9, 0.022, 3000, 0.004, false, true);
      else this.note(S.arpWave || 'square', hz(tones[+A[s16]]), t, sp * 0.8, 0.032, 2600, 0.005, false, true);
    }
    // lead hook on the second half of each 4-bar phrase
    if (bar % 4 >= (S.leadFrom ?? 2)) {
      const L = S.lead[(bar % 2) * 16 + s16];
      if (L !== undefined && L !== null) {
        const scale = S.scale || [0, 2, 3, 5, 7, 8, 10];
        const deg = L, m = S.key + 12 + Math.floor(deg / 7) * 12 + scale[((deg % 7) + 7) % 7];
        this.note(S.leadWave || 'sawtooth', hz(m), t, sp * (S.leadLen || 1.8), 0.05, 3400, 0.01, false, true);
      }
    }
  }
  note(type, f, t, dur, vol, cut, att = 0.01, slow = false, echo = false) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = slow ? 0.5 : 3;
    if (!slow) { lp.frequency.setValueAtTime(cut * 1.8, t); lp.frequency.exponentialRampToValueAtTime(cut * 0.5, t + dur); }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.setTargetAtTime(0.0001, t + dur * (slow ? 0.7 : 0.4), dur * (slow ? 0.25 : 0.3));
    o.connect(lp); lp.connect(g); g.connect(this.mG); if (echo) g.connect(this.dly);
    o.start(t); o.stop(t + dur * 1.6 + 0.05);
  }
  kick(t, v) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g); g.connect(this.mG); o.start(t); o.stop(t + 0.3);
  }
  snare(t, v) {
    const c = this.ctx, n = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; hp.type = 'highpass'; hp.frequency.value = 1400;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    n.connect(hp); hp.connect(g); g.connect(this.mG); n.start(t, Math.random()); n.stop(t + 0.18);
    const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    og.gain.setValueAtTime(v * 0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(og); og.connect(this.mG); o.start(t); o.stop(t + 0.12);
  }
  hat(t, v, dur) {
    const c = this.ctx, n = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; hp.type = 'highpass'; hp.frequency.value = 7500;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(hp); hp.connect(g); g.connect(this.mG); n.start(t, Math.random()); n.stop(t + dur + 0.02);
  }
  setOn(v) { this.on = v; if (this.master) this.master.gain.setTargetAtTime(v ? 0.7 : 0, this.ctx.currentTime, 0.05); }
  update(speed, thrust, boost, air) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, k = Math.min(1, speed / 180);
    this.o1.frequency.setTargetAtTime(70 + k * 180 + thrust * 40, t, 0.08);
    this.o2.frequency.setTargetAtTime(141 + k * 362 + thrust * 80, t, 0.08);
    this.eLP.frequency.setTargetAtTime(500 + k * 2200 + (boost ? 1400 : 0), t, 0.1);
    this.eG.gain.setTargetAtTime(0.07 + thrust * 0.05, t, 0.1);
    this.wBP.frequency.setTargetAtTime(500 + k * 2500, t, 0.1);
    this.wG.gain.setTargetAtTime(k * (air ? 0.22 : 0.14), t, 0.15);
    this.bG.gain.setTargetAtTime(boost ? 0.35 : 0, t, 0.08);
  }
  tone(f, dur = 0.2, vol = 0.2, type = 'square') {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  // NITRO: a sonic boom. Double crack (the N-wave), a distorted sub-bass punch, a long rumble, a rising whoosh, and the
  // music ducks for a moment so it hits.
  boom() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const bus = c.createGain(); bus.gain.value = 1.1;
    const sh = c.createWaveShaper(), curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 3.2); }
    sh.curve = curve; bus.connect(sh); sh.connect(this.master);
    const noise = (t0, dur, type, f0, f1, vol, q = 0.7) => {
      const n = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
      n.buffer = this.noiseBuf; fl.type = type; fl.Q.value = q;
      fl.frequency.setValueAtTime(f0, t0); fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      n.connect(fl); fl.connect(g); g.connect(bus); n.start(t0, Math.random()); n.stop(t0 + dur + 0.05);
    };
    // the double crack
    for (const [d, v] of [[0, 1.0], [0.085, 0.8]]) { noise(t + d, 0.09, 'highpass', 1800, 700, v); noise(t + d, 0.25, 'lowpass', 5000, 500, v * 0.8); }
    // sub punch: two sines diving, driven into the shaper
    for (const [f0, v] of [[110, 1.2], [55, 1.0]]) {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.28, t + 0.9);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 1.15);
    }
    // rolling rumble and the rushing whoosh
    noise(t + 0.02, 1.8, 'lowpass', 900, 60, 0.9, 1.2);
    noise(t + 0.05, 1.3, 'bandpass', 300, 4200, 0.35, 1.5);
    // duck the music
    if (this.mG) { const g = this.mG.gain; g.cancelScheduledValues(t); g.setValueAtTime(0.06, t); g.linearRampToValueAtTime(0.32, t + 1.4); }
  }
  // car-to-car contact: a metal clank (noise crack + inharmonic ring) over a body thump; soft = a short scrape
  crash(v = 0.5) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(2600 + Math.random() * 1200, t); bp.frequency.exponentialRampToValueAtTime(900, t + 0.2);
    g.gain.setValueAtTime(0.9 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    n.connect(bp); bp.connect(g); g.connect(this.master); n.start(t, Math.random()); n.stop(t + 0.25);
    for (const f of [430, 697, 1123]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = 'triangle'; o.frequency.value = f * (0.95 + Math.random() * 0.1);
      og.gain.setValueAtTime(0.12 * v, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.35 + v * 0.3);
      o.connect(og); og.connect(this.master); o.start(t); o.stop(t + 0.7);
    }
    this.thud(Math.min(0.8, 0.25 + v * 0.6));
  }
  // pickups: quiet and soft (no buzzy square waves)
  soft(f, dur, vol, t0 = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  whoosh(vol = 0.08) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime, n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(3500, t + 0.3);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    n.connect(bp); bp.connect(g); g.connect(this.master); n.start(t, Math.random()); n.stop(t + 0.4);
  }
  item() { this.soft(1175, 0.18, 0.05); this.soft(1760, 0.22, 0.04, 0.06); }
  ring() { this.whoosh(0.07); this.soft(1568, 0.2, 0.035); }
  chime() { this.tone(1318, 0.25, 0.14, 'sine'); setTimeout(() => this.tone(1976, 0.3, 0.12, 'sine'), 70); }
  thud(v = 0.4) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.32);
  }
  fanfare() { [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 0.14, 'triangle'), i * 120)); }
}
