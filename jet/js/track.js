// Sky circuit: control points -> evenly spaced samples with a frame (T forward, N up, R right) at each.
// Plain math with no imports: the browser and the race server (server/jet.mjs) both build the same track from it.

export const LAPS = 3;            // default; each stage sets its own
export const STEP = 2;            // metres between samples
const W = 18;                     // road width

// [x, y, z, opts]  opts: gap (no road from this point to the next: fly), ring (air gate here; a number lifts it that far
// off the line), roll (extra roll in degrees, absolute, for corkscrews and inverted runs), w (width), loop (centre of a
// vertical loop), pad (boost pad lateral offset), glide (gravity scale while flying this gap: < 1 floats further),
// gate (dash arch over the road), box (a row of item boxes), nitro (a NITRO canister; a number = lateral offset),
// air (lift that point's box / nitro / ring this high off the road: JET up to grab it). JET energy orbs are scattered along the road automatically.

// a vertical loop: starts at B heading along dir (unit, horizontal), ends at B shifted `off` along lat
function loop(B, dir, lat, R, off, w = 16) {
  const pts = [];
  for (let k = 0; k <= 8; k++) {
    const a = k / 8 * Math.PI * 2, o = off * k / 8;
    const p = [B[0] + dir[0] * R * Math.sin(a) + lat[0] * o, B[1] + R * (1 - Math.cos(a)), B[2] + dir[2] * R * Math.sin(a) + lat[2] * o];
    pts.push([...p, { loop: [B[0] + lat[0] * o, B[1] + R, B[2] + lat[2] * o], w }]);
  }
  return pts;
}
// a helix around (cx, cz): from angle a0 (degrees) through `turns` (sign = direction), y0 -> y1, 8 points per turn
function helix(cx, cz, R, a0, turns, y0, y1, opts = {}) {
  const pts = [], n = Math.round(Math.abs(turns) * 8);
  for (let k = 0; k <= n; k++) {
    const a = (a0 + 360 * turns * k / n) * Math.PI / 180;
    pts.push([cx + R * Math.cos(a), y0 + (y1 - y0) * k / n, cz + R * Math.sin(a), { ...opts }]);
  }
  return pts;
}

