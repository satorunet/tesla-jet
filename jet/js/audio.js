// Synth sounds (no samples): jet engine whine, wind, boost roar, chimes and beeps, and the race BGM (synthesised live).
// ---------------------------------------------------------------- music data
// chords as MIDI triads around middle C; patterns are 16 steps per bar
const NOTE = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const tri = (name) => { const m = name.match(/^([A-G]b?)(m?)$/); const r = 48 + NOTE[m[1]]; const R = r < 52 ? r + 12 : r; return [R, R + (m[2] ? 3 : 4), R + 7]; };
const prog = (s) => s.split(' ').map(tri);
// drums: k kick, s snare (X accent, x ghost), h hats (x closed, O open)
const DRUMS = {
  dnb:    { k: 'X.........X.....', s: '....X.......X...', h: 'xxxOxxxxxxxOxxxx' },
  dnb2:   { k: 'X.....X...X..X..', s: '....X..x....X..x', h: 'xxxxxxxxxxxxxxxx' },
  jungle: { k: 'X.........X..X..', s: '....X..x.x..X...', h: 'x.xOx.x.x.xOx.xx' },
  four:   { k: 'X...X...X...X...', s: '....X.......X...', h: 'x.O.x.O.x.O.x.Ox' },
  euro:   { k: 'X...X...X...X...', s: '....X.......X..x', h: 'xxOxxxOxxxOxxxOx' },
  brk:    { k: 'X.....X...X.....', s: '....X..x.x..X..x', h: 'x.xxx.xxx.xxx.xx' },
  house:  { k: 'X...X...X...X...', s: '....X.......X...', h: 'x.O.x.O.x.O.x.Ox' },
};
// bass: x root, o octave, f fifth, - hold
const BASS = {
  roll:   'xxoxxxoxxxoxxxox',
  oct16:  'xoxoxoxoxoxoxoxo',
  off:    '..xo..xo..xo..xo',
  reese:  'x-------x---x-x-',
  gallop: 'x.xo.xx.xo.xx.xo',
  drive:  'x.x.o.x.x.x.o.xf',
  funk:   'x..o..x.-.x.o.xo',
};
const ARPS = {
  up:   '0123012301230123',
  updn: '0123432101234321',
  trance: '0204020402040204',
  skip: '0.2.1.3.0.2.1.3.',
  stab: '..c..c..c..c.c..',
};
const MINOR = [0, 2, 3, 5, 7, 8, 10], MAJOR = [0, 2, 4, 5, 7, 9, 11], DORIAN = [0, 2, 3, 5, 7, 9, 10], PHRYG = [0, 1, 3, 5, 7, 8, 10], HARM = [0, 2, 3, 5, 7, 8, 11];
// lead hooks: 64 steps (4 bars) of scale degrees ('.' rest, '-' hold the previous note)
const hook = (s) => { const a = s.trim().split(/\s+/).map((v) => (v === '.' ? null : v === '-' ? '-' : +v)); while (a.length < 64) a.push(null); return a.slice(0, 64); };
// stage kits: the same engine, a different sound per stage
//  sky   = outrun synthwave / eurobeat: warm saws, gated snare, punchy kick
//  twist = dark space drum'n'bass: growling distorted reese, FM bells, deep kick, long reverb, sweeps
//  ocean = sunny tropical house: steel-drum plucks, marimba arps, offbeat chord stabs, claps, swing
//  neon  = cyberpunk breaks: distorted square bass and lead, metallic snare, stutter fills
const KITS = {
  sky:   { lead: 'saws', bass: 'saw', arp: 'square', pad: ['sawtooth', 'sawtooth'], padCut: 1900, rev: 0.3, kick: 'punch', snare: 'gated', swing: 0, fx: [] },
  twist: { lead: 'wide', bass: 'reese', arp: 'bell', pad: ['sawtooth', 'triangle'], padCut: 800, rev: 0.5, kick: 'deep', snare: 'dnb', swing: 0, fx: ['sweep', 'drone'] },
  ocean: { lead: 'steel', bass: 'round', arp: 'marimba', pad: ['triangle', 'triangle'], padCut: 2600, rev: 0.25, kick: 'soft', snare: 'clap', swing: 0.14, fx: ['stabs'] },
  neon:  { lead: 'grit', bass: 'dist', arp: 'saw', pad: ['sawtooth', 'square'], padCut: 1100, rev: 0.18, kick: 'hard', snare: 'metal', swing: 0, fx: ['stutter'] },
};
const SONGS = {
  sky: [
    { name: 'Sunset Overdrive', bpm: 158, key: 57, scale: MINOR, chords: prog('Am F C G'), drums: 'euro', bass: 'oct16', arp: 'trance',
      lead: hook(`7 - 9 - 10 - 9 - 7 - 11 - 12 - 11 - 9 - - - 7 - 8 - 9 - 11 - 12 - 14 -
                  14 - 12 - 11 - 9 - 11 - 12 - 11 - 9 - 7 - - - 8 - 9 - 11 - - - 7 - - -`) },
    { name: 'Neon Horizon', bpm: 150, key: 52, scale: MINOR, chords: prog('Em C G D'), drums: 'four', bass: 'oct16', arp: 'updn', leadWave: 'square',
      lead: hook(`7 . 7 8 9 . 9 . 11 . 10 . 9 . 8 . 7 . 7 8 9 . 11 . 12 . 11 . 9 - - -
                  12 . 12 11 12 . 14 . 12 . 11 . 9 . 11 . 12 - 11 - 9 - 8 - 7 - - - - - - -`) },
    { name: 'Cloud Rider', bpm: 160, key: 50, scale: HARM, chords: prog('Dm Bb F A'), drums: 'four', bass: 'gallop', arp: 'up',
      lead: hook(`9 - - 8 9 - 10 - 9 - - 8 7 - 6 - 7 - - 8 9 - 11 - 12 - 11 - 10 - 9 -
                  14 - - 13 14 - 12 - 11 - - 10 9 - 8 - 9 - 10 - 11 - 13 - 14 - - - - - . .`) },
  ],
  twist: [
    { name: 'Event Horizon', bpm: 176, key: 50, scale: PHRYG, chords: prog('Dm Eb Dm C'), drums: 'dnb2', bass: 'reese', arp: 'trance', bassCut: 300,
      lead: hook(`7 - - 8 - - 7 - 5 - 4 - 5 - 7 - 8 - - 10 - - 8 - 7 - 5 - 4 - . .
                  11 - - 12 - - 11 - 10 - 8 - 7 - 8 - 10 - 11 - 12 - 14 - 12 - 11 - 10 - 8 -`) },
    { name: 'Zero Gravity', bpm: 174, key: 53, scale: MINOR, chords: prog('Fm Db Ab Eb'), drums: 'jungle', bass: 'roll', arp: 'updn', arpWave: 'sawtooth',
      lead: hook(`7 - - - 9 - - - 10 - 12 - 10 - 9 - 7 - - - 5 - - - 7 - 9 - 7 - 5 -
                  10 - - - 12 - - - 14 - 12 - 10 - 9 - 10 - 9 - 7 - 5 - 7 - - - - - . .`) },
    { name: 'Corkscrew', bpm: 178, key: 47, scale: PHRYG, chords: prog('Bm C Bm A'), drums: 'dnb', bass: 'reese', arp: 'skip',
      lead: hook(`7 8 9 . 9 . 8 . 7 . 5 . 7 - - - 9 10 11 . 11 . 10 . 9 . 8 . 7 - - -
                  11 12 14 . 14 . 12 . 11 . 9 . 11 - - - 12 - 11 - 9 - 8 - 7 - - - - - - -`) },
  ],
  ocean: [
    { name: 'Blue Lagoon', bpm: 136, key: 48, scale: MAJOR, chords: prog('F G Em Am'), drums: 'house', bass: 'off', arp: 'trance', arpWave: 'sawtooth', leadWave: 'square',
      lead: hook(`9 - 9 - 11 - 12 - 11 - 9 - 7 - 9 - 9 - 11 - 12 - 14 - 12 - 11 - 9 -
                  12 - 12 - 14 - 16 - 14 - 12 - 11 - 12 - 11 - 9 - 7 - 9 - - - - - - -`) },
    { name: 'Wave Surfer', bpm: 142, key: 53, scale: MAJOR, chords: prog('Bb C Am Dm'), drums: 'house', bass: 'funk', arp: 'up',
      lead: hook(`9 . 9 8 9 . 11 . 12 . 11 . 9 . 8 . 7 . 7 8 9 . 8 . 7 . 5 . 4 - - -
                  9 . 9 8 9 . 11 . 12 . 14 . 16 . 14 . 12 - 11 - 12 - 14 - 12 - - - - - - -`) },
    { name: 'Trade Winds', bpm: 130, key: 50, scale: DORIAN, chords: prog('Dm G Dm G'), drums: 'brk', bass: 'funk', arp: 'skip', leadWave: 'triangle',
      lead: hook(`7 - - 9 - 10 - 9 7 - - - 5 - 7 - 9 - - 10 - 12 - 10 9 - 7 - - - . .
                  12 - - 14 - 12 - 10 9 - - - 10 - 12 - 14 - - 12 - 10 - 9 7 - - - - - . .`) },
  ],
  neon: [
    { name: 'Midnight Spiral', bpm: 172, key: 53, scale: HARM, chords: prog('Fm Db Fm C'), drums: 'brk', bass: 'drive', arp: 'trance', bassCut: 280,
      lead: hook(`7 - - 7 - - 8 - 10 - - 8 - - 7 - 5 - - 5 - - 7 - 8 - 7 - 5 - 3 -
                  10 - - 10 - - 12 - 14 - - 12 - - 10 - 8 - - 10 - - 12 - 10 - - - . . . .`) },
    { name: 'Chrome City', bpm: 165, key: 48, scale: HARM, chords: prog('Cm Ab Eb G'), drums: 'dnb2', bass: 'oct16', arp: 'updn', arpWave: 'sawtooth',
      lead: hook(`7 - - - 7 - 8 - 7 - 5 - 3 - 6 - 7 - - - 7 - 8 - 10 - 11 - 12 - - -
                  14 - - - 12 - 11 - 12 - 10 - 8 - 7 - 8 - 7 - 6 - 7 - - - - - . . . .`) },
    { name: 'Tower Rush', bpm: 170, key: 55, scale: MINOR, chords: prog('Gm Eb Bb F'), drums: 'jungle', bass: 'roll', arp: 'up',
      lead: hook(`9 10 9 . 7 . 9 . 10 . 12 . 10 . 9 . 7 8 7 . 5 . 7 . 8 . 10 . 9 - - -
                  12 14 12 . 10 . 12 . 14 . 15 . 14 . 12 . 10 - 12 - 10 - 9 - 7 - - - - -`) },
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
  // Songs are data (SONGS above). Arrangement loops: BUILD (4 bars: filter opening, snare roll, riser) -> DROP (16 bars:
  // everything, crash on entry) -> BREAK (4 bars: pads, arp, lead, no kick) -> BUILD -> DROP ...
  // The kick pumps the bass / pads / lead (side-chain); the bus goes through a compressor with a little reverb.
  // level 0 = lobby (the break, softly), 1 = race (the full arrangement).
  startMusic() {
    const c = this.ctx;
    this.mG = c.createGain(); this.mG.gain.value = 0.32;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.15;
    this.mG.connect(comp); comp.connect(this.master);
    // pumped sub-bus for the melodic parts
    this.pump = c.createGain(); this.pump.connect(this.mG);
    // reverb: a synthetic decaying-noise impulse
    const len = c.sampleRate * 1.6, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; this.revG = c.createGain(); this.revG.gain.value = 0.22; this.rev.connect(this.revG); this.revG.connect(this.mG);
    // drive bus: a soft clipper for the gritty parts
    this.drive = c.createWaveShaper(); const cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) cv[i] = Math.tanh((i / 512 - 1) * 4); this.drive.curve = cv;
    const dg = c.createGain(); dg.gain.value = 0.45; this.drive.connect(dg); dg.connect(this.pump);
    // tempo-synced echo
    this.dly = c.createDelay(1);
    const fb = c.createGain(); fb.gain.value = 0.3; const dl = c.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 3000;
    this.dly.connect(dl); dl.connect(fb); fb.connect(this.dly); dl.connect(this.pump);
    this.level = 0; this.lvlS = 0; this.step = 0; this.bar = 0; this.next = c.currentTime + 0.1;
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
  }
  schedule() {
    const c = this.ctx; if (!c || c.state !== 'running') { if (c) this.next = c.currentTime + 0.05; return; }
    if (this.next < c.currentTime - 0.2) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.12) {
      if (this.step % 16 === 0) {
        if (this.pending) { this.song = this.pending; this.pending = null; this.bar = 0; }
        else this.bar++;
        if (this.lvlS !== this.level) { this.lvlS = this.level; this.bar = 0; }      // a new race starts from the build
        this.dly.delayTime.value = 60 / this.song.bpm * 0.75;
      }
      const sp = 60 / this.song.bpm / 4;            // a 16th
      this.playStep(this.step % 16, this.next, sp); this.next += sp; this.step = (this.step + 1) % 16;
    }
  }
  section() {
    if (this.lvlS < 0.5) return 'break';
    const b = this.bar; if (b < 4) return 'build';
    const k = (b - 4) % 24; return k < 16 ? 'drop' : k < 20 ? 'break' : 'build';
  }
  playStep(s16, t, sp) {
    const S = this.song, K = KITS[this.stage] || KITS.sky, sec = this.section(), bar = this.bar;
    const inSec = sec === 'drop' ? (bar - 4) % 24 : sec === 'break' ? (bar - 20) % 24 : bar < 4 ? bar : (bar - 24) % 24;
    const ch = S.chords[bar % S.chords.length], root = ch[0] - 24;
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const on = (pat) => pat && pat[s16] !== '.';
    const lobby = this.lvlS < 0.5;
    if (s16 === 0) this.revG.gain.value = K.rev;
    if (K.swing && s16 % 2) t += sp * K.swing;
    // ---- drums
    const D = DRUMS[S.drums];
    if (sec === 'drop') {
      if (s16 === 0 && inSec % 8 === 0) this.crash(t);
      if (on(D.k)) this.kick(t, D.k[s16] === 'X' ? 1 : 0.8, K.kick);
      if (on(D.s)) this.snare(t, D.s[s16] === 'X' ? 0.55 : 0.18, K.snare);
      if (on(D.h)) this.hat(t, D.h[s16] === 'O' ? 0.07 : 0.045, D.h[s16] === 'O' ? 0.16 : 0.03);
      const fill = inSec % 8 === 7;
      if (fill && K.fx.includes('stutter') && s16 >= 8) { this.snare(t, 0.15 + (s16 - 8) * 0.04, K.snare); this.hat(t + sp / 2, 0.05, 0.02); this.hat(t + sp / 4, 0.04, 0.015); }
      else if (fill && s16 >= 12) this.snare(t, 0.2 + (s16 - 12) * 0.08, K.snare);
    } else if (sec === 'build') {
      const prog4 = Math.min(3, inSec);
      if (s16 % 4 === 0) this.kick(t, 0.7, K.kick);
      const every = prog4 < 2 ? 4 : prog4 < 3 ? 2 : 1;
      if (s16 % every === 0) this.snare(t, 0.12 + (prog4 * 16 + s16) / 64 * 0.4, K.snare);
      if (s16 % 2 === 1) this.hat(t, 0.035, 0.03);
      if (s16 === 0 && prog4 === 0) this.riser(t, sp * 64);
    } else {
      if (!lobby && s16 === 0 && inSec === 0) { this.crash(t, 0.5); if (K.fx.includes('sweep')) this.sweep(t, sp * 64); }
      if (s16 % 4 === 2) this.hat(t, lobby ? 0.03 : 0.04, 0.03);
      if (lobby && s16 % 8 === 0) this.kick(t, 0.4, K.kick);
      if (K.fx.includes('drone') && s16 === 0) this.voice(['sine', 'sine'], [-5, 5], hz(root - 12), t, sp * 16, 0.08, 300, { att: 0.3, rel: 0.5, slow: true });
    }
    // ---- bass (pumped), voiced per kit
    const B = BASS[S.bass];
    if ((sec !== 'break' || lobby) && on(B) && B[s16] !== '-') {
      const oct = B[s16] === 'o' ? 12 : B[s16] === 'f' ? 7 : 0, f = hz(root + oct);
      let len = 1; while (B[(s16 + len) % 16] === '-' && len < 8) len++;
      const dur = sp * len * 0.95, open = sec === 'drop' ? 1 : sec === 'build' ? 0.3 + inSec * 0.15 : 0, v = lobby ? 0.08 : 0.12;
      const cut = (S.bassCut || 420) + open * 900;
      if (K.bass === 'reese') this.voice(['sawtooth', 'sawtooth', 'sawtooth'], [-22, 0, 19], f, t, dur, v * 0.9, cut + 300, { q: 8, env: 3, att: 0.004, dist: true });
      else if (K.bass === 'dist') this.voice(['square', 'sawtooth'], [-7, 7], f, t, dur, v * 0.8, cut + 500, { q: 5, env: 2.6, att: 0.003, dist: true });
      else if (K.bass === 'round') this.voice(['triangle', 'sine'], [0, 0], f * 2, t, dur, v * 1.3, 1200, { att: 0.004, pluck: 0.22 });
      else this.voice(['sawtooth', 'sawtooth'], [-9, 9], f, t, dur, v, cut, { q: 6, env: 2.4, att: 0.004 });
      if (sec === 'drop' && K.bass !== 'round') this.voice(['sine'], [0], f / 2, t, dur, 0.16, 400, { att: 0.004 });
    }
    // ---- pad: chord per bar
    if (s16 === 0) for (const m of ch) this.voice(K.pad, [-12, 12], hz(m), t, sp * 16, sec === 'break' ? 0.03 : 0.018, sec === 'drop' ? K.padCut * 1.4 : K.padCut, { att: 0.25, rel: 0.6, slow: true, rev: true });
    if (lobby) return;
    // ---- offbeat chord stabs (tropical)
    if (K.fx.includes('stabs') && sec === 'drop' && s16 % 4 === 2) for (const m of ch) this.voice(['triangle', 'square'], [0, 7], hz(m + 12), t, sp, 0.016, 3000, { pluck: 0.12, rev: true });
    // ---- arpeggio
    const A = ARPS[S.arp];
    if (A[s16] !== '.') {
      const tones = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[1] + 24];
      const cut = sec === 'build' ? 900 + (inSec * 16 + s16) * 50 : sec === 'drop' ? 4200 : 2200, v = sec === 'drop' ? 0.03 : 0.024;
      const notes = A[s16] === 'c' ? ch.map((m) => m + 12) : [tones[+A[s16]]];
      for (const m of notes) {
        if (K.arp === 'bell') this.bell(hz(m + 12), t, v * 1.2);
        else if (K.arp === 'marimba') this.voice(['sine', 'triangle'], [0, 1200], hz(m + 12), t, sp, v * 1.4, 4000, { pluck: 0.16, echo: true });
        else if (K.arp === 'saw') this.voice(['sawtooth'], [0], hz(m), t, sp * 0.7, v, cut, { echo: true, env: 2, dist: sec === 'drop' });
        else this.voice(['square'], [0], hz(m), t, sp * 0.8, v, cut, { echo: true, env: 1.6 });
      }
    }
    // ---- lead in the drop (an octave up on its second half), softly in the break
    if (sec === 'drop' || sec === 'break') {
      const i = (inSec % 4) * 16 + s16, L = S.lead[i];
      if (L !== null && L !== undefined && L !== '-') {
        let len = 1; while (S.lead[(i + len) % 64] === '-' && len < 16) len++;
        const scale = S.scale || MINOR, up = sec === 'drop' && inSec >= 8 ? 12 : 0;
        const m = S.key + 12 + up + Math.floor(L / 7) * 12 + scale[((L % 7) + 7) % 7], f = hz(m), dur = sp * len, v = sec === 'drop' ? 1 : 0.6;
        if (K.lead === 'steel') { this.voice(['sine', 'sine', 'triangle'], [0, 1200 * Math.log2(2.76), 1200], f, t, dur, 0.06 * v, 5000, { pluck: 0.5, echo: true, rev: true }); }
        else if (K.lead === 'grit') this.voice(['square', 'square'], [-10, 10], f, t, dur, 0.035 * v, 3200, { echo: true, vib: true, dist: true, att: 0.004 });
        else if (K.lead === 'wide') this.voice(['sawtooth', 'sawtooth', 'sawtooth', 'sawtooth'], [-28, -9, 9, 28], f, t, dur, 0.032 * v, 3000, { echo: true, rev: true, vib: true, att: 0.02 });
        else this.voice(['sawtooth', 'sawtooth', 'sawtooth'], [-16, 0, 16], f, t, dur, 0.042 * v, 4200, { echo: true, rev: true, vib: true, att: 0.008 });
      }
    }
  }
  // FM bell: a sine carrier with a decaying inharmonic modulator
  bell(f, t, vol) {
    const c = this.ctx, car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.value = f; mod.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * 2.5, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.7);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(this.pump); g.connect(this.dly); g.connect(this.rev);
    car.start(t); mod.start(t); car.stop(t + 1.25); mod.stop(t + 1.25);
  }
  // a long filtered-noise fall (space breaks)
  sweep(t, dur) {
    const c = this.ctx, n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; n.loop = true; bp.type = 'bandpass'; bp.Q.value = 6;
    bp.frequency.setValueAtTime(6000, t); bp.frequency.exponentialRampToValueAtTime(200, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.08, t + dur * 0.2); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    n.connect(bp); bp.connect(g); g.connect(this.rev); g.connect(this.mG); n.start(t); n.stop(t + dur + 0.05);
  }
  // a synth voice: detuned oscillators -> low-pass with an envelope -> amp -> pumped bus (+ echo / reverb sends)
  voice(waves, detune, f, t, dur, vol, cut, o = {}) {
    const c = this.ctx, g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = o.q ?? (o.slow ? 0.6 : 2.5);
    if (o.slow) lp.frequency.value = cut;
    else { lp.frequency.setValueAtTime(cut * (o.env || 1.8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(80, cut * 0.45), t + Math.max(0.05, dur)); }
    const att = o.att ?? 0.01, rel = o.rel ?? 0.06;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att);
    if (o.pluck) { g.gain.exponentialRampToValueAtTime(0.0001, t + att + o.pluck); dur = Math.min(dur, att + o.pluck); }   // struck: decays on its own
    else { g.gain.setValueAtTime(vol, t + Math.max(att, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel); }
    waves.forEach((w, k) => {
      const os = c.createOscillator(); os.type = w; os.frequency.value = f; os.detune.value = detune[k] || 0;
      if (o.vib) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.4, dur)); lfo.connect(lg); lg.connect(os.frequency); lfo.start(t); lfo.stop(t + dur + rel + 0.05); }
      os.connect(lp); os.start(t); os.stop(t + dur + rel + 0.05);
    });
    lp.connect(g); g.connect(o.dist ? this.drive : this.pump);
    if (o.echo) g.connect(this.dly);
    if (o.rev) g.connect(this.rev);
  }
  kick(t, v, kind = 'punch') {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    const [f0, f1, dec, amp] = { punch: [190, 48, 0.32, 1.1], deep: [150, 38, 0.5, 1.15], soft: [130, 52, 0.26, 0.8], hard: [230, 44, 0.3, 1.2] }[kind] || [190, 48, 0.32, 1.1];
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.09);
    g.gain.setValueAtTime(v * amp, t); g.gain.exponentialRampToValueAtTime(0.001, t + dec);
    o.connect(g); g.connect(kind === 'hard' ? this.drive : this.mG); o.start(t); o.stop(t + dec + 0.02);
    // click on top
    const n = c.createBufferSource(), hp = c.createBiquadFilter(), ng = c.createGain();
    n.buffer = this.noiseBuf; hp.type = 'highpass'; hp.frequency.value = 2500; ng.gain.setValueAtTime(v * 0.35, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    n.connect(hp); hp.connect(ng); ng.connect(this.mG); n.start(t, Math.random()); n.stop(t + 0.02);
    // side-chain: duck the melodic bus and let it swell back
    const p = this.pump.gain; p.cancelScheduledValues(t); p.setValueAtTime(0.3, t); p.linearRampToValueAtTime(1, t + 0.22);
  }
  snare(t, v, kind = 'dnb') {
    const c = this.ctx;
    if (kind === 'clap') {        // three quick hand-clap bursts
      for (const d of [0, 0.011, 0.023]) { const n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(); n.buffer = this.noiseBuf; bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.2; g.gain.setValueAtTime(v * 0.8, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + (d > 0.02 ? 0.16 : 0.03)); n.connect(bp); bp.connect(g); g.connect(this.mG); g.connect(this.rev); n.start(t + d, Math.random()); n.stop(t + d + 0.2); }
      return;
    }
    const n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; bp.type = 'bandpass'; bp.frequency.value = kind === 'metal' ? 3400 : 2200; bp.Q.value = kind === 'metal' ? 4 : 0.6;
    const len = kind === 'gated' ? 0.26 : 0.18;
    g.gain.setValueAtTime(v, t); if (kind === 'gated') { g.gain.setValueAtTime(v * 0.7, t + 0.2); g.gain.linearRampToValueAtTime(0.001, t + len); } else g.gain.exponentialRampToValueAtTime(0.001, t + len);
    n.connect(bp); bp.connect(g); g.connect(this.mG); g.connect(this.rev); if (kind === 'gated') g.connect(this.rev); n.start(t, Math.random()); n.stop(t + len + 0.02);
    if (kind === 'metal') { const r = c.createOscillator(), rg = c.createGain(); r.type = 'square'; r.frequency.value = 1830; rg.gain.setValueAtTime(v * 0.12, t); rg.gain.exponentialRampToValueAtTime(0.001, t + 0.09); r.connect(rg); rg.connect(this.drive); r.start(t); r.stop(t + 0.1); }
    const o = c.createOscillator(), og = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.07);
    og.gain.setValueAtTime(v * 0.6, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(og); og.connect(this.mG); o.start(t); o.stop(t + 0.12);
  }
  hat(t, v, dur) {
    const c = this.ctx, n = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; hp.type = 'highpass'; hp.frequency.value = 8000;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(hp); hp.connect(g); g.connect(this.mG); n.start(t, Math.random()); n.stop(t + dur + 0.02);
  }
  crash(t, v = 1) {
    const c = this.ctx, n = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; hp.type = 'highpass'; hp.frequency.value = 5000;
    g.gain.setValueAtTime(0.16 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    n.connect(hp); hp.connect(g); g.connect(this.mG); g.connect(this.rev); n.start(t, Math.random()); n.stop(t + 1.9);
  }
  // white-noise sweep rising into the drop
  riser(t, dur) {
    const c = this.ctx, n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; n.loop = true; bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + dur);
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.14, t + dur * 0.95); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    n.connect(bp); bp.connect(g); g.connect(this.mG); g.connect(this.rev); n.start(t); n.stop(t + dur + 0.05);
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
