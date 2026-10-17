// Jet racer: the machine's model (procedural) and its flight model.
// It always flies relative to the course frame (s along, u across, h up), hovering on its jets.
import * as THREE from 'three';
import { frameAt } from './track.js';
import { buildRoadster } from './car.js';

// ------------------------------------------------------------------ model
// the tesra roadster in hover mode: wheels folded flat with a lift jet in each hub, plus twin rear thrusters
let ENV = null;
export function setCarEnv(t) { ENV = t; }
export function buildCraft(color = 0xff3b5c) {
  const rd = buildRoadster(color);
  const root = new THREE.Group(), body = rd.car; root.add(body);
  body.position.y = -0.55;                        // car origin (wheel bottoms) sits just under the craft's centre
  if (ENV) for (const m of [...rd.materials, rd.paint]) { m.envMap = ENV; m.envMapIntensity = 0.9; m.needsUpdate = true; }
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.9, roughness: 0.3, envMap: ENV });
  const flameGeo = new THREE.ConeGeometry(0.16, 1, 14, 1, true); flameGeo.rotateX(-Math.PI / 2); flameGeo.translate(0, 0, -0.5);
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.6, 1.8), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.3, 1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const flame = (pos) => {
    const g = new THREE.Group(); g.position.copy(pos);
    const f = new THREE.Mesh(flameGeo, flameMat); const c = new THREE.Mesh(flameGeo, coreMat); c.scale.set(0.35, 0.35, 0.5);
    g.add(f, c); body.add(g); return g;
  };
  // twin rear thrusters under the tail light bar
  const nozzles = [-1, 1].map((sx) => new THREE.Vector3(sx * 0.45, 0.5, rd.rear - 0.04));
  for (const n of nozzles) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.14, 14, 1, true), nozzleMat); m.rotation.x = Math.PI / 2; m.position.copy(n).z += 0.06; body.add(m); }
  const flames = nozzles.map(flame);
  // lift jets: one in each wheel hub, pointing down once the wheel has folded
  const lifts = rd.wheels.map((w) => { const g = flame(w.pivot.position.clone().setY(0.2)); g.rotation.x = -Math.PI / 2; g.scale.set(1.4, 1.4, 0.01); return g; });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radialTex(), color: new THREE.Color(0.5, 0.75, 2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.03; body.add(glow);
  rd.wheels.forEach((w, i) => { w.pivot.rotation.z = (i % 2 ? -1 : 1) * Math.PI / 2; });   // hover mode: wheels folded flat
  rd.blob.visible = false;
  // vapour cone (shown while going supersonic on NITRO)
  const vg = new THREE.ConeGeometry(2.3, 4.2, 28, 1, true); vg.rotateX(-Math.PI / 2); vg.translate(0, 0.6, -0.4);
  const vm = new THREE.MeshBasicMaterial({ map: radialTex(), color: new THREE.Color(1.4, 1.5, 1.7), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const vapor = new THREE.Mesh(vg, vm); vapor.visible = false; body.add(vapor);
  let spin = 0, vap = 0;
  // per frame: speed m/s, high up, boosting, rear thrust 0..~1.6, lift-jet output 0..~1.6, supersonic
  const anim = (dt, speed, air, boost, thrust, lift = air ? 1.3 : 0.6, sonic = false) => {
    vap += ((sonic ? 1 : 0) - vap) * Math.min(1, dt * (sonic ? 6 : 2.5));
    vapor.visible = vap > 0.02; vm.opacity = vap * (0.32 + Math.random() * 0.1); vapor.rotation.z += dt * 9; vapor.scale.set(1, 1, 0.8 + vap * 0.5);
    spin += dt * (14 + lift * 10); for (const w of rd.wheels) w.spin.rotation.x = spin;          // the hub fans
    for (const f of flames) f.scale.set(1, 1, Math.max(0.01, thrust * (1.5 + Math.random() * 0.5)));
    for (const f of lifts) f.scale.z = Math.max(0.05, lift * (1.1 + Math.random() * 0.45));
    flameMat.color.setRGB(boost ? 1.8 : 0.35, boost ? 0.55 : 0.6, boost ? 1.2 : 1.8);
    glow.material.opacity = 0.35 + lift * 0.15; glow.position.y = air ? -1.2 - lift * 0.5 : 0.6 - HOVER; glow.scale.setScalar(air ? 4.5 : 3.6);
  };
  return { root, body, flames, flameMat, nozzles, hover: rd.blob, paint: rd.paint, anim };
}
let _rt = null;
export function radialTex() {
  if (_rt) return _rt;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (_rt = new THREE.CanvasTexture(c));
}

// ------------------------------------------------------------------ flight model
// Always hovering on four lift jets, and always flying relative to the course: s along it, u across, h up off the road.
// JET climbs, gravity brings it back down onto a jet cushion over the road; over a gap there is no cushion, so you
// carry across on the take-off kick and keep it up with JET. That keeps flying fast and controllable along the course.
export const VCRUISE = 122, VBOOST = 58, HOVER = 1.7;
export const VSONIC = 340, NITRO_MAX = 2, NITRO_T = 2.4;   // NITRO: up to the speed of sound for a moment
const HMAX = 26, G = 13, G_GAP = 7.8, KICK = 9;   // over a gap it glides (less pull) after the kick
const _f = {}, V3 = THREE.Vector3;
const _a = new V3(), _b = new V3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _z = new V3(0, 0, 1), _x = new V3(1, 0, 0);

export class Craft {
  constructor(tr) {
    this.tr = tr; this.mode = 'track';
    this.s = 0; this.u = 0; this.v = 0; this.vu = 0; this.h = HOVER; this.vh = 0; this.t = 0;
    this.pos = new V3(); this.vel = new V3(); this.fwd = new V3(0, 0, 1); this.up = new V3(0, 1, 0); this.quat = new THREE.Quaternion();
    this.energy = 1; this.turbo = 0; this.nitro = 0; this.sonic = 0; this.boosting = false; this.thrust = 0; this.lift = 0.5; this.airT = 0; this.hint = -1; this.steerVis = 0; this.liftOn = false; this.tilt = 0; this.tiltV = 0; this.pj = 0; this.pjV = 0;
    this.events = []; this.hold = true; this.padCool = 0; this.wallT = 0; this.respawned = false; this.wasRoad = true;
  }
  get speed() { return Math.hypot(this.v, this.vu, this.vh); }
  place(s, u) { this.turbo = 0; this.sonic = 0; this.mode = 'track'; this.s = s; this.u = u; this.v = 0; this.vu = 0; this.h = HOVER; this.vh = 0; this.airT = 0; this.wasRoad = true; this.hint = Math.round(s / this.tr.step) % this.tr.n; this.sync(0, 0); }
  respawn(s) { this.place(s, 0); this.v = 70; this.energy = Math.max(this.energy, 0.5); this.respawned = true; this.events.push('respawn'); }

  update(dt, inp) {
    const tr = this.tr;
    this.padCool -= dt; this.wallT -= dt; this.t += dt;
    const f = frameAt(tr, this.s, _f), road = f.road;
    // NITRO: spend a stored charge -> shockwave and a burst towards the speed of sound
    if (inp.nitroPress && this.nitro > 0 && !this.hold && this.sonic <= 0) { this.nitro--; this.sonic = NITRO_T; this.events.push('nitro'); }
    if (this.sonic > 0) this.sonic -= dt;
    // turbo (from an item box): boost for free for a while
    if (this.turbo > 0) this.turbo -= dt;
    const turbo = this.turbo > 0 && !this.hold;
    const wantBoost = (inp.boost && this.energy > 0.02 && !this.hold) || turbo;
    this.boosting = wantBoost;
    if (wantBoost && !turbo) this.energy = Math.max(0, this.energy - dt * 0.3);
    const steer = inp.steer || 0, pitch = this.hold ? 0 : Math.max(0, inp.pitch || 0);   // stick down / S: dive
    // ---- along: jets push to cruise, slopes and climbing cost a little
    if (!this.hold) {
      // the player's throttle (and JET) drive it; the course only guides the line. Let go and it coasts down.
      const acc = Math.max(0, Math.min(1, inp.accel || 0));
      const target = acc * VCRUISE + (this.boosting ? VBOOST : 0) + (turbo ? 28 : 0);
      let a = this.v < target ? Math.min(30, (target - this.v) * 0.8) : -Math.min(50, 8 + this.v * 0.12 + (this.v - target) * 0.15);
      if (this.sonic > 0) a = Math.max(0, Math.min(320, (VSONIC - this.v) * 2.5));
      if (this.v > 1) a -= 9.8 * f.T[1] * 0.3;          // hills
      if (inp.brake) a -= 70;
      this.v = Math.max(0, Math.min(VSONIC + 25, this.v + a * dt));
    } else this.v = 0;
    // ---- across: banked steering, energy walls while low over the road
    // corners throw you outwards (more the faster you go)
    const vf = Math.min(this.v, 200), fling = vf * vf * (tr.curv ? tr.curv[f.i] : 0) * 0.1 * (this.h > 6 ? 0.5 : 1);
    this.vu += (steer * (36 + Math.min(this.v, 160) * 0.13) - fling) * dt; this.vu *= Math.exp(-dt * 3.2);
    this.u += this.vu * dt;
    const half = (road || this.h < 4 ? f.w / 2 - 1.5 : f.w / 2 - 1.5 + Math.min(10, (this.h - 4) * 0.6));
    if (Math.abs(this.u) > half) {
      this.u = Math.sign(this.u) * half; this.vu = -this.vu * 0.3;
      if (this.h < 5) { this.v *= 1 - dt * 0.9; if (this.wallT <= 0) { this.events.push('wall'); this.wallT = 0.25; } }
    }
    // ---- up: JET thrust vs gravity, a jet cushion over the road
    const lift = inp.lift && this.energy > 0.01 && !this.hold;
    if (inp.liftPress && lift && this.h < HOVER + 1) { this.vh = Math.max(this.vh, 9); this.events.push('lift'); }
    this.liftOn = lift;
    let ah = road ? -G : -G_GAP * (tr.glide ? tr.glide[f.i] : 1);
    if (lift) { ah += 30; this.energy = Math.max(0, this.energy - dt * (this.boosting ? 0.06 : 0.2)); }
    ah -= pitch * 22;                                    // dive / hold up with the stick
    if (road) {
      const c = HOVER + Math.sin(this.t * 2.6) * 0.08 - this.h;     // cushion: spring + damper below hover height
      if (c > 0) ah += c * 70 - this.vh * 9;
      if (!this.boosting && !lift) this.energy = Math.min(1, this.energy + dt * 0.1);
    }
    if (road && !this.wasRoad && this.h < HOVER + 4) { if (this.vh < -22) { this.v *= 0.88; this.events.push('hard'); } else this.events.push('land'); }
    if (!road && this.wasRoad) { this.vh = Math.max(this.vh, KICK); this.events.push('jump'); }
    this.wasRoad = road;
    this.vh += ah * dt; this.vh *= Math.exp(-dt * 0.4);
    this.h += this.vh * dt;
    // a loop leaves little room overhead (the centre is ~30 m up)
    const top = f.w < 17 ? 9 : HMAX;
    if (this.h > top) { this.h = top; this.vh = Math.min(0, this.vh); }
    if (road && this.h < 0.6) { if (this.vh < -22) { this.v *= 0.88; this.events.push('hard'); } this.h = 0.6; this.vh = Math.max(0, this.vh); }
    // ---- boost pads (low over the road)
    if (this.padCool <= 0 && this.h < 4) for (const p of tr.pads) {
      const di = ((f.i - p.i) % tr.n + tr.n) % tr.n;
      if (di < 5 && Math.abs(this.u - p.u) < 3.5) { this.v += 38; this.energy = Math.min(1, this.energy + 0.25); this.padCool = 0.6; this.events.push('pad'); }
    }
    this.s = (this.s + this.v * dt) % tr.L;
    const air = !road || this.h > HOVER + 2.5;
    this.mode = air ? 'air' : 'track';
    this.airT = air ? this.airT + dt : 0;
    this.thrust += ((this.hold ? 0.15 : this.sonic > 0 ? 2.6 : this.boosting ? 1.6 : 0.12 + 0.75 * Math.max(0, Math.min(1, inp.accel || 0))) - this.thrust) * Math.min(1, dt * 6);
    this.lift += ((lift ? 1.6 : 0.55 + Math.min(0.5, Math.max(0, this.vh) * 0.05)) - this.lift) * Math.min(1, dt * 8);
    this.sync(steer, dt);
    if (!road && this.h < -14) this.events.push('fall');
  }
  sync(steer, dt) {
    const f = frameAt(this.tr, this.s, _f);
    this.hint = f.i;
    const T = _a.set(f.T[0], f.T[1], f.T[2]), R = _b.set(f.R[0], f.R[1], f.R[2]), N = new V3(f.N[0], f.N[1], f.N[2]);
    this.pos.set(f.p[0], f.p[1], f.p[2]).addScaledVector(R, this.u).addScaledVector(N, this.h);
    this.vel.copy(T).multiplyScalar(this.v).addScaledVector(R, this.vu).addScaledVector(N, this.vh);
    // nose: along the course, into the drift, pitched with the climb
    this.fwd.copy(T).multiplyScalar(Math.max(this.v, 20)).addScaledVector(R, this.vu * 0.6).addScaledVector(N, this.vh * 0.7).normalize();
    this.up.copy(N);
    this.steerVis += (steer - this.steerVis) * Math.min(1, dt * 7);
    // knocks (car contact): a sprung roll / pitch on top of the pose
    if (dt > 0) {
      this.tiltV += (-this.tilt * 70 - this.tiltV * 6) * dt; this.tilt += this.tiltV * dt;
      this.pjV += (-this.pj * 80 - this.pjV * 7) * dt; this.pj += this.pjV * dt;
    }
    this.orient(this.steerVis * (this.mode === 'air' ? 0.55 : 0.32) + this.tilt);
    if (this.pj) this.quat.multiply(_q.setFromAxisAngle(_x, this.pj));
  }
  orient(roll) {
    const F = this.fwd, U = _a.copy(this.up).addScaledVector(F, -this.up.dot(F)).normalize();
    const X = _b.crossVectors(U, F).normalize();
    _m.makeBasis(X, U, F); this.quat.setFromRotationMatrix(_m);
    if (roll) this.quat.multiply(_q.setFromAxisAngle(_z, roll));
  }
}