// ---------------------------------------------------------------- stages
export const STAGES = {
  // dusk circuit above a sea of clouds: loop, corkscrew, two flying gaps
  sky: { laps: 3, name: 'SKY CIRCUIT', ja: 'スカイサーキット', ctrl: [
    [-150, 60, -60, { pad: 0 }],                // start / finish
    [-150, 60, 120, { box: true }],
    [-150, 61, 210, { airRing: 12 }],
    [-150, 62, 300, { pad: -4 }],
    [-118, 70, 450, { nitro: true }],
    [-20, 82, 556],
    [130, 92, 600, { gate: true }],
    [300, 92, 582, { pad: 4 }],
    [452, 84, 504, { nitro: true, air: 14 }],
    [560, 60, 384],
    [598, 30, 252],
    [604, 16, 170, { pad: 0 }],
    ...loop([604, 14, 110], [0, 0, -1], [1, 0, 0], 30, 24),
    [628, 14, 40],
    [628, 16, -40],
    [628, 26, -96, { gap: true }],             // kicker: the road stops, fly over the chasm
    [628, 28, -170, { gap: true, ring: true, nitro: 3, air: 4 }],
    [628, 16, -246, { gap: true, ring: true }],
    [628, 0, -320],                            // landing
    [610, -8, -400, { pad: 3, nitro: -4 }],
    [540, -10, -480, { box: true }],
    [430, -6, -520, { gate: true }],
    [300, 0, -522, { airRing: 10 }],
    [228, 8, -522, { gap: true }],             // second jump: between the towers
    [150, 20, -530, { gap: true, ring: true, nitro: -3, air: 4 }],
    [62, 18, -522, { gap: true, ring: true }],
    [-30, 8, -510],
    [-110, 10, -468, { nitro: 4 }],
    [-150, 18, -392, { roll: 0 }],
    [-150, 30, -300, { roll: 180, pad: 0 }],   // corkscrew
    [-150, 42, -210, { roll: 360 }],
    [-150, 52, -140, { box: true, air: 11 }],
  ] },
  // deep space: a double corkscrew, a double loop, a long upside-down run, a barrel-roll jump and a spiral dive
  twist: { laps: 2, name: 'TWIST NEBULA', ja: 'ツイスト・ネビュラ', ctrl: [
    [0, 100, 0, { pad: 0 }],
    [0, 100, 150, { gate: true }],
    [0, 100, 280, { roll: 0 }],
    [0, 102, 370, { roll: 180 }],              // double corkscrew
    [0, 104, 460, { roll: 360 }],
    [0, 104, 550, { roll: 540 }],
    [0, 102, 640, { roll: 720, pad: 0 }],
    [0, 99, 740, { airRing: 12 }],
    [30, 96, 850, { box: true }],
    [120, 94, 930],
    [220, 92, 960, { nitro: true }],
    ...loop([290, 92, 960], [1, 0, 0], [0, 0, 1], 30, 22),   // double loop
    [350, 92, 982],
    ...loop([410, 92, 982], [1, 0, 0], [0, 0, 1], 30, 22),
    [470, 92, 1004, { pad: 0 }],
    [560, 93, 1004, { roll: 720 }],
    [640, 95, 1004, { roll: 900 }],            // upside down...
    [740, 96, 1004, { roll: 900 }],
    [840, 96, 1004, { roll: 900, pad: 0 }],
    [930, 94, 1004, { roll: 1080 }],           // ...and back
    [1010, 90, 990, { box: true, air: 12 }],
    [1080, 86, 930, { nitro: -4 }],
    [1110, 82, 850, { gate: true }],
    ...helix(1010, 760, 100, 0, -1.25, 78, 34),              // spiral dive
    [900, 32, 660, { nitro: true }],
    [820, 34, 660, { gap: true, roll: 1080 }], // barrel-roll jump
    [740, 44, 660, { gap: true, ring: true, roll: 1260, nitro: true, air: 4.5 }],
    [660, 42, 660, { gap: true, roll: 1440 }],
    [580, 38, 660, { pad: 0 }],
    [420, 50, 650, { box: true }],
    [240, 64, 610, { gate: true }],
    [60, 78, 540, { nitro: true, air: 16 }],
    [-110, 88, 420],
    [-170, 94, 220, { nitro: true }],
    [-150, 98, 30],
    [-150, 99, -60, { airRing: 11 }],
    [-128, 100, -113],
    [-75, 100, -135],
    [-22, 100, -113],
    [0, 100, -60],
  ] },
  // a bright day over open sea: piers low over the waves, then a ramp into a huge flight across the ocean
  ocean: { laps: 2, name: 'OCEAN SOAR', ja: 'オーシャン・ソアー', ctrl: [
    [0, 12, 0, { pad: 0 }],
    [0, 12, 180, { gate: true }],
    [-40, 13, 340, { box: true }],
    [0, 14, 480, { pad: 3 }],
    [70, 14, 620, { airRing: 12 }],
    [210, 16, 730, { nitro: true, air: 15 }],
    [380, 18, 770, { gate: true }],
    [560, 20, 750, { box: true }],
    [710, 24, 690, { nitro: true }],
    [810, 30, 600, { pad: 0 }],
    [855, 42, 510],
    [868, 62, 430, { gap: true, glide: 0.3, w: 44 }],        // the big ramp: launch out over the ocean
    [876, 92, 310, { gap: true, glide: 0.3, w: 44, ring: 6 }],
    [880, 112, 170, { gap: true, glide: 0.3, w: 44, ring: 16, nitro: 6, air: 9 }],
    [878, 108, 30, { gap: true, glide: 0.3, w: 44, ring: 4 }],
    [870, 82, -110, { gap: true, glide: 0.3, w: 44, ring: 10, nitro: -5, air: 9 }],
    [860, 50, -230],                                         // landing
    [840, 28, -350, { pad: 0 }],
    [800, 22, -410, { airRing: 10 }],
    [760, 18, -460, { box: true }],
    [600, 16, -520, { gate: true }],
    [450, 18, -525],
    [370, 24, -525, { gap: true, glide: 0.6 }],              // hop across the strait
    [290, 32, -525, { gap: true, glide: 0.6, ring: true, nitro: 3, air: 4 }],
    [210, 24, -525],
    [110, 16, -480, { pad: -3 }],
    [30, 14, -380, { nitro: true }],
    [-20, 12, -240, { box: true, air: 12 }],
    [-10, 12, -110, { nitro: -4 }],
  ] },
  // night city: weave between towers, a two-turn spiral up the mega tower, a dive and a rooftop jump
  neon: { laps: 3, name: 'NEON SPIRAL', ja: 'ネオン・スパイラル', ctrl: [
    [0, 40, 0, { pad: 0 }],
    [0, 40, 200, { gate: true }],
    [30, 42, 360, { box: true }],
    [120, 46, 450, { nitro: true }],
    [270, 50, 488, { airRing: 11 }],
    ...helix(420, 600, 110, -90, 2, 50, 170, { w: 20 }),    // spiral up the tower
    [570, 170, 478, { nitro: 4 }],
    [700, 150, 440, { pad: 0 }],
    [800, 108, 370, { box: true, air: 12 }],
    [858, 66, 250],
    [866, 44, 110, { nitro: true }],
    [856, 48, -20, { gap: true }],                           // rooftop jump
    [826, 58, -140, { gap: true, ring: true, nitro: -3, air: 4 }],
    [786, 48, -260],
    [680, 42, -340, { pad: 0 }],
    [590, 39, -362, { nitro: true, air: 14 }],
    [500, 36, -380, { box: true }],
    [360, 34, -330, { gate: true }],
    [220, 36, -390],
    [80, 38, -330, { nitro: true }],
    [-30, 40, -220, { airRing: 11 }],
    [-20, 40, -100],
  ] },
};
export const STAGE_IDS = Object.keys(STAGES);

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// centripetal Catmull-Rom between p1 and p2
function cr(p0, p1, p2, p3, t) {
  const tj = (a, b, ti) => ti + Math.max(1e-4, Math.sqrt(len(sub(b, a))));
  const t0 = 0, t1 = tj(p0, p1, t0), t2 = tj(p1, p2, t1), t3 = tj(p2, p3, t2);
  const u = t1 + (t2 - t1) * t;
  const A1 = add(mul(p0, (t1 - u) / (t1 - t0)), mul(p1, (u - t0) / (t1 - t0)));
  const A2 = add(mul(p1, (t2 - u) / (t2 - t1)), mul(p2, (u - t1) / (t2 - t1)));
  const A3 = add(mul(p2, (t3 - u) / (t3 - t2)), mul(p3, (u - t2) / (t3 - t2)));
  const B1 = add(mul(A1, (t2 - u) / (t2 - t0)), mul(A2, (u - t0) / (t2 - t0)));
  const B2 = add(mul(A2, (t3 - u) / (t3 - t1)), mul(A3, (u - t1) / (t3 - t1)));
  return add(mul(B1, (t2 - u) / (t2 - t1)), mul(B2, (u - t1) / (t2 - t1)));
}

