// Scene for a stage: themed sky and floor (sea of clouds / space grid / ocean / night city), the circuit (road, neon
// walls, pylons), air rings and dash gates, boost pads, item boxes, JET orbs, the start gantry and scenery.
// Everything goes into one group so a stage can be swapped out (W.dispose()).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { radialTex } from './craft.js';

const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = 8; return t; };

const C = (r, g, b) => new THREE.Vector3(r, g, b);
const _Y = new THREE.Vector3(0, 1, 0);
export const THEMES = {
  sky: { sun: [-0.35, 0.12, -1], top: C(0.05, 0.03, 0.16), mid: C(0.42, 0.12, 0.38), hor: C(1.0, 0.45, 0.25), low: C(0.35, 0.12, 0.25),
    sunA: C(1.0, 0.25, 0.55), sunB: C(1.0, 0.85, 0.3), sunSize: 0.17, stripes: 1, stars: 1, halo: C(1.0, 0.4, 0.3),
    floor: 'clouds', floorY: -160, deco: 'islands', gapTowers: true, mountains: 0x3a1838, pylons: 0x2b2740,
    fog: [0x8a3a6a, 0.00032], hemi: [0xc9a0ff, 0xff8a5c, 1.15], sunLight: [0xffb37a, 2.2], fill: [0x6a8cff, 0.8] },
  twist: { sun: [0.5, 0.25, -0.8], top: C(0.01, 0.0, 0.04), mid: C(0.07, 0.02, 0.17), hor: C(0.3, 0.08, 0.5), low: C(0.03, 0.0, 0.08),
    sunA: C(0.3, 0.9, 1.6), sunB: C(1.4, 0.4, 1.4), sunSize: 0.22, stripes: 0, stars: 2.5, halo: C(0.5, 0.3, 1.0), nebula: 1,
    floor: 'grid', floorY: -140, deco: 'asteroids', gapTowers: false, mountains: null, pylons: null,
    fog: [0x1a0830, 0.00022], hemi: [0x8a7aff, 0x401060, 1.0], sunLight: [0xff9ad8, 1.9], fill: [0x40c0ff, 1.0] },
  ocean: { sun: [0.3, 0.45, -1], top: C(0.12, 0.33, 0.8), mid: C(0.35, 0.6, 0.95), hor: C(0.85, 0.93, 1.0), low: C(0.55, 0.72, 0.9),
    sunA: C(1.6, 1.5, 1.3), sunB: C(1.6, 1.5, 1.3), sunSize: 0.05, stripes: 0, stars: 0, halo: C(1.0, 0.9, 0.7),
    floor: 'ocean', floorY: 0, deco: 'seaIslands', gapTowers: false, mountains: 0x7f9fc0, pylons: 0xc8c4bc,
    fog: [0xbcd8f0, 0.00024], hemi: [0xe4f2ff, 0x3a6a8a, 1.4], sunLight: [0xfff2dd, 2.6], fill: [0x9ac8ff, 0.6] },
  neon: { sun: [-0.6, 0.35, 0.7], top: C(0.0, 0.0, 0.03), mid: C(0.05, 0.02, 0.12), hor: C(0.45, 0.12, 0.4), low: C(0.06, 0.02, 0.1),
    sunA: C(1.3, 1.3, 1.5), sunB: C(1.3, 1.3, 1.5), sunSize: 0.035, stripes: 0, stars: 0.6, halo: C(0.4, 0.4, 0.8),
    floor: 'city', floorY: 0, deco: 'city', gapTowers: true, mountains: null, pylons: 0x2b2740,
    fog: [0x1c0a2c, 0.00045], hemi: [0x7a6aff, 0x301040, 0.9], sunLight: [0xb0b8ff, 1.2], fill: [0xff4fd8, 0.9] },
};

function roadTex() {
  const [c, x] = cnv(256, 512);
  x.fillStyle = '#1a1b26'; x.fillRect(0, 0, 256, 512);
  // fine hex-ish grain
  for (let i = 0; i < 3000; i++) { const v = 22 + Math.random() * 18; x.fillStyle = `rgb(${v},${v},${v + 10})`; x.fillRect(Math.random() * 256, Math.random() * 512, 2, 2); }
  x.strokeStyle = 'rgba(120,140,255,.08)'; x.lineWidth = 2;
  for (let y = 0; y < 512; y += 32) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke(); }
  x.fillStyle = '#e8ecff'; x.fillRect(8, 0, 6, 512); x.fillRect(242, 0, 6, 512);                // edge lines
  x.fillStyle = 'rgba(255,255,255,.55)'; for (let y = 0; y < 512; y += 128) { x.fillRect(84, y, 4, 64); x.fillRect(168, y, 4, 64); }   // lane dashes
  return tex(c, true);
}
function wallTex() {
  const [c, x] = cnv(64, 256);
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,.9)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 256);
  x.fillStyle = 'rgba(255,255,255,.5)'; for (let y = 0; y < 256; y += 64) { x.beginPath(); x.moveTo(0, y + 50); x.lineTo(32, y + 20); x.lineTo(64, y + 50); x.lineTo(64, y + 62); x.lineTo(32, y + 32); x.lineTo(0, y + 62); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function arrowTex() {
  const [c, x] = cnv(128, 256);
  x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 256; y += 64) { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(10, y + 56); x.lineTo(64, y + 8); x.lineTo(118, y + 56); x.lineTo(118, y + 40); x.lineTo(64, y + 24 - 16 + 16); x.lineTo(10, y + 40); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function checkerTex() {
  const [c, x] = cnv(256, 32);
  for (let i = 0; i < 32; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(i * 8, j * 8, 8, 8); }
  return tex(c);
}
function bannerTex(text) {
  const [c, x] = cnv(1024, 128);
  const g = x.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, '#2a0a4a'); g.addColorStop(0.5, '#0a1a4a'); g.addColorStop(1, '#2a0a4a');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 128);
  x.font = '900 78px Orbitron, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = '#ff4fd8'; x.shadowBlur = 18; x.fillStyle = '#fff'; x.fillText(text, 512, 68);
  return tex(c);
}
function towerTex() {
  const [c, x] = cnv(128, 512);
  x.fillStyle = '#0c0e1a'; x.fillRect(0, 0, 128, 512);
  for (let y = 8; y < 512; y += 14) for (let i = 6; i < 128; i += 14) { if (Math.random() < 0.55) { x.fillStyle = Math.random() < 0.8 ? 'rgba(255,190,120,.85)' : 'rgba(120,220,255,.9)'; x.fillRect(i, y, 8, 6); } }
  return tex(c, true);
}

