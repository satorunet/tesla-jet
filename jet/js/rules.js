// Race rules shared by the server and the offline (solo) mode: lap / checkpoint progress from positions, and CPU racers.
import { frameAt, nearest, quatFromFrame, gridSlot } from './track.js';

export const CORRIDOR = 70;        // a checkpoint counts within this distance of the centre line (flying shortcuts are fine)
export const BOT_NAMES = ['ハヤテ', 'イナズマ', 'スバル', 'ミカゲ', 'アラシ', 'ツバメ', 'コメット'];

// progress of one racer along the course; feed it positions, it reports checkpoints, laps and the finish
export class Progress {
  constructor(tr) { this.tr = tr; this.hint = -1; this.cp = 0; this.lap = 0; this.s = 0; this.d = 0; this.lapStart = 0; this.done = false; this.best = null; }
  reset(s) { this.hint = Math.round(s / this.tr.step) % this.tr.n; this.cp = 0; this.lap = 0; this.s = s; this.done = false; }
  // returns null or { lap, lapTime, finished }
  update(x, y, z, t) {
    const tr = this.tr;
    const q = nearest(tr, x, y, z, this.hint, this.hint < 0 ? 0 : 160);
    // lost (respawn far away, or flew off): search the whole course
    const r = q.d > 90 ? nearest(tr, x, y, z, -1) : q;
    this.hint = r.i; this.s = r.s; this.d = r.d;
    if (this.done || r.d > CORRIDOR) return null;
    const target = tr.cps[this.cp], ti = r.i - target;
    const past = ((ti % tr.n) + tr.n) % tr.n;
    if (past < 60) {
      this.cp++;
      if (this.cp >= tr.cps.length) {
        this.cp = 0; this.lap++;
        const lapTime = t - this.lapStart; this.lapStart = t;
        if (this.best === null || lapTime < this.best) this.best = lapTime;
        if (this.lap >= this.tr.laps) this.done = true;
        return { lap: this.lap, lapTime, finished: this.done };
      }
    }
    return null;
  }
  // distance covered so far, for the standings (laps * length + metres into this lap)
  get total() { const tr = this.tr; const into = this.cp === 0 && this.s > tr.L * 0.5 ? 0 : this.s; return this.lap * tr.L + into + this.cp * 0.001; }
}

// a CPU racer: rides the road (and the centre line through the jumps) at a speed set by how hard the corners bank
export class Bot {
  constructor(tr, slot, skill) {
    this.tr = tr; const g = gridSlot(tr, slot);
    this.s = g.s; this.u = g.u; this.v = 0; this.skill = skill; this.vmax = 110 + skill * 22; this.ph = Math.random() * 6; this.boostT = 0;
    this.f = {};
  }
  step(dt, go) {
    const tr = this.tr;
    if (!go) { this.v = 0; return; }
    const i = Math.floor(((this.s % tr.L) + tr.L) % tr.L / tr.step) % tr.n;
    let bend = 0; for (let d = 0; d < 40; d += 4) bend = Math.max(bend, Math.abs(tr.bank[(i + d) % tr.n]));
    if (this.boostT <= 0 && bend < 8 && Math.random() < dt * 0.15) this.boostT = 1.6;
    this.boostT -= dt;
    const vt = this.vmax * (1 - 0.2 * bend / 55) + (this.boostT > 0 ? 34 : 0);
    this.v += Math.max(-40, Math.min(26, (vt - this.v) * 1.6)) * dt;
    this.s += this.v * dt;
    this.ph += dt * 0.5;
    const w = tr.width[i];
    this.u += ((Math.sin(this.ph) * 0.3) * (w / 2 - 2.5) - this.u) * Math.min(1, dt * 0.8);
  }
  pose() {
    const f = frameAt(this.tr, this.s, this.f);
    const lift = f.road ? 1.7 + Math.sin(this.ph * 9) * 0.08 : 4 + Math.sin(this.ph * 3) * 0.8;
    const p = [f.p[0] + f.R[0] * this.u + f.N[0] * lift, f.p[1] + f.R[1] * this.u + f.N[1] * lift, f.p[2] + f.R[2] * this.u + f.N[2] * lift];
    return { p, q: quatFromFrame(f.T, f.N), air: !f.road };
  }
}