export function buildTrack(id = 'sky') {
  const st = STAGES[id] || STAGES.sky, CTRL = st.ctrl;
  const P = CTRL.map((c) => [c[0], c[1], c[2]]), O = CTRL.map((c) => c[3] || {}), M = P.length;
  // roll per control point: explicit values, others keep the previous whole turn (so a corkscrew doesn't unwind)
  const roll = [];
  for (let i = 0; i < M; i++) roll[i] = O[i].roll ?? (i ? Math.round(roll[i - 1] / 360) * 360 : 0);
  // fine polyline with per-point attributes
  const fp = [], fa = [];
  for (let i = 0; i < M; i++) {
    const p0 = P[(i - 1 + M) % M], p1 = P[i], p2 = P[(i + 1) % M], p3 = P[(i + 2) % M];
    const o1 = O[i], o2 = O[(i + 1) % M];
    const n = Math.max(4, Math.ceil(len(sub(p2, p1)) / 0.5));
    let r1 = roll[i], r2 = roll[(i + 1) % M];
    if (o2.roll === undefined) r2 += 360 * Math.round((r1 - r2) / 360);
    for (let k = 0; k < n; k++) {
      const t = k / n;
      fp.push(cr(p0, p1, p2, p3, t));
      fa.push({
        gap: !!o1.gap, glide: o1.glide ?? 1, w: (o1.w ?? W) + ((o2.w ?? W) - (o1.w ?? W)) * t, roll: r1 + (r2 - r1) * t,
        loop: o1.loop && o2.loop ? add(mul(o1.loop, 1 - t), mul(o2.loop, t)) : null,
      });
    }
  }
  // cumulative length and resampling every STEP metres
  const cum = [0];
  for (let i = 1; i <= fp.length; i++) cum.push(cum[i - 1] + len(sub(fp[i % fp.length], fp[i - 1])));
  const L = cum[fp.length], n = Math.floor(L / STEP), step = L / n;
  const pos = new Float32Array(n * 3), T = new Float32Array(n * 3), N = new Float32Array(n * 3), R = new Float32Array(n * 3);
  const width = new Float32Array(n), road = new Uint8Array(n), bank = new Float32Array(n), glide = new Float32Array(n);
  const P3 = [], A = [];
  for (let k = 0, j = 0; k < n; k++) {
    const s = k * step;
    while (cum[j + 1] < s) j++;
    const u = (s - cum[j]) / (cum[j + 1] - cum[j] || 1), a = fp[j], b = fp[(j + 1) % fp.length];
    P3.push(add(a, mul(sub(b, a), u))); A.push(fa[j]);
  }
  // tangents, auto banking from how fast the heading turns, then the frames
  const Ts = P3.map((p, k) => norm(sub(P3[(k + 1) % n], P3[(k - 1 + n) % n])));
  const raw = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    if (A[k].loop) continue;
    const t = Ts[k], up0 = norm(sub([0, 1, 0], mul(t, t[1]))), r0 = cross(t, up0);
    const dT = mul(sub(Ts[(k + 3) % n], Ts[(k - 3 + n) % n]), 1 / (6 * step));
    raw[k] = Math.max(-55, Math.min(55, dot(dT, r0) * 9000));
  }
  // no auto banking in and around a loop (its own frame takes over): fade in over ~60 m either side
  const toLoop = new Float32Array(n).fill(1e9);
  for (let k = 0; k < n; k++) if (A[k].loop) for (let d = -40; d <= 40; d++) { const q = (k + d + n) % n; toLoop[q] = Math.min(toLoop[q], Math.abs(d)); }
  for (let k = 0; k < n; k++) {
    let acc = 0, c = 0; for (let d = -20; d <= 20; d++) { const q = (k + d + n) % n; if (!A[q].loop) { acc += raw[q]; c++; } }
    bank[k] = (c ? acc / c : 0) * Math.max(0, Math.min(1, (toLoop[k] - 4) / 30));
  }
  for (let k = 0; k < n; k++) {
    const t = Ts[k], p = P3[k], a = A[k];
    const upB = a.loop ? norm(sub(a.loop, p)) : [0, 1, 0];
    let up = norm(sub(upB, mul(t, dot(upB, t))));
    const th = (bank[k] * (a.loop ? 0 : 1) + a.roll) * Math.PI / 180;
    const r0 = cross(t, up);
    up = norm(add(mul(up, Math.cos(th)), mul(r0, Math.sin(th))));
    const r = cross(t, up);
    pos.set(p, k * 3); T.set(t, k * 3); N.set(up, k * 3); R.set(r, k * 3);
    width[k] = a.w; road[k] = a.gap ? 0 : 1; glide[k] = a.glide;
  }
  // sideways curvature (1/m, + = bending right): how hard a corner throws you to the outside
  const curv = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const a = (k - 2 + n) % n, b = (k + 2) % n; let c = 0;
    for (let j = 0; j < 3; j++) c += (T[b * 3 + j] - T[a * 3 + j]) / (4 * step) * R[k * 3 + j];
    curv[k] = c;
  }
  // features: control points -> sample index by nearest sample
  const nearestIdx = (c) => { let bi = 0, bd = Infinity; for (let k = 0; k < n; k++) { const d = (pos[k * 3] - c[0]) ** 2 + (pos[k * 3 + 1] - c[1]) ** 2 + (pos[k * 3 + 2] - c[2]) ** 2; if (d < bd) { bd = d; bi = k; } } return bi; };
  const rings = [], pads = [], boxes = [], orbs = [], nitros = [];
  CTRL.forEach((c, i) => {
    if (O[i].ring) rings.push({ i: nearestIdx(c), r: 10, h: typeof O[i].ring === 'number' ? O[i].ring : 0 });
    if (O[i].pad !== undefined) pads.push({ i: (nearestIdx(c) + 20) % n, u: O[i].pad });
    if (O[i].gate) rings.push({ i: (nearestIdx(c) + 10) % n, r: 9, h: 7, gate: true });
    if (O[i].nitro !== undefined) nitros.push({ i: (nearestIdx(c) + 6) % n, u: O[i].nitro === true ? 0 : O[i].nitro, h: O[i].air || 1.9 });
    if (O[i].box) for (const u of [-5.5, 0, 5.5]) boxes.push({ i: (nearestIdx(c) + 10) % n, u, h: O[i].air || 1.8 });
    if (O[i].airRing) rings.push({ i: (nearestIdx(c) + 14) % n, r: 7, h: O[i].airRing, air: true });
  });
  // JET orbs: a short row every ~260 m of road, weaving across it, kept away from pads, boxes and gates
  const busy = [...pads, ...boxes, ...rings, ...nitros].map((f) => f.i);
  for (let k = 60, m = 0; k < n - 30; k += 130, m++) {
    if (!road[k] || !road[(k + 12) % n] || busy.some((b) => Math.abs(b - k) < 30)) continue;
    const u0 = [-5, 0, 5, 0][m % 4];
    if (m % 3 === 2) for (let j = 0; j < 5; j++) orbs.push({ i: k + j * 5, u: u0 * 0.5, h: 4 + Math.sin(j / 4 * Math.PI) * 9 });   // an arc overhead
    else for (let j = 0; j < 3; j++) orbs.push({ i: k + j * 5, u: u0 * (1 - j * 0.4), h: 1.7 });
  }
  const NCP = 16, cps = [];
  for (let c = 1; c <= NCP; c++) cps.push(c === NCP ? n - 1 : Math.round(c * n / NCP));
  return { id: STAGES[id] ? id : 'sky', laps: st.laps, name: st.name, ja: st.ja, L, n, step, pos, T, N, R, width, road, bank, glide, curv, rings, pads, boxes, orbs, nitros, cps };
}