// ---------------------------------------------------------------- floors other than the sea of clouds
function buildFloor(scene, th, U, SUN_DIR) {
  let frag;
  if (th.floor === 'ocean') frag = `
      uniform float time; uniform vec3 sun, cam; varying vec3 vW;
      vec2 wv(vec2 p, vec2 d, float f, float sp){ float x = dot(p, d) * f + time * sp; return d * cos(x) * f; }
      void main(){
        vec2 p = vW.xz;
        vec2 g = wv(p, normalize(vec2(1.0, 0.3)), 0.045, 1.4) * 0.9 + wv(p, normalize(vec2(-0.4, 1.0)), 0.07, 1.9) * 0.6
               + wv(p, normalize(vec2(0.7, -0.8)), 0.16, 2.6) * 0.3 + wv(p, normalize(vec2(-1.0, -0.2)), 0.33, 3.4) * 0.15;
        vec3 n = normalize(vec3(-g.x * 2.2, 1.0, -g.y * 2.2));
        vec3 v = normalize(cam - vW); float dist = length(vW.xz - cam.xz);
        float fr = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 deep = vec3(0.0, 0.1, 0.24), shal = vec3(0.0, 0.32, 0.46), skyc = vec3(0.42, 0.62, 0.88);
        vec3 col = mix(deep, shal, clamp(n.y * 0.5 + g.x * 2.0, 0.0, 1.0) * 0.6);
        col = mix(col, skyc, fr * 0.75);
        vec3 h = normalize(normalize(sun) + v); col += vec3(1.0, 0.95, 0.85) * pow(max(dot(n, h), 0.0), 260.0) * 3.0;
        col = mix(col, vec3(0.74, 0.86, 0.97), pow(clamp(dist / 5000.0, 0.0, 1.0), 1.5));
        gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`;
  else if (th.floor === 'grid') frag = `
      uniform float time; uniform vec3 cam; varying vec3 vW;
      void main(){
        vec2 p = vW.xz / 40.0; vec2 q = abs(fract(p) - 0.5); float w = fwidth(p.x) * 1.5;
        float line = max(1.0 - smoothstep(0.0, w + 0.02, 0.5 - q.x), 1.0 - smoothstep(0.0, w + 0.02, 0.5 - q.y));
        float dist = length(vW.xz - cam.xz);
        vec3 col = vec3(0.02, 0.0, 0.05) + mix(vec3(1.4, 0.2, 1.2), vec3(0.2, 0.9, 1.6), 0.5 + 0.5 * sin(vW.x * 0.002 + time * 0.2)) * line * 0.9;
        col = mix(col, vec3(0.1, 0.03, 0.18), clamp(dist / 3500.0, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`;
  else frag = `
      uniform float time; uniform vec3 cam; varying vec3 vW;
      void main(){
        vec2 p = vW.xz / 90.0; vec2 q = abs(fract(p) - 0.5); float w = fwidth(p.x) * 1.5;
        float line = max(1.0 - smoothstep(0.0, w + 0.01, 0.5 - q.x), 1.0 - smoothstep(0.0, w + 0.01, 0.5 - q.y));
        float dist = length(vW.xz - cam.xz);
        vec3 col = vec3(0.03, 0.02, 0.06) + vec3(1.0, 0.6, 0.3) * line * 0.35;
        col = mix(col, vec3(0.11, 0.04, 0.17), clamp(dist / 3000.0, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.ShaderMaterial({
    uniforms: U, fog: false, extensions: { derivatives: true },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: frag,
  }));
  m.rotation.x = -Math.PI / 2; m.position.y = th.floorY; scene.add(m);
}

// ---------------------------------------------------------------- scenery for the other stages
function decorate(scene, th, tr, quality, clear, rnd, W) {
  const P = tr.pos, n = tr.n, low = quality === 'low';
  if (th.deco === 'asteroids') {
    const rock = new THREE.MeshStandardMaterial({ color: 0x6a5a7a, roughness: 0.85, flatShading: true });
    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.4, 2.2), toneMapped: false });
    const list = [];
    for (let tries = 0; list.length < (low ? 26 : 50) && tries < 900; tries++) {
      const x = -800 + rnd() * 2200, z = -700 + rnd() * 2000, y = -60 + rnd() * 300, s = 6 + rnd() * 30;
      if (!clear(x, y, z, s * 1.4 + 30)) continue;
      const g = new THREE.IcosahedronGeometry(s, 1), pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) { const k = 0.75 + rnd() * 0.5; pa.setXYZ(i, pa.getX(i) * k, pa.getY(i) * k * 0.8, pa.getZ(i) * k); }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, rock); m.position.set(x, y, z); m.rotation.set(rnd() * 6, rnd() * 6, 0); scene.add(m);
      if (rnd() < 0.3) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.35), glow); c.position.y = s * 0.7; m.add(c); }
      list.push({ m, sp: (rnd() - 0.5) * 0.3 });
    }
    W.anim.push((dt) => { for (const a of list) { a.m.rotation.y += a.sp * dt; a.m.rotation.x += a.sp * 0.5 * dt; } });
    // planets floating round the course: banded gas giants, a ringed one, rocky ones, a moon in orbit
    const PLANETS = [
      { p: [1800, 900, -2600], r: 520, c: ['#6a3aa8', '#9a5ad8', '#3a1a6a'], ring: [1.35, 2.0, 0xd8a0ff] },
      { p: [-900, 260, 1500], r: 210, c: ['#d86a3a', '#f0b070', '#8a3a2a'], ring: [1.4, 2.1, 0xffd0a0], moon: 40 },
      { p: [1500, 120, 1700], r: 150, c: ['#2a8ad8', '#7ad0ff', '#1a4a8a'] },
      { p: [-1100, -80, -500], r: 120, c: ['#7a7a8a', '#a0a0b0', '#4a4a5a'], rocky: true },
      { p: [600, 520, -900], r: 70, c: ['#3ad8a0', '#a0ffd8', '#1a6a5a'], moon: 16 },
      { p: [-300, 420, 2100], r: 260, c: ['#d83a6a', '#ff90b0', '#6a1a3a'] },
    ];
    for (const P of PLANETS) {
      const [c2, x2] = cnv(256, 128);
      for (let y = 0; y < 128; y++) { x2.fillStyle = P.c[(Math.floor(y / (P.rocky ? 128 : 6 + rnd() * 10)) + (rnd() < 0.3 ? 1 : 0)) % 3]; x2.fillRect(0, y, 256, 1); }
      if (P.rocky) for (let k = 0; k < 60; k++) { x2.fillStyle = `rgba(0,0,0,${0.15 + rnd() * 0.25})`; x2.beginPath(); x2.arc(rnd() * 256, rnd() * 128, 2 + rnd() * 9, 0, 7); x2.fill(); }
      // pushed far out from the course and drawn faint, like haze in the distance
      const C0 = [470, 60, 430], far = (k) => C0[k] + (P.p[k] - C0[k]) * 2.4;
      P.p = [far(0), Math.max(-200, far(1)), far(2)]; P.r *= 1.5;
      const m = new THREE.Mesh(new THREE.SphereGeometry(P.r, 48, 24), new THREE.MeshBasicMaterial({ map: tex(c2), color: new THREE.Color(0.55, 0.5, 0.75), transparent: true, opacity: 0.32, depthWrite: false, fog: false }));
      m.position.set(...P.p); m.rotation.z = (rnd() - 0.5) * 0.6; scene.add(m);
      if (P.ring) { const g = new THREE.Mesh(new THREE.RingGeometry(P.ring[0] * P.r, P.ring[1] * P.r, 96), new THREE.MeshBasicMaterial({ color: P.ring[2], transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, fog: false })); g.position.copy(m.position); g.rotation.set(1.2 + rnd() * 0.3, rnd() * 0.5, rnd() * 0.5); scene.add(g); }
      if (P.moon) { const mo = new THREE.Mesh(new THREE.SphereGeometry(P.moon, 24, 12), new THREE.MeshBasicMaterial({ color: 0x9a98b0, transparent: true, opacity: 0.3, depthWrite: false, fog: false })); scene.add(mo); const R0 = P.r * 1.9, ph = rnd() * 6; W.anim.push((dt, t) => mo.position.set(P.p[0] + Math.cos(t * 0.15 + ph) * R0, P.p[1] + Math.sin(t * 0.15 + ph) * R0 * 0.3, P.p[2] + Math.sin(t * 0.15 + ph) * R0)); }
      W.anim.push((dt) => { m.rotation.y += dt * 0.03; });
    }
  } else if (th.deco === 'seaIslands') {
    const rock = new THREE.MeshStandardMaterial({ color: 0x7a6e5a, roughness: 0.9, flatShading: true });
    const grass = new THREE.MeshStandardMaterial({ color: 0x3f9a4a, roughness: 0.85, flatShading: true });
    const sand = new THREE.MeshStandardMaterial({ color: 0xe8d8a8, roughness: 0.95 });
    const trunk = new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.9 });
    for (let tries = 0, made = 0; made < (low ? 14 : 26) && tries < 600; tries++) {
      const x = -900 + rnd() * 2600, z = -1100 + rnd() * 2300, s = 25 + rnd() * 70;
      if (!clear(x, 10, z, s + 40)) continue;
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.15, s * 1.3, 3, 14), sand); b.position.y = 0.5; g.add(b);
      const hill = new THREE.Mesh(new THREE.ConeGeometry(s, s * (0.5 + rnd() * 0.7), 9, 3), rnd() < 0.5 ? grass : rock); hill.position.y = s * 0.3; g.add(hill);
      for (let t = 0; t < 4; t++) {
        const a = rnd() * 6.28, rr = s * (0.9 + rnd() * 0.25), h = 8 + rnd() * 5;
        const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, h, 6), trunk); tk.position.set(Math.cos(a) * rr, h / 2 + 1, Math.sin(a) * rr); tk.rotation.z = (rnd() - 0.5) * 0.4; g.add(tk);
        const lv = new THREE.Mesh(new THREE.ConeGeometry(4, 2, 7), grass); lv.position.set(tk.position.x, h + 1.5, tk.position.z); g.add(lv);
      }
      g.position.set(x, 0, z); scene.add(g); made++;
    }
    // puffy clouds
    const cm = new THREE.SpriteMaterial({ map: radialTex(), color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false });
    for (let k = 0; k < (low ? 30 : 60); k++) {
      const x = -1500 + rnd() * 3500, z = -1600 + rnd() * 3300, y = 170 + rnd() * 160;
      for (let j = 0; j < 5; j++) { const sp = new THREE.Sprite(cm); const sc = 60 + rnd() * 90; sp.scale.set(sc * 1.6, sc, 1); sp.position.set(x + (rnd() - 0.5) * 140, y + (rnd() - 0.5) * 20, z + (rnd() - 0.5) * 140); scene.add(sp); }
    }
  } else if (th.deco === 'city') {
    const tt = towerTex(); tt.repeat.set(1, 3);
    const tm = new THREE.MeshStandardMaterial({ map: tt, emissiveMap: tt, emissive: 0xffffff, emissiveIntensity: 1.0, color: 0x262a3e, metalness: 0.5, roughness: 0.5 });
    const crown = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.35, 1.5), toneMapped: false });
    const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    const N = low ? 160 : 320, im = new THREE.InstancedMesh(box, tm, N), cr = new THREE.InstancedMesh(new THREE.BoxGeometry(1.04, 0.012, 1.04), crown, N);
    // a building fits if no part of the course below its roof (plus margin) passes within rad of it
    const roomFor = (x, z, h, rad) => { for (let k = 0; k < n; k += 2) { if (P[k * 3 + 1] > h + 12) continue; const dx = P[k * 3] - x, dz = P[k * 3 + 2] - z; if (dx * dx + dz * dz < rad * rad) return false; } return true; };
    const mt = new THREE.Matrix4(); let c = 0;
    for (let tries = 0; c < N && tries < 5000; tries++) {
      const x = -900 + rnd() * 2400, z = -1000 + rnd() * 2300, w = 22 + rnd() * 34, h = 30 + rnd() * rnd() * 200;
      if (Math.hypot(x - 420, z - 600) < 120) continue;
      if (!roomFor(x, z, h, w * 0.75 + 16)) continue;
      mt.makeScale(w, h, w).setPosition(x, 0, z); im.setMatrixAt(c, mt);
      mt.makeScale(w, h, w).setPosition(x, 0, z); mt.elements[13] = h; cr.setMatrixAt(c, mt); c++;
    }
    im.count = c; cr.count = c; scene.add(im, cr);
    // the mega tower the spiral winds round
    const mtm = new THREE.MeshStandardMaterial({ map: towerTex(), emissiveMap: null, emissive: 0x15183a, color: 0x1a1d30, metalness: 0.7, roughness: 0.3 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(58, 70, 300, 32, 1), mtm); tower.position.set(420, 150, 600); scene.add(tower);
    for (let y = 30; y < 300; y += 24) { const b = new THREE.Mesh(new THREE.TorusGeometry(60 + (300 - y) * 0.04, 0.8, 6, 64), crown); b.rotation.x = Math.PI / 2; b.position.set(420, y, 600); scene.add(b); }
    const spire = new THREE.Mesh(new THREE.ConeGeometry(14, 90, 12), mtm); spire.position.set(420, 345, 600); scene.add(spire);
  }
}

// ---------------------------------------------------------------- item boxes and JET orbs
let _boxTex = null;
function boxTex() {
  if (_boxTex) return _boxTex;
  const [c, x] = cnv(128, 128);
  const g = x.createLinearGradient(0, 0, 128, 128); g.addColorStop(0, '#ff4fd8'); g.addColorStop(0.5, '#ffd34f'); g.addColorStop(1, '#4fe3ff');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(8, 8, 112, 112);
  x.font = '900 88px Orbitron, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.shadowColor = '#000'; x.shadowBlur = 8; x.fillText('?', 64, 70);
  return (_boxTex = tex(c));
}
function buildItems(scene, tr, W, v3, vR, vN, at) {
  const bm = new THREE.MeshBasicMaterial({ map: boxTex(), color: new THREE.Color(1.3, 1.3, 1.3), transparent: true, opacity: 0.92, toneMapped: false });
  const bg = new THREE.BoxGeometry(1.8, 1.8, 1.8);
  for (const b of tr.boxes) {
    const p = at(v3(b.i), vR(b.i), vN(b.i), b.u, b.h ?? 1.8), m = new THREE.Mesh(bg, bm);
    m.position.set(...p); scene.add(m); W.boxes.push({ m, i: b.i, u: b.u, c: m.position, cool: 0 });
  }
  // NITRO canisters: a red bottle with a glowing band, spinning upright
  const nm = new THREE.MeshStandardMaterial({ color: 0xd8102a, metalness: 0.6, roughness: 0.25, emissive: 0x400008 });
  const nb = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.9, 0.2), toneMapped: false });
  const nh = new THREE.SpriteMaterial({ map: radialTex(), color: new THREE.Color(1.6, 0.4, 0.15), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  for (const q of tr.nitros) {
    const p = at(v3(q.i), vR(q.i), vN(q.i), q.u, q.h ?? 1.9), g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.7, 16), nm);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), nm); cap.position.y = 0.85;
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1, roughness: 0.2 })); valve.position.y = 1.45;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.28, 16, 1, true), nb);
    const halo = new THREE.Sprite(nh); halo.scale.set(5, 5, 1);
    g.add(body, cap, valve, band, halo);
    const nn = vN(q.i); g.up.set(...nn); g.lookAt(p[0] + nn[0], p[1] + nn[1], p[2] + nn[2]); g.rotateX(Math.PI / 2);
    g.position.set(...p); scene.add(g); W.nitros.push({ g, i: q.i, c: g.position, cool: 0 });
  }
  const om = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.6, 2.4), toneMapped: false });
  const hm = new THREE.SpriteMaterial({ map: radialTex(), color: new THREE.Color(0.3, 0.9, 1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const og = new THREE.IcosahedronGeometry(0.55, 1);
  for (const o of tr.orbs) {
    const p = at(v3(o.i), vR(o.i), vN(o.i), o.u, o.h ?? 1.7), g = new THREE.Group();
    const core = new THREE.Mesh(og, om); const halo = new THREE.Sprite(hm); halo.scale.set(3.2, 3.2, 1); g.add(core, halo);
    g.position.set(...p); scene.add(g); W.orbs.push({ g, i: o.i, c: g.position, cool: 0 });
  }
}

export function buildWorld(scene0, tr, quality) {
  const th = THEMES[tr.id] || THEMES.sky;
  const root = new THREE.Group(); scene0.add(root);
  const scene = root;
  const W = { root, rings: [], pads: [], boxes: [], orbs: [], nitros: [], anim: [] };
  const SUN_DIR = new THREE.Vector3(...th.sun).normalize();
  // ---------------------------------------------------------------- sky
  const skyU = { sun: { value: SUN_DIR.clone() }, time: { value: 0 }, top: { value: th.top }, mid: { value: th.mid }, hor: { value: th.hor }, low: { value: th.low },
    sunA: { value: th.sunA }, sunB: { value: th.sunB }, sunSize: { value: th.sunSize }, stripes: { value: th.stripes }, stars: { value: th.stars }, halo: { value: th.halo }, nebula: { value: th.nebula || 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w * 0.9999; }',
    fragmentShader: `
      uniform vec3 sun, top, mid, hor, low, sunA, sunB, halo; uniform float time, sunSize, stripes, stars, nebula; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){
        vec3 d = normalize(vD); float y = d.y;
        vec3 col = y > 0.0 ? mix(hor, mid, smoothstep(0.0, 0.18, y)) : mix(hor, low, smoothstep(0.0, 0.25, -y));
        col = y > 0.18 ? mix(mid, top, smoothstep(0.18, 0.75, y)) : col;
        float sd = clamp(dot(d, normalize(sun)), -1.0, 1.0);
        float ang = acos(sd);
        // striped synthwave sun
        float disc = 1.0 - smoothstep(sunSize, sunSize + 0.005, ang);
        float yy = (d.y - sun.y) / sunSize;
        float st = stripes > 0.5 ? step(0.0, sin((yy + time * 0.02) * 40.0) + 0.55 + yy * 1.4) : 1.0;
        vec3 sunC = mix(sunA, sunB, clamp(yy * 0.5 + 0.5, 0.0, 1.0));
        col = mix(col, sunC * 1.6, disc * (yy > 0.0 ? 1.0 : st));
        col += halo * exp(-ang * 6.0) * 0.5;
        if (nebula > 0.0) { float nb = n3(d * 3.0 + vec3(0.0, 0.0, time * 0.003)) * 0.6 + n3(d * 7.0) * 0.4;
          col += mix(vec3(0.35,0.05,0.5), vec3(0.05,0.35,0.6), n3(d * 2.0 + 5.0)) * smoothstep(0.45, 0.9, nb) * 0.6; }
        if (stars > 0.0) { vec3 q = floor(d * 500.0); float s = h(q); col += vec3(step(1.0 - 0.0018 * stars, s)) * smoothstep(-0.05, 0.4, y + (nebula > 0.0 ? 1.0 : 0.0)) * 0.8; }
        gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
  W.skyU = skyU;
  // ---------------------------------------------------------------- sea of clouds
  const cloudU = { time: { value: 0 }, sun: skyU.sun, cam: { value: new THREE.Vector3() } };
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1), new THREE.ShaderMaterial({
    uniforms: cloudU, transparent: false, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float time; uniform vec3 sun, cam; varying vec3 vW;
      float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hs(i), hs(i+vec2(1,0)), f.x), mix(hs(i+vec2(0,1)), hs(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 5; k++) { s += a * n2(p); p *= 2.03; a *= 0.5; } return s; }
      void main(){
        vec2 p = vW.xz * 0.0035 + vec2(time * 0.006, time * 0.002);
        float c = fbm(p) * 0.7 + fbm(p * 3.1 + 7.0) * 0.3;
        vec3 lit = mix(vec3(0.55,0.22,0.45), vec3(1.0,0.62,0.45), smoothstep(0.35, 0.8, c));
        float dist = length(vW.xz - cam.xz);
        vec3 hor = vec3(1.0,0.45,0.3);
        vec3 col = mix(lit, hor, clamp(dist / 4200.0, 0.0, 1.0));
        // sun glint on the cloud tops
        col += vec3(1.0,0.5,0.3) * pow(max(0.0, 1.0 - abs(normalize(vW - cam).x - normalize(sun).x) * 2.0), 6.0) * 0.12;
        gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  clouds.rotation.x = -Math.PI / 2; clouds.position.y = th.floorY;
  if (th.floor === 'clouds') scene.add(clouds); else buildFloor(scene, th, cloudU, SUN_DIR);
  W.cloudU = cloudU;
  // ---------------------------------------------------------------- road
  const n = tr.n, P = tr.pos, Rr = tr.R, Nn = tr.N;
  const rp = [], ru = [], ri = [], wallP = [], wallU = [], wallI = [], edgeL = [], edgeR = [], under = [], underI = [];
  const runs = [];   // contiguous road runs [start, end]
  { let st = -1; for (let k = 0; k <= n; k++) { const on = k < n && tr.road[k]; if (on && st < 0) st = k; if (!on && st >= 0) { runs.push([st, k - 1]); st = -1; } }
    if (runs.length > 1 && runs[0][0] === 0 && runs[runs.length - 1][1] === n - 1) { const last = runs.pop(); runs[0] = [last[0], runs[0][1] + n]; } }
  const v3 = (k) => { k %= n; return [P[k * 3], P[k * 3 + 1], P[k * 3 + 2]]; };
  const vR = (k) => { k %= n; return [Rr[k * 3], Rr[k * 3 + 1], Rr[k * 3 + 2]]; };
  const vN = (k) => { k %= n; return [Nn[k * 3], Nn[k * 3 + 1], Nn[k * 3 + 2]]; };
  const at = (p, r, nn, u, h) => [p[0] + r[0] * u + nn[0] * h, p[1] + r[1] * u + nn[1] * h, p[2] + r[2] * u + nn[2] * h];
  for (const [a, b] of runs) {
    const base = rp.length / 3, wb = wallP.length / 3, ub = under.length / 3;
    for (let k = a; k <= b + 1; k++) {
      const p = v3(k), r = vR(k), nn = vN(k), hw = tr.width[k % n] / 2, sv = k * tr.step / 24;
      rp.push(...at(p, r, nn, -hw, 0), ...at(p, r, nn, hw, 0)); ru.push(0, sv, 1, sv);
      // energy walls on both edges
      for (const sx of [-1, 1]) { wallP.push(...at(p, r, nn, sx * hw, 0), ...at(p, r, nn, sx * hw, 1.6)); wallU.push(sv * 2, 0, sv * 2, 1); }
      edgeL.push(at(p, r, nn, -hw - 0.05, 0.12)); edgeR.push(at(p, r, nn, hw + 0.05, 0.12));
      // underside slab
      under.push(...at(p, r, nn, -hw, -0.05), ...at(p, r, nn, hw, -0.05), ...at(p, r, nn, hw * 0.7, -1.6), ...at(p, r, nn, -hw * 0.7, -1.6));
      if (k <= b) {
        const o = base + (k - a) * 2; ri.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
        for (let sx = 0; sx < 2; sx++) { const w = wb + (k - a) * 4 + sx * 2; wallI.push(w, w + 4, w + 1, w + 1, w + 4, w + 5); }
        const u0 = ub + (k - a) * 4, u1 = u0 + 4;
        underI.push(u0 + 1, u1 + 1, u0 + 2, u0 + 2, u1 + 1, u1 + 2, u0 + 3, u1 + 3, u0, u0, u1 + 3, u1, u0 + 2, u1 + 2, u0 + 3, u0 + 3, u1 + 2, u1 + 3);
      }
    }
  }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ru, 2)); rg.setIndex(ri); rg.computeVertexNormals();
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex(), metalness: 0.5, roughness: 0.32, side: THREE.DoubleSide, envMapIntensity: 1.2 });
  scene.add(new THREE.Mesh(rg, roadMat));
  const ug = new THREE.BufferGeometry(); ug.setAttribute('position', new THREE.Float32BufferAttribute(under, 3)); ug.setIndex(underI); ug.computeVertexNormals();
  scene.add(new THREE.Mesh(ug, new THREE.MeshStandardMaterial({ color: 0x2a2440, metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide })));
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wallP, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(wallU, 2)); wg.setIndex(wallI);
  const wallMat = new THREE.MeshBasicMaterial({ map: wallTex(), color: new THREE.Color(0.25, 0.65, 1.3), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  scene.add(new THREE.Mesh(wg, wallMat)); W.wallMat = wallMat;
  // glowing edge tubes (cyan left, magenta right)
  for (const [pts, col] of [[edgeL, new THREE.Color(0.2, 1.4, 2.2)], [edgeR, new THREE.Color(2.2, 0.35, 1.6)]]) {
    const geos = [];
    let cur = [];
    for (let k = 0; k < pts.length; k++) {
      cur.push(new THREE.Vector3(...pts[k]));
      const brk = k + 1 < pts.length && new THREE.Vector3(...pts[k]).distanceTo(new THREE.Vector3(...pts[k + 1])) > tr.step * 3;
      if (brk || k === pts.length - 1) { if (cur.length > 2) geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cur), cur.length * 2, 0.14, 5, false)); cur = []; }
    }
    if (geos.length) scene.add(new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })));
  }
  // pylons under flat-ish road down into the clouds
  {
    const geos = [], band = [];
    for (const [a, b] of runs) for (let k = a + 10; k <= b - 10; k += 40) {
      const nn = vN(k); if (nn[1] < 0.9) continue;
      if (th.pylons === null) break;
      const p = v3(k), h = p[1] - th.floorY;
      if (h < 4) continue;
      const g = new THREE.CylinderGeometry(0.9, 1.6, h, 10, 1); g.translate(p[0], p[1] - 1.5 - h / 2, p[2]); geos.push(g);
      for (let y = p[1] - 14; y > th.floorY + 10; y -= 26) { const r = new THREE.CylinderGeometry(1.05, 1.05, 0.5, 10, 1, true); r.translate(p[0], y, p[2]); band.push(r); }
    }
    if (geos.length) scene.add(new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ color: th.pylons, metalness: th.floor === 'ocean' ? 0.1 : 0.8, roughness: th.floor === 'ocean' ? 0.8 : 0.35 })));
    if (band.length) scene.add(new THREE.Mesh(mergeGeometries(band), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.4, 1.4), toneMapped: false })));
  }
  // ---------------------------------------------------------------- rings (air gates)
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.2, 0.25), toneMapped: false });
  const ringIn = new THREE.MeshBasicMaterial({ map: radialTex(), color: new THREE.Color(1, 0.55, 0.15), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  for (const r of tr.rings) {
    const g = new THREE.Group(), nn = vN(r.i), p = at(v3(r.i), [0, 0, 0], nn, 0, r.h || 0), T = [tr.T[r.i * 3], tr.T[r.i * 3 + 1], tr.T[r.i * 3 + 2]];
    const rm = ringMat.clone(); if (r.gate || r.air) rm.color.setRGB(0.3, 1.6, 2.4);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r.r, 0.55, 10, 48), rm));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r.r, 32), ringIn); disc.scale.setScalar(2); g.add(disc);
    g.position.set(...p); g.lookAt(p[0] + T[0], p[1] + T[1], p[2] + T[2]);
    scene.add(g); W.rings.push({ g, i: r.i, r: r.r, gate: !!(r.gate || r.air), c: new THREE.Vector3(...p), T: new THREE.Vector3(...T), hit: 0 });
  }
  // ---------------------------------------------------------------- boost pads
  const at3 = arrowTex();
  for (const pd of tr.pads) {
    const k = pd.i, p = v3(k), r = vR(k), nn = vN(k), T = [tr.T[k * 3], tr.T[k * 3 + 1], tr.T[k * 3 + 2]];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 10), new THREE.MeshBasicMaterial({ map: at3, color: new THREE.Color(2.4, 1.0, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const c = at(p, r, nn, pd.u, 0.06);
    const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(...r), new THREE.Vector3(...T), new THREE.Vector3(...nn));
    m.quaternion.setFromRotationMatrix(basis); m.position.set(...c);
    scene.add(m); W.pads.push(m);
  }
  // ---------------------------------------------------------------- start / finish gantry
  {
    const k = 0, p = v3(k), r = vR(k), nn = vN(k), hw = tr.width[k] / 2 + 1.5;
    const g = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: 0x343447, metalness: 0.8, roughness: 0.3 });
    for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9, 0.8), steel); c.position.set(sx * hw, 4.5, 0); g.add(c); }
    const banner = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 0.8, 1.8, 0.5), [steel, steel, steel, steel, new THREE.MeshBasicMaterial({ map: bannerTex(tr.name), toneMapped: false }), new THREE.MeshBasicMaterial({ map: bannerTex(tr.name), toneMapped: false })]);
    banner.position.y = 9; g.add(banner);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 - 3, 2), new THREE.MeshBasicMaterial({ map: checkerTex(), polygonOffset: true, polygonOffsetFactor: -2 }));
    line.rotation.x = -Math.PI / 2; line.position.y = 0.04; g.add(line);
    const T = new THREE.Vector3(tr.T[0], tr.T[1], tr.T[2]);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...r), new THREE.Vector3(...nn), T.clone().negate()));
    g.position.set(...p); scene.add(g);
  }
  // ---------------------------------------------------------------- floating islands and neon towers (kept clear of the course)
  const clear = (x, y, z, rad) => { for (let k = 0; k < n; k += 3) { const dx = P[k * 3] - x, dy = P[k * 3 + 1] - y, dz = P[k * 3 + 2] - z; if (dx * dx + dy * dy + dz * dz < rad * rad) return false; } return true; };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  if (th.deco === 'islands') {
    const rock = new THREE.MeshStandardMaterial({ color: 0x5a4a5e, roughness: 0.9, flatShading: true });
    const grass = new THREE.MeshStandardMaterial({ color: 0x3f8a6a, roughness: 0.8, flatShading: true });
    const isl = [];
    for (let tries = 0; isl.length < (quality === 'low' ? 18 : 34) && tries < 600; tries++) {
      const x = -700 + rnd() * 1600, z = -900 + rnd() * 1800, y = -60 + rnd() * 170, s = 14 + rnd() * 34;
      if (!clear(x, y, z, s * 1.6 + 30)) continue;
      const g = new THREE.Group();
      const bot = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.6, 7, 3), rock); bot.rotation.x = Math.PI; bot.position.y = -s * 0.8;
      const pa = bot.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setXYZ(i, pa.getX(i) * (0.8 + rnd() * 0.4), pa.getY(i), pa.getZ(i) * (0.8 + rnd() * 0.4)); bot.geometry.computeVertexNormals();
      const top = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.02, s, s * 0.18, 7), grass); top.position.y = s * 0.05;
      g.add(bot, top);
      for (let t = 0; t < 3; t++) { const tree = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.4, 5), grass); const a = rnd() * 6.28, rr = rnd() * s * 0.6; tree.position.set(Math.cos(a) * rr, s * 0.3, Math.sin(a) * rr); g.add(tree); }
      g.position.set(x, y, z); g.rotation.y = rnd() * 6.28; scene.add(g); isl.push(g);
    }
    W.islands = isl;
  } else decorate(scene, th, tr, quality, clear, rnd, W);
  if (th.gapTowers) {
    // towers rising from the floor along the jumps
    const tt = towerTex();
    const tm = new THREE.MeshStandardMaterial({ map: tt, emissiveMap: tt, emissive: 0xffffff, emissiveIntensity: 1.1, color: 0x30344a, metalness: 0.5, roughness: 0.5 });
    const crown = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.6, 2.2), toneMapped: false });
    const spots = [];
    for (let k = 0; k < n; k++) if (!tr.road[k] && k % 12 === 0) spots.push(k);
    for (const k of spots) for (const sx of [-1, 1]) {
      const p = v3(k), r = vR(k), off = 34 + rnd() * 30, x = p[0] + r[0] * sx * off, z = p[2] + r[2] * sx * off;
      const top = p[1] + 10 + rnd() * 60, w = 10 + rnd() * 10, h = top - th.floorY;
      if (!clear(x, p[1], z, w + 12)) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), tm); m.material.map.repeat.set(1, h / 60);
      m.position.set(x, top - h / 2, z); scene.add(m);
      const c = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.6, w + 0.6), crown); c.position.set(x, top, z); scene.add(c);
    }
  }
  // distant mountain ring
  if (th.mountains !== null) {
    const N2 = 180, pos = [], idx = [];
    for (let i = 0; i <= N2; i++) {
      const a = i / N2 * Math.PI * 2, r = 3200;
      const hgt = 60 + 300 * Math.pow(Math.abs(Math.sin(a * 3.1) * Math.cos(a * 7.3 + 1) + 0.35 * Math.sin(a * 17.7)), 1.4);
      pos.push(Math.cos(a) * r, th.floorY - 10, Math.sin(a) * r, Math.cos(a) * r, th.floorY - 10 + hgt * (th.floor === 'ocean' ? 0.6 : 1), Math.sin(a) * r);
      if (i < N2) { const o = i * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: th.mountains, side: THREE.DoubleSide, fog: false })));
  }
  // ---------------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(...th.hemi));
  const sun = new THREE.DirectionalLight(...th.sunLight); sun.position.copy(SUN_DIR).multiplyScalar(1000); scene.add(sun);
  const fill = new THREE.DirectionalLight(...th.fill); fill.position.set(400, 300, 600); scene.add(fill);
  scene0.fog = new THREE.FogExp2(...th.fog);
  buildItems(scene, tr, W, v3, vR, vN, at);
  W.update = (dt, t, cam) => {
    skyU.time.value = t; cloudU.time.value = t; cloudU.cam.value.copy(cam);
    wallMat.map.offset.y = 0; wallMat.map.offset.x = -t * 0.6;
    at3.offset.y = -t * 1.6;
    for (const a of W.anim) a(dt, t);
    for (const b of W.boxes) { b.m.rotation.x += dt * 1.3; b.m.rotation.y += dt * 1.9; if (b.cool > 0) b.cool -= dt; b.m.visible = b.cool <= 0; }
    for (const q of W.nitros) { if (q.cool > 0) q.cool -= dt; q.g.visible = q.cool <= 0; q.g.rotateOnAxis(_Y, dt * 2.2); }
    for (const o of W.orbs) { if (o.cool > 0) o.cool -= dt; o.g.visible = o.cool <= 0; o.g.children[0].scale.setScalar(1 + Math.sin(t * 6 + o.i) * 0.12); }
    for (const r of W.rings) { if (r.gate) r.g.children[0].material.color.setRGB(0.3 + (r.hit > 0 ? 1.6 : 0), 1.6, 2.4); else r.g.children[0].material.color.setRGB(2.4, 1.2 + (r.hit > 0 ? 1 : 0), 0.25 + (r.hit > 0 ? 1.6 : 0)); r.g.rotation.z += dt * 0.5; if (r.hit > 0) r.hit -= dt; }
  };
  W.dispose = () => {
    scene0.remove(root);
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      for (const m of [].concat(o.material || [])) { for (const k of ['map', 'emissiveMap']) if (m[k]) m[k].dispose(); m.dispose(); }
    });
  };
  return W;
}
