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
};
// bass: x root, o octave, f fifth, - hold
const BASS = {
  roll:   'xxoxxxoxxxoxxxox',
  oct16:  'xoxoxoxoxoxoxoxo',
  off:    '..xo..xo..xo..xo',
  reese:  'x-------x---x-x-',
  gallop: 'x.xo.xx.xo.xx.xo',
  drive:  'x.x.o.x.x.x.o.xf',
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
const SONGS = {
  sky: [
    { name: 'Sunset Overdrive', bpm: 172, key: 57, scale: MINOR, chords: prog('Am F C G'), drums: 'dnb', bass: 'reese', arp: 'trance',
      lead: hook(`7 - 9 - 10 - 9 - 7 - 11 - 12 - 11 - 9 - - - 7 - 8 - 9 - 11 - 12 - 14 -
                  14 - 12 - 11 - 9 - 11 - 12 - 11 - 9 - 7 - - - 8 - 9 - 11 - - - 7 - - -`) },
    { name: 'Neon Horizon', bpm: 150, key: 52, scale: MINOR, chords: prog('Em C G D'), drums: 'euro', bass: 'oct16', arp: 'updn', leadWave: 'square',
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
    { name: 'Zero Gravity', bpm: 168, key: 53, scale: MINOR, chords: prog('Fm Db Ab Eb'), drums: 'jungle', bass: 'roll', arp: 'updn', arpWave: 'sawtooth',
      lead: hook(`7 - - - 9 - - - 10 - 12 - 10 - 9 - 7 - - - 5 - - - 7 - 9 - 7 - 5 -
                  10 - - - 12 - - - 14 - 12 - 10 - 9 - 10 - 9 - 7 - 5 - 7 - - - - - . .`) },
    { name: 'Corkscrew', bpm: 174, key: 47, scale: MINOR, chords: prog('Bm G D A'), drums: 'dnb', bass: 'drive', arp: 'skip',
      lead: hook(`7 8 9 . 9 . 8 . 7 . 5 . 7 - - - 9 10 11 . 11 . 10 . 9 . 8 . 7 - - -
                  11 12 14 . 14 . 12 . 11 . 9 . 11 - - - 12 - 11 - 9 - 8 - 7 - - - - - - -`) },
  ],
  ocean: [
    { name: 'Blue Lagoon', bpm: 150, key: 48, scale: MAJOR, chords: prog('Am F C G'), drums: 'euro', bass: 'off', arp: 'trance', arpWave: 'sawtooth', leadWave: 'square',
      lead: hook(`9 - 9 - 11 - 12 - 11 - 9 - 7 - 9 - 9 - 11 - 12 - 14 - 12 - 11 - 9 -
                  12 - 12 - 14 - 16 - 14 - 12 - 11 - 12 - 11 - 9 - 7 - 9 - - - - - - -`) },
    { name: 'Wave Surfer', bpm: 158, key: 53, scale: MAJOR, chords: prog('Dm Bb F C'), drums: 'four', bass: 'gallop', arp: 'up',
      lead: hook(`9 . 9 8 9 . 11 . 12 . 11 . 9 . 8 . 7 . 7 8 9 . 8 . 7 . 5 . 4 - - -
                  9 . 9 8 9 . 11 . 12 . 14 . 16 . 14 . 12 - 11 - 12 - 14 - 12 - - - - - - -`) },
    { name: 'Trade Winds', bpm: 170, key: 50, scale: DORIAN, chords: prog('Dm C Bb C'), drums: 'brk', bass: 'drive', arp: 'skip', leadWave: 'triangle',
      lead: hook(`7 - - 9 - 10 - 9 7 - - - 5 - 7 - 9 - - 10 - 12 - 10 9 - 7 - - - . .
                  12 - - 14 - 12 - 10 9 - - - 10 - 12 - 14 - - 12 - 10 - 9 7 - - - - - . .`) },
  ],
  neon: [
    { name: 'Midnight Spiral', bpm: 178, key: 53, scale: MINOR, chords: prog('Fm Db Ab Eb'), drums: 'dnb', bass: 'reese', arp: 'trance', bassCut: 280,
      lead: hook(`7 - - 7 - - 8 - 10 - - 8 - - 7 - 5 - - 5 - - 7 - 8 - 7 - 5 - 3 -
                  10 - - 10 - - 12 - 14 - - 12 - - 10 - 8 - - 10 - - 12 - 10 - - - . . . .`) },
    { name: 'Chrome City', bpm: 152, key: 48, scale: HARM, chords: prog('Cm Ab Eb G'), drums: 'euro', bass: 'oct16', arp: 'updn', arpWave: 'sawtooth',
      lead: hook(`7 - - - 7 - 8 - 7 - 5 - 3 - 6 - 7 - - - 7 - 8 - 10 - 11 - 12 - - -
                  14 - - - 12 - 11 - 12 - 10 - 8 - 7 - 8 - 7 - 6 - 7 - - - - - . . . .`) },
    { name: 'Tower Rush', bpm: 166, key: 55, scale: MINOR, chords: prog('Gm Eb Bb F'), drums: 'jungle', bass: 'roll', arp: 'up',
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
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = 0.22; this.rev.connect(rg); rg.connect(this.mG);
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
    const S = this.song, sec = this.section(), bar = this.bar, inSec = sec === 'drop' ? (bar - 4) % 24 : sec === 'break' ? (bar - 20) % 24 : bar < 4 ? bar : (bar - 24) % 24;
    const ch = S.chords[bar % S.chords.length], root = ch[0] - 24;
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const on = (pat) => pat && pat[s16] !== '.';
    const lobby = this.lvlS < 0.5;
    // ---- drums
    const D = DRUMS[S.drums];
    if (sec === 'drop') {
      if (s16 === 0 && inSec % 8 === 0) this.crash(t);
      if (on(D.k)) this.kick(t, D.k[s16] === 'X' ? 1 : 0.8);
      if (on(D.s)) this.snare(t, D.s[s16] === 'X' ? 0.55 : 0.18);
      if (on(D.h)) this.hat(t, D.h[s16] === 'O' ? 0.07 : 0.045, D.h[s16] === 'O' ? 0.16 : 0.03);
      if (inSec % 8 === 7 && s16 >= 12) this.snare(t, 0.2 + (s16 - 12) * 0.08);
    } else if (sec === 'build') {
      const prog4 = Math.min(3, inSec);
      if (s16 % 4 === 0) this.kick(t, 0.7);
      // snare roll: quarters -> 8ths -> 16ths, rising
      const every = prog4 < 2 ? 4 : prog4 < 3 ? 2 : 1;
      if (s16 % every === 0) this.snare(t, 0.12 + (prog4 * 16 + s16) / 64 * 0.4);
      if (s16 % 2 === 1) this.hat(t, 0.035, 0.03);
      if (s16 === 0 && prog4 === 0) this.riser(t, sp * 64);
    } else {
      if (!lobby && s16 === 0 && inSec === 0) this.crash(t, 0.5);
      if (s16 % 4 === 2) this.hat(t, lobby ? 0.03 : 0.04, 0.03);
      if (lobby && s16 % 8 === 0) this.kick(t, 0.4);
    }
    // ---- bass (pumped)
    const B = BASS[S.bass];
    if (sec !== 'break' || lobby) {
      if (on(B) && B[s16] !== '-') {
        const oct = B[s16] === 'o' ? 12 : B[s16] === 'f' ? 7 : 0;
        let len = 1; while (B[(s16 + len) % 16] === '-' && len < 8) len++;
        const cut = (S.bassCut || 420) + (sec === 'drop' ? 900 : sec === 'build' ? 300 + inSec * 200 : 0);
        this.voice(['sawtooth', 'sawtooth'], [-9, 9], hz(root + oct), t, sp * len * 0.95, lobby ? 0.08 : 0.12, cut, { q: 6, env: 2.4, att: 0.004 });
        if (sec === 'drop') this.voice(['sine'], [0], hz(root + oct - 12), t, sp * len * 0.95, 0.16, 400, { att: 0.004 });
      }
    }
    // ---- pad: chord per bar, wide and soft
    if (s16 === 0) for (const m of ch) this.voice(['sawtooth', 'sawtooth'], [-12, 12], hz(m), t, sp * 16, sec === 'break' ? 0.03 : 0.018, sec === 'drop' ? 2400 : 1400, { att: 0.25, rel: 0.6, slow: true, rev: true });
    if (lobby) return;
    // ---- arpeggio (filter opens through the build)
    const A = ARPS[S.arp];
    if (A[s16] !== '.') {
      const tones = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[1] + 24];
      const cut = sec === 'build' ? 900 + (inSec * 16 + s16) * 50 : sec === 'drop' ? 4200 : 2200;
      if (A[s16] === 'c') for (const m of ch) this.voice([S.arpWave || 'square'], [0], hz(m + 12), t, sp * 0.9, 0.022, cut, { echo: true });
      else this.voice([S.arpWave || 'square'], [0], hz(tones[+A[s16]]), t, sp * 0.8, sec === 'drop' ? 0.03 : 0.024, cut, { echo: true, env: 1.6 });
    }
    // ---- lead: supersaw hook in the drop (an octave up on its second half), softly in the break
    if (sec === 'drop' || sec === 'break') {
      const i = (inSec % 4) * 16 + s16, L = S.lead[i];
      if (L !== null && L !== undefined && L !== '-') {
        let len = 1; while (S.lead[(i + len) % 64] === '-' && len < 16) len++;
        const scale = S.scale || MINOR, up = sec === 'drop' && inSec >= 8 ? 12 : 0;
        const m = S.key + 12 + up + Math.floor(L / 7) * 12 + scale[((L % 7) + 7) % 7];
        if (S.leadWave === 'square' || S.leadWave === 'triangle') this.voice([S.leadWave, S.leadWave], [-6, 6], hz(m), t, sp * len, sec === 'drop' ? 0.05 : 0.03, 3600, { echo: true, rev: true, vib: true });
        else this.voice(['sawtooth', 'sawtooth', 'sawtooth'], [-16, 0, 16], hz(m), t, sp * len, sec === 'drop' ? 0.042 : 0.026, 4200, { echo: true, rev: true, vib: true, att: 0.008 });
      }
    }
  }
  // a synth voice: detuned oscillators -> low-pass with an envelope -> amp -> pumped bus (+ echo / reverb sends)
  voice(waves, detune, f, t, dur, vol, cut, o = {}) {
    const c = this.ctx, g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = o.q ?? (o.slow ? 0.6 : 2.5);
    if (o.slow) lp.frequency.value = cut;
    else { lp.frequency.setValueAtTime(cut * (o.env || 1.8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(80, cut * 0.45), t + Math.max(0.05, dur)); }
    const att = o.att ?? 0.01, rel = o.rel ?? 0.06;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.setValueAtTime(vol, t + Math.max(att, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
    waves.forEach((w, k) => {
      const os = c.createOscillator(); os.type = w; os.frequency.value = f; os.detune.value = detune[k] || 0;
      if (o.vib) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.4, dur)); lfo.connect(lg); lg.connect(os.frequency); lfo.start(t); lfo.stop(t + dur + rel + 0.05); }
      os.connect(lp); os.start(t); os.stop(t + dur + rel + 0.05);
    });
    lp.connect(g); g.connect(this.pump);
    if (o.echo) g.connect(this.dly);
    if (o.rev) g.connect(this.rev);
  }
  kick(t, v) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    g.gain.setValueAtTime(v * 1.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.connect(g); g.connect(this.mG); o.start(t); o.stop(t + 0.34);
    // click on top
    const n = c.createBufferSource(), hp = c.createBiquadFilter(), ng = c.createGain();
    n.buffer = this.noiseBuf; hp.type = 'highpass'; hp.frequency.value = 2500; ng.gain.setValueAtTime(v * 0.35, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    n.connect(hp); hp.connect(ng); ng.connect(this.mG); n.start(t, Math.random()); n.stop(t + 0.02);
    // side-chain: duck the melodic bus and let it swell back
    const p = this.pump.gain; p.cancelScheduledValues(t); p.setValueAtTime(0.3, t); p.linearRampToValueAtTime(1, t + 0.22);
  }
  snare(t, v) {
    const c = this.ctx, n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noiseBuf; bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.6;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    n.connect(bp); bp.connect(g); g.connect(this.mG); g.connect(this.rev); n.start(t, Math.random()); n.stop(t + 0.2);
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
  item() { [988, 1319, 1760, 2349].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 0.1, 'square'), i * 45)); }
  chime() { this.tone(1318, 0.25, 0.14, 'sine'); setTimeout(() => this.tone(1976, 0.3, 0.12, 'sine'), 70); }
  thud(v = 0.4) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.32);
  }
  fanfare() { [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 0.14, 'triangle'), i * 120)); }
}