// frame at arc length s (wraps), interpolated between samples
export function frameAt(tr, s, out = {}) {
  const f = ((s % tr.L) + tr.L) % tr.L / tr.step, i = Math.floor(f) % tr.n, j = (i + 1) % tr.n, u = f - Math.floor(f);
  const g = (arr) => [arr[i * 3] + (arr[j * 3] - arr[i * 3]) * u, arr[i * 3 + 1] + (arr[j * 3 + 1] - arr[i * 3 + 1]) * u, arr[i * 3 + 2] + (arr[j * 3 + 2] - arr[i * 3 + 2]) * u];
  out.p = g(tr.pos); out.T = norm(g(tr.T)); out.N = g(tr.N);
  out.N = norm(sub(out.N, mul(out.T, dot(out.N, out.T)))); out.R = cross(out.T, out.N);
  out.w = tr.width[i] + (tr.width[j] - tr.width[i]) * u; out.road = tr.road[i] && tr.road[j]; out.i = i;
  return out;
}
// closest sample to a point, searching around a hint index (or everything when hint < 0)
export function nearest(tr, x, y, z, hint = -1, win = 160) {
  let bi = 0, bd = Infinity;
  const test = (k) => { const d = (tr.pos[k * 3] - x) ** 2 + (tr.pos[k * 3 + 1] - y) ** 2 + (tr.pos[k * 3 + 2] - z) ** 2; if (d < bd) { bd = d; bi = k; } };
  if (hint < 0) { for (let k = 0; k < tr.n; k += 4) test(k); const c = bi; for (let d = -4; d <= 4; d++) test((c + d + tr.n) % tr.n); }
  else for (let d = -win; d <= win; d++) test((hint + d + tr.n) % tr.n);
  const k = bi, dx = x - tr.pos[k * 3], dy = y - tr.pos[k * 3 + 1], dz = z - tr.pos[k * 3 + 2];
  const t = [tr.T[k * 3], tr.T[k * 3 + 1], tr.T[k * 3 + 2]];
  const along = dx * t[0] + dy * t[1] + dz * t[2];
  return { i: k, s: ((k * tr.step + along) % tr.L + tr.L) % tr.L, d: Math.sqrt(bd),
    u: dx * tr.R[k * 3] + dy * tr.R[k * 3 + 1] + dz * tr.R[k * 3 + 2], h: dx * tr.N[k * 3] + dy * tr.N[k * 3 + 1] + dz * tr.N[k * 3 + 2] };
}
// quaternion [x, y, z, w] for an object whose local +z is fwd and +y is up
export function quatFromFrame(T, N) {
  const X = cross(N, T), m00 = X[0], m01 = N[0], m02 = T[0], m10 = X[1], m11 = N[1], m12 = T[1], m20 = X[2], m21 = N[2], m22 = T[2];
  const tr = m00 + m11 + m22;
  let x, y, z, w;
  if (tr > 0) { const s = 0.5 / Math.sqrt(tr + 1); w = 0.25 / s; x = (m21 - m12) * s; y = (m02 - m20) * s; z = (m10 - m01) * s; }
  else if (m00 > m11 && m00 > m22) { const s = 2 * Math.sqrt(1 + m00 - m11 - m22); w = (m21 - m12) / s; x = 0.25 * s; y = (m01 + m10) / s; z = (m02 + m20) / s; }
  else if (m11 > m22) { const s = 2 * Math.sqrt(1 + m11 - m00 - m22); w = (m02 - m20) / s; x = (m01 + m10) / s; y = 0.25 * s; z = (m12 + m21) / s; }
  else { const s = 2 * Math.sqrt(1 + m22 - m00 - m11); w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = 0.25 * s; }
  return [x, y, z, w];
}
export const gridSlot = (tr, slot) => ({ s: tr.L - 14 - Math.floor(slot / 2) * 13, u: slot % 2 ? -4 : 4 });
