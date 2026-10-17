// JET RACER — sky circuit. Game loop, camera, input, HUD and the race flow (online or solo).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildTrack, gridSlot, frameAt, nearest, STAGES, STAGE_IDS } from './track.js';
import { Progress } from './rules.js';
import { buildCraft, Craft, setCarEnv, radialTex, NITRO_MAX, VSONIC } from './craft.js';
import { buildWorld } from './world.js';
import { Online, Solo, BoardLink } from './net.js';
import { Sound } from './audio.js';

const $ = (s) => document.querySelector(s);
const showErr = (m) => { const e = $('#err'); e.textContent = String(m); e.classList.remove('hidden'); };
addEventListener('error', (e) => showErr(e.message + (e.filename ? `\n${e.filename.split('/').pop()}:${e.lineno}` : '')));
addEventListener('unhandledrejection', (e) => showErr(e.reason?.stack || e.reason));

const params = new URLSearchParams(location.search);
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');
let EN = !(navigator.languages || [navigator.language || '']).some((l) => /^ja/i.test(l));
try { const l = localStorage.getItem('jet-lang'); if (l) EN = l === 'en'; } catch { /* ignore */ }
if (params.get('lang')) EN = params.get('lang') === 'en';
const L = (ja, en) => (EN ? en : ja);
let quality = params.get('q') || (isTouch ? 'low' : 'high');
try { quality = localStorage.getItem('jet-q') || quality; } catch { /* ignore */ }
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hex = (c) => '#' + (c ?? 0x888888).toString(16).padStart(6, '0');
const fmt = (ms) => { if (ms == null) return '--:--.--'; const s = Math.max(0, ms) / 1000; return `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`; };
const flag = (cc) => (/^[A-Z]{2}$/.test(cc || '') ? `<img class="flag" src="https://flagcdn.com/20x15/${cc.toLowerCase()}.png" width="20" height="15" alt="${cc}">` : '');
function browserCC() { const l = (navigator.languages || [navigator.language || ''])[0] || ''; const m = l.match(/-([A-Za-z]{2})$/); return m ? m[1].toUpperCase() : (/^ja/i.test(l) ? 'JP' : ''); }
function applyLang() {
  document.documentElement.lang = EN ? 'en' : 'ja';
  for (const el of document.querySelectorAll('[data-en]')) { if (!el.dataset.ja) el.dataset.ja = el.innerHTML; el.innerHTML = EN ? el.dataset.en : el.dataset.ja; }
  $('#lang').textContent = EN ? '日本語' : 'English';
  $('#q-toggle').textContent = (EN ? 'Quality: ' : '画質: ') + (quality === 'high' ? L('高画質', 'High') : L('軽量', 'Light'));
  $('#name').placeholder = L('なまえ', 'Your name');
  if (typeof autoName === 'function') { const v = autoName($('#name').value); if (v !== $('#name').value) { $('#name').value = v; try { if (localStorage.getItem('jet-name')) localStorage.setItem('jet-name', v); } catch { /* ignore */ } } }
  if ($('#stages').firstChild) renderStages();
}

// ------------------------------------------------------------------ renderer
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.3, 9000); scene.add(camera);
let composer, bloom;
function setupComposer() {
  const dpr = Math.min(devicePixelRatio, quality === 'high' ? 1.5 : 1);
  renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight, false);
  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth * dpr, innerHeight * dpr, { type: THREE.HalfFloatType, samples: quality === 'high' ? 4 : 0 }));
  composer.setPixelRatio(dpr); composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.5, 0.5, 0.9); composer.addPass(bloom);
  composer.addPass(new OutputPass());
}
setupComposer();
setCarEnv(new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight); });

// ------------------------------------------------------------------ world
let stage = params.get('stage');
try { if (!STAGES[stage]) stage = localStorage.getItem('jet-stage'); } catch { /* ignore */ }
if (!STAGES[stage]) stage = 'sky';
let tr = buildTrack(stage);
let world = buildWorld(scene, tr, quality);
const sound = new Sound();
const me = new Craft(tr);
let myModel = null, myCol = -1;
function setMyColor(col) { if (col === myCol) return; myCol = col; if (myModel) scene.remove(myModel.root); myModel = buildCraft(col); scene.add(myModel.root); }
setMyColor(0xff3b5c);
const myTrail = makeTrails();
const g0 = gridSlot(tr, 0); me.place(g0.s, g0.u);
let myProg = new Progress(tr); myProg.reset(g0.s);

// light trails behind the engines (one ribbon per nozzle)
function makeTrails(col = new THREE.Color(0.25, 0.45, 1.2)) {
  const NP = 36, list = [];
  for (let e = 0; e < 2; e++) {
    const pos = new Float32Array(NP * 2 * 3), colr = new Float32Array(NP * 2 * 3), idx = [];
    for (let i = 0; i < NP - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.frustumCulled = false; scene.add(m);
    list.push({ m, g, pts: [], col });
  }
  return list;
}
const _np = new THREE.Vector3(), _up = new THREE.Vector3();
function updateTrails(trails, model, strength) {
  model.root.updateMatrixWorld();
  _up.set(0, 1, 0).applyQuaternion(model.root.quaternion);
  trails.forEach((t, e) => {
    _np.copy(model.nozzles[e]).applyMatrix4(model.body.matrixWorld);
    const last = t.pts[0];
    if (!last || last.p.distanceToSquared(_np) > 2.2) { t.pts.unshift({ p: _np.clone(), u: _up.clone() }); if (t.pts.length > 36) t.pts.pop(); }
    else last.p.copy(_np);
    const pa = t.g.attributes.position.array, ca = t.g.attributes.color.array, N = t.pts.length;
    for (let i = 0; i < 36; i++) {
      const q = t.pts[Math.min(i, N - 1)], f = i < N ? (1 - i / 36) ** 1.5 * strength : 0, w = 0.28 * (1 - i / 40);
      pa.set([q.p.x + q.u.x * w, q.p.y + q.u.y * w, q.p.z + q.u.z * w, q.p.x - q.u.x * w, q.p.y - q.u.y * w, q.p.z - q.u.z * w], i * 6);
      ca.set([t.col.r * f, t.col.g * f, t.col.b * f, t.col.r * f, t.col.g * f, t.col.b * f], i * 6);
    }
    t.g.attributes.position.needsUpdate = true; t.g.attributes.color.needsUpdate = true;
  });
}

// other racers: their models, trails and name tags
const racers = new Map();   // id -> { model, trails, label, col, name }
function labelTex(name, col) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 112; const x = c.getContext('2d');
  x.font = '900 52px "Noto Sans JP",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const w = Math.min(500, x.measureText(name).width + 70);
  x.fillStyle = 'rgba(16,8,32,.72)'; x.beginPath(); x.roundRect(256 - w / 2, 14, w, 84, 42); x.fill();
  x.fillStyle = hex(col); x.beginPath(); x.arc(256 - w / 2 + 34, 56, 13, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.fillText(name, 256 + 14, 58, 420);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function racerFor(o) {
  let r = racers.get(o.id);
  if (r && (r.col !== o.col || r.name !== o.name)) { dropRacer(o.id); r = null; }
  if (!r) {
    const model = buildCraft(o.col);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex(showName(o.name), o.col), depthTest: false, transparent: true, toneMapped: false, fog: false }));
    label.scale.set(5.6, 1.22, 1); label.position.y = 3.2; label.renderOrder = 20; model.root.add(label);
    scene.add(model.root);
    r = { model, trails: makeTrails(new THREE.Color(o.col).multiplyScalar(0.9)), label, col: o.col, name: o.name };
    racers.set(o.id, r);
  }
  return r;
}
function dropRacer(id) {
  const r = racers.get(id); if (!r) return;
  scene.remove(r.model.root); for (const t of r.trails) { scene.remove(t.m); t.g.dispose(); } r.label.material.map.dispose();
  racers.delete(id);
}

// speed lines around the camera
const speedLines = (() => {
  const N = 220, pos = new Float32Array(N * 6), seed = [];
  for (let i = 0; i < N; i++) { const a = Math.random() * 6.28, r = 5 + Math.random() * 26; seed.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7, z: -Math.random() * 220 }); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color(0.9, 0.85, 1.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.frustumCulled = false; camera.add(m);
  return { m, g, seed, pos };
})();
function updateSpeedLines(dt, speed, boost) {
  const k = Math.max(0, Math.min(1, (speed - 95) / 70)) * (boost ? 1 : 0.6);
  speedLines.m.material.opacity = k * 0.55;
  if (k <= 0) return;
  const len = 4 + speed * 0.08;
  speedLines.seed.forEach((s, i) => {
    s.z += speed * dt * 1.4; if (s.z > 4) { s.z = -220; const a = Math.random() * 6.28, r = 5 + Math.random() * 26; s.x = Math.cos(a) * r; s.y = Math.sin(a) * r * 0.7; }
    speedLines.pos.set([s.x, s.y, s.z, s.x, s.y, s.z - len], i * 6);
  });
  speedLines.g.attributes.position.needsUpdate = true;
}

// ------------------------------------------------------------------ input
const keys = new Set();
const input = { steer: 0, pitch: 0, accel: 0, nitroPress: false, brake: false, boost: false, lift: false, liftPress: false };
let prevLift = false, prevNitro = false;
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys.add(e.code);
  if (e.code === 'KeyC') camMode = (camMode + 1) % 3;
  if (e.code === 'KeyR' && session && (session.phase === 'race' || session.phase === 'wait')) respawn();
  if (e.code === 'KeyM') toggleSound();
  if (spectating() && ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) specNext(e.code === 'ArrowLeft' || e.code === 'KeyA' ? -1 : 1);
  if (lateJoin() && e.code === 'KeyV') setSpecMode(spec.mode === 'ghost' ? 'watch' : 'ghost');
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
const touch = { id: null, x0: 0, y0: 0, x: 0, y: 0, jet: false, nitro: false };
canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' || touch.id !== null) return; touch.id = e.pointerId; touch.x0 = touch.x = e.clientX; touch.y0 = touch.y = e.clientY; });
canvas.addEventListener('pointermove', (e) => { if (e.pointerId === touch.id) { touch.x = e.clientX; touch.y = e.clientY; } });
const tEnd = (e) => { if (e.pointerId === touch.id) touch.id = null; };
canvas.addEventListener('pointerup', tEnd); canvas.addEventListener('pointercancel', tEnd);
for (const [id, k] of [['#b-jet', 'jet'], ['#nitro', 'nitro']]) {
  const b = $(id);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); touch[k] = true; b.classList.add('on'); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { touch[k] = false; b.classList.remove('on'); });
}
function readInput(dt) {
  const k = (...c) => c.some((x) => keys.has(x));
  let st = (k('KeyD', 'ArrowRight') ? 1 : 0) - (k('KeyA', 'ArrowLeft') ? 1 : 0);
  let pt = (k('KeyS', 'ArrowDown') ? 1 : 0) - (k('KeyW', 'ArrowUp') ? 1 : 0);     // up = accelerate, down = brake / dive
  let lift = k('Space', 'KeyJ', 'ShiftLeft', 'ShiftRight', 'KeyK'), acc = 0, nitro = k('KeyN', 'KeyE', 'KeyL');
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g) : null;
  if (gp) {
    if (Math.abs(gp.axes[0]) > 0.12) st = gp.axes[0];
    if (Math.abs(gp.axes[1]) > 0.15) pt = gp.axes[1];
    if (gp.buttons[0]?.pressed || gp.buttons[2]?.pressed) lift = true;
    if (gp.buttons[1]?.pressed || gp.buttons[5]?.pressed) nitro = true;   // B / RB: NITRO
    acc = gp.buttons[7]?.value || 0;                                   // RT: throttle
    if ((gp.buttons[6]?.value || 0) > 0.3) pt = Math.max(pt, 1);       // LT: brake
  }
  const sk = $('#stick');
  if (touch.id !== null) {
    const dx = touch.x - touch.x0, dy = touch.y - touch.y0, R = Math.min(innerWidth, 700) * 0.14;
    st = Math.max(-1, Math.min(1, dx / R)); pt = Math.max(-1, Math.min(1, dy / R));
    if (Math.abs(pt) < 0.25) pt = 0;
    if (pt < 0.35) acc = 1;                                   // thumb on the stick = throttle; pull down to brake
    const d = Math.hypot(dx, dy), m = Math.min(1, 44 / (d || 1));
    sk.classList.remove('off'); sk.style.left = touch.x0 + 'px'; sk.style.top = touch.y0 + 'px';
    sk.firstElementChild.style.transform = `translate(${dx * m}px, ${dy * m}px)`;
  } else sk.classList.add('off');
  if (touch.jet) lift = true; if (touch.nitro) nitro = true;
  input.nitroPress = nitro && !prevNitro; prevNitro = nitro;
  input.steer += (st - input.steer) * Math.min(1, dt * (touch.id !== null || gp ? 30 : 9));
  input.accel = Math.max(acc, -pt);                       // nothing pressed = no throttle (the course only steers the line)
  input.pitch = Math.max(0, pt);
  input.brake = me.mode === 'track' && pt > 0.6;
  // one JET button: boost and climb together
  input.boost = lift; input.lift = lift; input.liftPress = lift && !prevLift; prevLift = lift;
}

// ------------------------------------------------------------------ camera
let camMode = 0;
const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), fov: 70, shake: 0, orbit: 0 };
const _cv = new THREE.Vector3(), _cl = new THREE.Vector3(), _cf = new THREE.Vector3();
function updateCamera(dt, started) {
  if (!started) {
    cam.orbit += dt * 0.15;
    const p = me.pos;
    camera.position.set(p.x + Math.sin(cam.orbit) * 14, p.y + 4 + Math.sin(cam.orbit * 0.6) * 1.5, p.z + Math.cos(cam.orbit) * 14);
    camera.up.set(0, 1, 0); camera.lookAt(p.x, p.y + 0.8, p.z); camera.fov = 55; camera.updateProjectionMatrix();
    cam.pos.copy(camera.position); cam.look.set(p.x, p.y, p.z);
    return;
  }
  const sp = me.speed;
  _cf.copy(me.fwd);
  if (sp > 5) _cf.lerp(_cv.copy(me.vel).normalize(), 0.35).normalize();
  const far = camMode === 1, hood = camMode === 2;
  const dist = hood ? -0.6 : far ? 14 : 7.2, hgt = hood ? 1.05 : far ? 4.4 : 2.3;
  _cv.copy(me.pos).addScaledVector(_cf, -dist).addScaledVector(me.up, hgt);
  _cl.copy(me.pos).addScaledVector(_cf, hood ? 30 : 16).addScaledVector(me.up, hood ? 0.9 : 1.3);
  const k = hood || spectating() ? 1 : 1 - Math.exp(-dt * 14);   // watching: lock on (their position arrives in steps)
  cam.pos.lerp(_cv, k); cam.look.lerp(_cl, hood ? 1 : 1 - Math.exp(-dt * 20));
  cam.up.lerp(me.up, 1 - Math.exp(-dt * (me.mode === 'track' ? 6 : 3))).normalize();
  const fovT = (camera.aspect < 0.8 ? 78 : 68) + Math.min(40, Math.max(0, sp - 80) * 0.17) + (me.boosting ? 7 : 0) + (me.sonic > 0 ? 10 : 0);
  cam.fov += (Math.min(me.sonic > 0 ? 122 : 108, fovT) - cam.fov) * (1 - Math.exp(-dt * 4));
  camera.position.copy(cam.pos);
  if (cam.shake > 0) { camera.position.x += (Math.random() - 0.5) * cam.shake; camera.position.y += (Math.random() - 0.5) * cam.shake; cam.shake *= Math.exp(-dt * 7); }
  camera.up.copy(cam.up); camera.lookAt(cam.look);
  camera.fov = cam.fov; camera.updateProjectionMatrix();
}

// NITRO shockwave: rings blasting out around the car, a white flash, a boom
const waves = [];
const waveMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.7, 2.0), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const waveGeo = new THREE.TorusGeometry(1, 0.04, 6, 64), shellGeo = new THREE.SphereGeometry(1, 32, 16);
function shockwave() {
  for (let k = 0; k < 3; k++) {
    const m = new THREE.Mesh(k < 2 ? waveGeo : shellGeo, waveMat.clone());
    m.position.copy(me.pos).addScaledVector(me.fwd, -4); m.lookAt(_cl.copy(me.pos).add(me.fwd)); if (k === 1) m.rotateX(Math.PI / 2);
    scene.add(m); waves.push({ m, t: -k * 0.06, shell: k === 2 });
  }
  const f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  cam.shake = 1.0; cam.fov += 18; sound.boom();
}
function updateWaves(dt) {
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i]; w.t += dt;
    const t = Math.max(0, w.t), r = w.shell ? 2 + t * 70 : 2 + t * 95;
    w.m.scale.setScalar(r); if (!w.shell) w.m.scale.z = r * 0.3 + 1;
    w.m.material.opacity = w.t < 0 ? 0 : Math.max(0, 1 - t / 0.5) * (w.shell ? 0.05 : 0.4);
    if (w.t > 0.75) { scene.remove(w.m); w.m.material.dispose(); waves.splice(i, 1); }
  }
}

// ------------------------------------------------------------------ race flow
let session = null, started = false, mode = null;
function myName() { let n = ''; try { n = localStorage.getItem('jet-name') || ''; } catch { /* ignore */ } return autoName(n || 'パイロット' + Math.floor(100 + Math.random() * 900)); }
// the generated default name follows the language (パイロット123 <-> Pilot123); a name you typed stays as it is
const autoName = (n) => n.replace(/^(パイロット|Pilot)(\d{3})$/, (m, a, d) => (EN ? 'Pilot' : 'パイロット') + d);
const BOT_EN = { ハヤテ: 'HAYATE', イナズマ: 'INAZUMA', スバル: 'SUBARU', ミカゲ: 'MIKAGE', アラシ: 'ARASHI', ツバメ: 'TSUBAME', コメット: 'COMET' };
const showName = (n) => (EN ? String(n).replace(/^CPU·(.+)$/, (m, a) => 'CPU·' + (BOT_EN[a] || a)) : String(n));
$('#name').value = myName();
const saveName = () => { const v = $('#name').value.trim().slice(0, 16) || myName(); $('#name').value = v; try { localStorage.setItem('jet-name', v); } catch { /* ignore */ } return v; };
$('#name').addEventListener('keydown', (e) => e.stopPropagation());
function begin(m) {
  if (!ready) return;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();   // keys go to the game, not the name box
  sound.pickSong(tr.id); sound.start(); started = true; mode = m;
  $('#title').classList.add('hidden'); $('#hud').classList.remove('hidden');
  const name = saveName();
  session = m === 'online' ? new Online(tr, onEvent, name, browserCC()) : new Solo(tr, onEvent, name, browserCC());
  $('#hud').dataset.stage = tr.id;
  me.hold = m === 'solo'; toGrid(m === 'solo' ? 0 : Math.floor(Math.random() * 8));
  renderPanel();
}
function exitToTitle() {
  if (session) session.close(); session = null; started = false; mode = null;
  for (const id of [...racers.keys()]) dropRacer(id);
  $('#hud').classList.add('hidden'); $('#panel').classList.add('hidden'); $('#record').classList.add('hidden'); $('#title').classList.remove('hidden');
  loadBoards();
  toGrid(0); me.hold = true;
}
// stage select (title): switching rebuilds the world behind the title card as a preview
const STAGE_INFO = {
  sky: ['夕焼けの雲海サーキット。ループと空中ギャップ。', 'Dusk above the clouds: a loop and flying gaps.'],
  twist: ['宇宙空間。コークスクリューにループ、逆さま走行。', 'Deep space: corkscrews, loops, upside-down.'],
  ocean: ['真昼の大海原。大ジャンプで海の上を舞い上がれ。', 'Open sea: soar off the giant ramp.'],
  neon: ['夜のネオン街。巨大タワーの螺旋を登ってダイブ。', 'Neon city: spiral up the tower, then dive.'],
};
function renderStages() {
  $('#stages').innerHTML = STAGE_IDS.map((id) => `<button data-st="${id}" class="${id === stage ? 'on' : ''}"><b>${STAGES[id].name}</b><span>${EN ? '' : STAGES[id].ja + ' · '}${STAGES[id].laps}${L(' 周', ' laps')}${online[id] ? ` <em class="on-n" title="${L('オンライン', 'online')}">●${online[id]}</em>` : ''}</span></button>`).join('');
  $('#stage-desc').textContent = L(...STAGE_INFO[stage]);
  renderStageBest();
  for (const b of document.querySelectorAll('#stages button')) b.onclick = () => { b.blur(); setStage(b.dataset.st); };
}
function setStage(id) {
  if (!STAGES[id] || id === stage && tr.id === id) { renderStages(); return; }
  stage = id; try { localStorage.setItem('jet-stage', id); } catch { /* ignore */ }
  world.dispose(); tr = buildTrack(id); world = buildWorld(scene, tr, quality);
  me.tr = tr; toGrid(0); mapB = mapBounds(); window.__jet.tr = tr; window.__jet.world = world;
  renderStages();
}
$('#go-online').onclick = () => begin('online');
$('#more').onclick = () => $('#credits').classList.remove('hidden');
$('#cr-x').onclick = () => $('#credits').classList.add('hidden');
$('#go-solo').onclick = () => begin('solo');
$('#lang').onclick = () => { EN = !EN; try { localStorage.setItem('jet-lang', EN ? 'en' : 'ja'); } catch { /* ignore */ } applyLang(); };
$('#q-toggle').onclick = () => { quality = quality === 'high' ? 'low' : 'high'; try { localStorage.setItem('jet-q', quality); sessionStorage.setItem('jet-q-note', quality); } catch { /* ignore */ } location.reload(); };
// after a quality switch (which reloads), say which one is now on
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); }
try { const q = sessionStorage.getItem('jet-q-note'); if (q) { sessionStorage.removeItem('jet-q-note'); setTimeout(() => toast(q === 'high' ? L('画質：高画質にしました', 'Quality: HIGH') : L('画質：軽量にしました', 'Quality: LIGHT (faster)')), 600); } } catch { /* ignore */ }
for (const b of document.querySelectorAll('#tools button')) b.addEventListener('click', (e) => {
  e.currentTarget.blur(); const a = b.dataset.act;
  if (a === 'exit') { if (replay) closeReplay(); else exitToTitle(); } if (a === 'cam') camMode = (camMode + 1) % 3; if (a === 'snd') toggleSound();
});
function toggleSound() { sound.setOn(!sound.on); $('#tools [data-act=snd]').textContent = sound.on ? '♪' : '×'; }

function toGrid(slot) {
  const g = gridSlot(tr, Math.max(0, slot));
  me.place(g.s, g.u); me.energy = 1; me.nitro = 0; myProg = new Progress(tr); myProg.reset(g.s);
  if (session) myProg.lapStart = session.startAt || 0;
  cam.pos.copy(me.pos).addScaledVector(me.fwd, -9.5).addScaledVector(me.up, 3); cam.look.copy(me.pos); cam.up.copy(me.up);
}
function respawn() {
  const cp = myProg.cp, s = cp === 0 ? (myProg.lap === 0 ? gridSlot(tr, Math.max(0, session?.me.slot ?? 0)).s : 0) : tr.cps[cp - 1] * tr.step;
  me.respawn(s + 4); flash(L('チェックポイントへ戻った', 'Back to checkpoint'));
}
let msgT = 0, bigT = 0;
function flash(t, dur = 1.4) { const m = $('#msg'); m.textContent = t; m.classList.add('on'); msgT = dur; }
function big(a, b, dur = 1) {
  // one line, shrunk to fit the screen width (Japanese glyphs are ~1em wide, Orbitron ~0.82em)
  const w = [...a].reduce((s, c) => s + (c.charCodeAt(0) > 255 ? 1.05 : 0.82), 0);
  const e = $('#big'); e.innerHTML = `<b style="font-size:min(clamp(70px,16vw,160px),${(90 / Math.max(1, w)).toFixed(2)}vw)">${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ''}`; e.className = ''; void e.offsetWidth; e.className = 'on'; bigT = dur; }

function onEvent(type, d) {
  if (type === 'room') {
    if (session.phase === 'count' && d?.prev !== 'count') { toGrid(session.me.slot); me.hold = true; setMyColor(session.me.col); if (session.raceNo = (session.raceNo || 0) + 1, session.raceNo > 1) sound.pickSong(tr.id); }
    if (session.phase === 'race' && d?.prev === 'count') { me.hold = false; big('GO!', '', 1.1); sound.tone(1320, 0.5, 0.2); myProg.lapStart = session.startAt; }
    if (session.phase === 'wait') { if (d?.prev === 'result') toGrid(Math.floor(Math.random() * 8)); me.hold = false; setMyColor(session.me.col); }
    renderPanel();
  } else if (type === 'lap') {
    saveMyBest(null, d.lapTime);
    const fin = d.lap >= session.laps;
    if (!fin) { big(d.lap === session.laps - 1 ? L('ファイナルラップ', 'FINAL LAP') : `LAP ${d.lap + 1}`, fmt(d.lapTime), 1.6); sound.chime(); }
  } else if (type === 'finish') {
    const pb = saveMyBest(d.time, myProg.best);
    if (rec && rec.f.length > 20) session.sendReplay({ hz: REC_HZ, col: myCol, f: rec.f }); rec = null;
    big(L(`${d.place}位 ゴール！`, `FINISH #${d.place}`), fmt(d.time) + (pb ? L('  自己ベスト！', '  PERSONAL BEST!') : ''), 3.5); sound.fanfare();
  } else if (type === 'otherFinish') flash(L(`${d.name} がゴール（${d.place}位）`, `${showName(d.name)} finished #${d.place}`), 2);
  else if (type === 'result') renderPanel();
  else if (type === 'record') showRecord(d);
  else if (type === 'signed') { renderPanel(); loadBoards(); }
}

// ------------------------------------------------------------------ records: my best per stage (this browser), the world board, signing
function myBest(id = tr.id) { try { return JSON.parse(localStorage.getItem('jet-my-' + id) || 'null') || {}; } catch { return {}; } }
// returns true when the race time is a new personal best
function saveMyBest(race, lap) {
  const b = myBest(); let pb = false;
  if (race != null && race > 0 && (b.race == null || race < b.race)) { b.race = Math.round(race); pb = true; }
  if (lap != null && lap > 0 && (b.lap == null || lap < b.lap)) b.lap = Math.round(lap);
  try { localStorage.setItem('jet-my-' + tr.id, JSON.stringify(b)); } catch { /* ignore */ }
  return pb;
}
let boards = null, boardLink = null, online = {};
// keep the per-stage online counts fresh while the title is up
setInterval(() => { if (!session && !replay && !document.hidden) loadBoards(); }, 15000);
async function loadBoards() {
  boardLink = boardLink || new BoardLink();
  const r = await boardLink.ask({ t: 'boards' }, 'boards');
  if (r) { boards = r.boards; online = r.online || {}; renderStages(); }
}
function renderStageBest() {
  const el = $('#stage-best'); if (!el) return;
  const w = boards?.[stage]?.race?.[0], mb = myBest(stage);
  el.innerHTML = `<div class="sb-w"><b>${L('ワールドレコード', 'WORLD RECORD')}</b>${w ? `${flag(w.cc)}<span class="nm">${esc(w.name)}</span><span class="tm">${fmt(w.time)}</span>${w.msg ? `<q>${esc(w.msg)}</q>` : ''}` : `<span class="nm dim">${L('まだ記録なし', 'no record yet')}</span>`}</div>
    <div class="sb-m"><b>${L('マイベスト', 'MY BEST')}</b><span class="tm">${fmt(mb.race ?? null)}</span><b>${L('ベストラップ', 'BEST LAP')}</b><span class="tm">${fmt(mb.lap ?? null)}</span><button id="sb-ranks">${L('ランキング TOP100', 'TOP 100')}</button>${w?.rid ? `<button id="sb-wr">▶ ${L('WRリプレイ', 'WR replay')}</button>` : ''}</div>`;
  $('#sb-ranks').onclick = () => openRanks();
  if (w?.rid) $('#sb-wr').onclick = () => openReplay(w.rid);
}
const CCS = ['JP', 'US', 'KR', 'TW', 'CN', 'HK', 'TH', 'VN', 'PH', 'ID', 'MY', 'SG', 'IN', 'AU', 'NZ', 'CA', 'MX', 'BR', 'AR', 'GB', 'IE', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'UA', 'RU', 'TR', 'IL', 'AE', 'SA', 'EG', 'ZA'];
const emojiFlag = (cc) => cc ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🏳';
// a top-10 finish: leave a name, a flag and a short comment on the board
function showRecord(d) {
  const box = $('#record'), cc0 = (session?.cc || browserCC() || 'JP').toUpperCase();
  const list = CCS.includes(cc0) ? CCS : [cc0, ...CCS];
  box.innerHTML = `<div class="rc-card">
      <div class="rc-h">${d.rank === 1 ? L('ワールドレコード！', 'WORLD RECORD!') : L(`ランキング ${d.rank} 位！`, `RANKED #${d.rank}!`)}</div>
      <div class="rc-sub">${tr.name} · ${d.kind === 'race' ? L('レースタイム', 'race time') : L('ベストラップ', 'best lap')} <b>${fmt(d.time)}</b></div>
      <label>${L('なまえ', 'Name')}<input id="rc-name" maxlength="16" value="${esc(session?.name || $('#name').value)}"></label>
      <label>${L('国旗', 'Flag')}<span class="rc-flag"><span id="rc-fl">${flag(cc0)}</span><select id="rc-cc">${list.map((c) => `<option value="${c}"${c === cc0 ? ' selected' : ''}>${emojiFlag(c)} ${c}</option>`).join('')}<option value="">${L('なし', 'none')}</option></select></span></label>
      <label>${L('ひとことコメント', 'Comment')}<input id="rc-msg" maxlength="40" placeholder="${L('例：ニトロ2連で決めた！', 'e.g. double nitro did it!')}"></label>
      <div class="rc-row"><button id="rc-skip">${L('あとで', 'Skip')}</button><button id="rc-ok" class="primary">${L('記録する', 'Save')}</button></div>
    </div>`;
  box.classList.remove('hidden');
  for (const i of box.querySelectorAll('input')) i.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') $('#rc-ok').click(); });
  $('#rc-cc').onchange = () => { $('#rc-fl').innerHTML = flag($('#rc-cc').value); };
  $('#rc-skip').onclick = () => box.classList.add('hidden');
  $('#rc-ok').onclick = () => {
    const name = $('#rc-name').value.trim().slice(0, 16) || session?.name || 'NoName';
    session?.sign(d.token, name, $('#rc-cc').value, $('#rc-msg').value.trim().slice(0, 40));
    box.classList.add('hidden'); flash(L('記録しました', 'Saved'), 1.4);
  };
}

// lobby / result panel
function renderPanel() {
  const p = $('#panel'); if (!session) { p.classList.add('hidden'); return; }
  const ph = session.phase;
  let h = '';
  p.classList.remove('center');
  if (ph === 'connecting') h = `<div class="p-h">${L('サーバーに接続中…', 'Connecting…')}</div>`;
  else if (ph === 'offline') h = `<div class="p-h">${L('接続できません — 再接続しています', 'Offline — reconnecting')}</div><div class="p-row"><button id="p-solo">${L('ソロで走る', 'Play solo')}</button></div>`;
  else if (ph === 'wait' && mode === 'online') {
    const ppl = [{ name: session.name, cc: session.cc, col: session.me.col, ready: session.me.ready, me: true }, ...[...session.others.values()].filter((o) => !o.bot)];
    h = `<div class="p-h">${L('オンラインレース', 'ONLINE RACE')}</div><div class="p-sub">${tr.name} · ${L(`${tr.laps} 周 · 最大 8 人 · 足りない分は CPU`, `${tr.laps} laps · up to 8 · CPUs fill the grid`)}</div>
      <div class="p-count">${L('スタートまで', 'Starts in')} <b id="p-clock">–</b> ${L('秒', 's')}</div>
      <ul class="p-list">${ppl.map((q) => `<li class="${q.me ? 'me' : ''}"><i style="background:${hex(q.col)}"></i>${flag(q.cc)}<span class="nm">${esc(q.name)}</span>${q.ready ? `<em>${L('準備OK', 'READY')}</em>` : ''}</li>`).join('')}</ul>
      <div class="p-row"><input id="p-name" maxlength="16" value="${esc(session.name)}"${session.me.ready ? ` disabled title="${L('準備OKを解除すると変更できます', 'Cancel ready to change it')}"` : ''}><button id="p-ready" class="${session.me.ready ? 'on' : ''}">${session.me.ready ? L('準備OK ✓', 'Ready ✓') : L('準備OK', 'Ready')}</button></div>
      <div class="p-note">${L('全員が準備OKで 3 秒後にスタート。待つ間はコースを自由に走れます。', 'Starts 3 s after everyone is ready. Fly the course while you wait.')}</div>${ppl.length < 2 ? `<div class="p-note">${L('オンラインはステージごとに部屋が分かれています。一緒に走るには同じステージを選んでください。', 'Rooms are per stage: pick the same stage to race together.')}${otherStages()}</div>` : ''}${bestHtml()}`;
  } else if (ph === 'result' && session.result) {
    p.classList.add('center');
    h = `<div class="p-h">${L('レース結果', 'RESULT')}</div>
      <ul class="p-list">${session.result.map((r) => `<li class="${r.id === session.me.id ? 'me' : ''}"><span class="rk">${r.place}</span><i style="background:${hex(r.col)}"></i>${flag(r.cc)}<span class="nm">${esc(r.name)}</span><span class="bl">${r.best ? 'BL ' + fmt(r.best).slice(1) : ''}</span><span class="tm">${r.time != null ? fmt(r.time) : 'DNF'}</span></li>`).join('')}</ul>
      <div class="p-count">${L('次のレースまで', 'Next race in')} <b id="p-clock">–</b> ${L('秒', 's')}</div>${bestHtml()}`;
  }
  if (!h) { p.classList.add('hidden'); return; }
  const old = $('#p-name'), typing = old && document.activeElement === old ? old.value : null;
  p.innerHTML = h + '<button class="p-x" id="p-exit">×</button>'; p.classList.remove('hidden');
  const nm = $('#p-name');
  if (nm) {
    if (typing !== null) { nm.value = typing; nm.focus(); }
    nm.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') nm.blur(); });
    nm.addEventListener('change', () => { const v = nm.value.trim().slice(0, 16) || session.name; $('#name').value = v; saveName(); session.setName(v); });
  }
  const rb = $('#p-ready'); if (rb) rb.onclick = () => {
    rb.blur();
    // a name still being typed is sent before the ready (after that it's locked)
    if (nm && !session.me.ready) { const v = nm.value.trim().slice(0, 16) || session.name; if (v !== session.name) { $('#name').value = v; saveName(); session.setName(v); } }
    session.setReady(!session.me.ready);
  };
  const ps = $('#p-solo'); if (ps) ps.onclick = () => { exitToTitle(); begin('solo'); };
  $('#p-exit').onclick = () => exitToTitle();
}
function otherStages() {
  const l = STAGE_IDS.filter((id) => id !== tr.id && online[id]).map((id) => `${STAGES[id].name} ${online[id]}${L('人', '')}`);
  return l.length ? `<br>${L('いま他のステージ：', 'Online elsewhere: ')}${l.join(' / ')}` : '';
}
function bestHtml() {
  const b = session.best; if (!b || (!b.race?.length && !b.lap?.length)) return '';
  const li = (l) => l.slice(0, 5).map((r, i) => `<li><span class="rk">${i + 1}</span>${flag(r.cc)}<span class="nm">${esc(r.name)}${r.msg ? `<q>${esc(r.msg)}</q>` : ''}</span><span class="tm">${fmt(r.time)}</span></li>`).join('');
  return `<div class="p-cols"><div><div class="p-bt">${L('レース', 'RACE')}</div><ul class="p-list">${li(b.race || [])}</ul></div><div><div class="p-bt">${L('ベストラップ', 'BEST LAP')}</div><ul class="p-list">${li(b.lap || [])}</ul></div></div>`;
}

// ------------------------------------------------------------------ minimap
const mapCv = $('#map'), mapX = mapCv.getContext('2d');
let mapB = mapBounds();
function mapBounds() {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let k = 0; k < tr.n; k++) { x0 = Math.min(x0, tr.pos[k * 3]); x1 = Math.max(x1, tr.pos[k * 3]); z0 = Math.min(z0, tr.pos[k * 3 + 2]); z1 = Math.max(z1, tr.pos[k * 3 + 2]); }
  const S = 200, pad = 16, sc = (S - pad * 2) / Math.max(x1 - x0, z1 - z0);
  return { f: (x, z) => [pad + (x - x0) * sc + ((S - pad * 2) - (x1 - x0) * sc) / 2, pad + (z - z0) * sc + ((S - pad * 2) - (z1 - z0) * sc) / 2] };
}
function drawMap() {
  const x = mapX; x.clearRect(0, 0, 200, 200);
  x.lineWidth = 5; x.lineCap = 'round';
  for (let k = 0; k < tr.n; k += 2) {
    const a = mapB.f(tr.pos[k * 3], tr.pos[k * 3 + 2]), j = (k + 2) % tr.n, b = mapB.f(tr.pos[j * 3], tr.pos[j * 3 + 2]);
    x.strokeStyle = tr.road[k] ? 'rgba(255,255,255,.55)' : 'rgba(255,200,74,.45)';
    if (!tr.road[k]) x.setLineDash([3, 4]); else x.setLineDash([]);
    x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke();
  }
  x.setLineDash([]);
  const dot = (px, pz, col, r) => { const [u, v] = mapB.f(px, pz); x.fillStyle = col; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.arc(u, v, r, 0, 7); x.fill(); x.stroke(); };
  for (const [id, r] of racers) if (r.model.root.visible) dot(r.model.root.position.x, r.model.root.position.z, hex(r.col), 4.5);
  dot(me.pos.x, me.pos.z, '#fff', 6);
}

// ------------------------------------------------------------------ loop
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
let last = performance.now(), sendT = 0, ready = false, hudT = 0, t0 = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  readInput(dt);
  if (session?.tick) session.tick(dt);
  if (replay) stepReplay(dt);
  else if (spectating()) stepSpectate();
  else simulate(dt, started ? input : { steer: 0, pitch: 0 });
  frameRest(now, dt);
}
// car-to-car contact: boxes in the course frame (4.4 m long, 2 m wide). Side contact shoves you sideways, nose-to-tail
// contact trades speed (the one behind is held back, the one in front is shoved on). Each client pushes its own car;
// in solo the CPUs get shoved too.
const _bf = {}, _bd = new THREE.Vector3(), _kz = new THREE.Vector3(0, 0, 1), _kx = new THREE.Vector3(1, 0, 0);
// sparks: a pool of glowing streaks flung out from a contact (white-hot -> orange as they cool), plus a flash
const SPK = 420, spkPos = new Float32Array(SPK * 6), spkCol = new Float32Array(SPK * 6), spkVel = new Float32Array(SPK * 3), spkLife = new Float32Array(SPK), spkMax = new Float32Array(SPK);
const spkGeo = new THREE.BufferGeometry();
spkGeo.setAttribute('position', new THREE.BufferAttribute(spkPos, 3)); spkGeo.setAttribute('color', new THREE.BufferAttribute(spkCol, 3));
const spkLines = new THREE.LineSegments(spkGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
const spkHeads = new THREE.Points(spkGeo, new THREE.PointsMaterial({ map: radialTex(), vertexColors: true, size: 0.55, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
spkLines.frustumCulled = spkHeads.frustumCulled = false; scene.add(spkLines, spkHeads);
const spkFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(), color: new THREE.Color(2, 1.4, 0.7), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
scene.add(spkFlash);
let spkI = 0, flashT = 0;
function sparks(p, k, n = Math.round(30 + k * 60)) {
  for (let j = 0; j < n; j++) {
    const i = spkI = (spkI + 1) % SPK, sp = 8 + Math.random() * 26 * (0.5 + k);
    const a = Math.random() * Math.PI * 2, up = Math.random() * 0.9;
    spkPos.set([p.x, p.y + 0.5, p.z, p.x, p.y + 0.5, p.z], i * 6);
    spkVel.set([me.vel.x * 0.8 + Math.cos(a) * sp, up * sp * 0.7 + 2, me.vel.z * 0.8 + Math.sin(a) * sp], i * 3);
    spkLife[i] = spkMax[i] = 0.35 + Math.random() * 0.55;
  }
  if (n > 20) { spkFlash.position.set(p.x, p.y + 0.6, p.z); flashT = 0.18; spkFlash.scale.setScalar(2.5 + k * 3.5); }
}
function updateSparks(dt) {
  const g = 22;
  for (let i = 0; i < SPK; i++) {
    const o = i * 6;
    if (spkLife[i] <= 0) { spkCol.fill(0, o, o + 6); continue; }
    spkLife[i] -= dt; spkVel[i * 3 + 1] -= g * dt;
    const vx = spkVel[i * 3], vy = spkVel[i * 3 + 1], vz = spkVel[i * 3 + 2];
    spkPos[o] += vx * dt; spkPos[o + 1] += vy * dt; spkPos[o + 2] += vz * dt;
    // tail trails behind along the (relative) motion: a streak
    const rx = vx - me.vel.x * 0.8, rz = vz - me.vel.z * 0.8;
    spkPos[o + 3] = spkPos[o] - rx * 0.035; spkPos[o + 4] = spkPos[o + 1] - vy * 0.035; spkPos[o + 5] = spkPos[o + 2] - rz * 0.035;
    const f = Math.max(0, spkLife[i] / spkMax[i]), r = 1.9 * f + 0.35, gg = 1.3 * f * f + 0.2 * f, bb = 0.7 * f * f * f;
    spkCol.set([r, gg, bb, r * 0.25, gg * 0.2, bb * 0.1], o);
  }
  spkGeo.attributes.position.needsUpdate = true; spkGeo.attributes.color.needsUpdate = true;
  if (flashT > 0) { flashT -= dt; spkFlash.material.opacity = Math.max(0, flashT / 0.18) * 0.7; } else spkFlash.material.opacity = 0;
}
let bumpT = 0;
function bumpCars(dt) {
  bumpT -= dt;
  const f = frameAt(tr, me.s, _bf);
  for (const r of racers.values()) {
    if (!r.model.root.visible || r.ghost) continue;   // ghosts pass through
    _bd.copy(me.pos).sub(r.model.root.position);
    const along = _bd.x * f.T[0] + _bd.y * f.T[1] + _bd.z * f.T[2];
    const lat = _bd.x * f.R[0] + _bd.y * f.R[1] + _bd.z * f.R[2];
    const up = _bd.x * f.N[0] + _bd.y * f.N[1] + _bd.z * f.N[2];
    const pl = 2.1 - Math.abs(lat), pa = 4.4 - Math.abs(along);
    if (pl <= 0 || pa <= 0 || Math.abs(up) > 1.8) continue;
    const sp = r.sp ?? me.v, bot = session?.bots?.find((b) => b.id === r.id);
    let hard = 0, side = 0;
    if (pl * 2.1 < pa) {                       // side by side: shove apart
      const sg = Math.sign(lat) || 1; side = sg;
      me.u += sg * pl * 0.6; hard = Math.abs(me.vu - sg * 6);
      me.vu = sg * Math.max(7, Math.abs(me.vu) * 0.6 + 5);
      if (bot) bot.u -= sg * pl * 0.6;
    } else if (along < 0) {                    // I'm behind: bump their tail, lose speed
      hard = Math.max(0, me.v - sp);
      me.s -= pa * 0.5; me.v = Math.min(me.v, sp * 0.96); me.vu += (Math.random() - 0.5) * 6;
      if (bot) bot.v = Math.max(bot.v, bot.v + hard * 0.4);
    } else {                                   // rammed from behind: shoved forward
      hard = Math.max(0, sp - me.v);
      me.s += pa * 0.5; me.v = Math.max(me.v, sp * 0.92);
      if (bot) bot.v = Math.min(bot.v, me.v * 0.95);
    }
    if (bumpT > 0) sparks(_bd.copy(me.pos).add(r.model.root.position).multiplyScalar(0.5), 0.4, 5);   // grinding along: a steady spray
    // reaction: both cars heel / pitch, sparks fly, a clank (a soft scrape for light contact)
    if (bumpT <= 0) {
      const k = Math.min(1, 0.25 + hard * 0.035);
      if (side) { me.tiltV += side * (3 + hard * 0.25); r.tiltV = (r.tiltV || 0) - side * (3 + hard * 0.25); }
      else { const fr = along < 0 ? 1 : -1; me.pjV += fr * (2.5 + hard * 0.15); r.pjV = (r.pjV || 0) - fr * (2.5 + hard * 0.15); }
      sparks(_bd.copy(me.pos).add(r.model.root.position).multiplyScalar(0.5), k);
      bumpT = hard > 2 ? 0.25 : 0.12; cam.shake = Math.max(cam.shake, 0.15 + k * 0.6);
      if (hard > 2) sound.crash(k); else sound.thud(0.18);
    }
  }
}

// one physics step of the player's machine: substeps, its events, rings, progress
function simulate(dt, inp) {
  const sub = Math.ceil(dt / (1 / 120));
  for (let i = 0; i < sub; i++) { me.update(dt / sub, i === 0 ? inp : { ...inp, liftPress: false }); }
  if (started && !lateJoin()) bumpCars(dt);   // a ghost passes through
  // events from the machine
  while (me.events.length) {
    const ev = me.events.shift();
    if (ev === 'pad') { flash('BOOST!', 0.8); sound.tone(880, 0.12, 0.15); cam.shake = 0.25; }
    else if (ev === 'wall') { cam.shake = 0.35; sound.thud(0.25); }
    else if (ev === 'hard') { flash(L('ハードランディング', 'HARD LANDING')); cam.shake = 0.8; sound.thud(0.6); }
    else if (ev === 'land') { cam.shake = 0.3; sound.thud(0.3); }
    else if (ev === 'jump') flash(L('ジャンプ！ジェットで飛べ', 'JUMP! fly it'), 1);
    else if (ev === 'fall') { respawn(); }
    else if (ev === 'nitro') shockwave();
  }
  // rings: pass through for a speed burst
  for (const r of world.rings) {
    const d = _cl.copy(me.pos).sub(r.c), along = d.dot(r.T);
    if (Math.abs(along) < 3 && d.length() < r.r && r.hit <= 0) { r.hit = 1.2; me.v = Math.max(me.v, Math.min(260, me.v * (r.gate ? 1.14 : 1.18))); me.energy = Math.min(1, me.energy + 0.2); flash(r.gate ? 'DASH!' : 'RING +', 0.8); sound.chime(); cam.shake = 0.2; }
  }
  // item boxes: a random speed item; JET orbs: energy
  for (const b of world.boxes) if (b.cool <= 0 && me.pos.distanceToSquared(b.c) < 7) {
    b.cool = 4; const r = Math.random();
    if (r < 0.4) { me.v = Math.min(260, me.v + 55); me.turbo = Math.max(me.turbo, 1); flash(L('ロケット！', 'ROCKET!'), 1.2); cam.shake = 0.5; }
    else if (r < 0.75) { me.turbo = 3.5; flash(L('ターボ 3.5秒', 'TURBO 3.5s'), 1.2); }
    else { me.energy = 1; me.turbo = Math.max(me.turbo, 1.2); flash(L('ジェット満タン', 'JET FULL'), 1.2); }
    sound.item();
  }
  for (const q of world.nitros) if (q.cool <= 0 && me.nitro < NITRO_MAX && me.pos.distanceToSquared(q.c) < 9) {
    q.cool = 6; me.nitro++; flash(`NITRO +1  (${me.nitro}/${NITRO_MAX})`, 1.2); sound.item();
  }
  for (const o of world.orbs) if (o.cool <= 0 && me.pos.distanceToSquared(o.c) < 6) { o.cool = 8; me.energy = Math.min(1, me.energy + 0.12); sound.tone(1568 + Math.random() * 200, 0.08, 0.06, 'sine'); }
  if (session && started && session.phase === 'race' && session.me.racing && session.me.fin === null) myProg.update(me.pos.x, me.pos.y, me.pos.z, session.now());
}
// compressed-air vents: puffs (and a "pshh") while slowing hard, a big blow-off when coming to a stop
const STM = 60, steam = [];
const stmMat = new THREE.SpriteMaterial({ map: radialTex(), color: 0xeef4ff, transparent: true, opacity: 0, depthWrite: false });
for (let i = 0; i < STM; i++) { const sp = new THREE.Sprite(stmMat.clone()); sp.visible = false; scene.add(sp); steam.push({ sp, v: new THREE.Vector3(), life: 0, max: 1, s0: 1 }); }
const VENTS = [[0.85, 0.35, 1.2], [-0.85, 0.35, 1.2], [0.9, 0.3, -1.1], [-0.9, 0.3, -1.1]];   // car-local: left/right, front/rear (x = left)
const _sv = new THREE.Vector3(), _so = new THREE.Vector3();
let stmI = 0, puffT = 0, lastV = 0, fastV = 0;
function puff(k, big = false) {
  if (!myModel) return;
  myModel.root.updateMatrixWorld();
  for (const [x, y, z] of VENTS) {
    if (!big && Math.random() < 0.35) continue;
    for (let j = 0; j < (big ? 4 : 2); j++) {
      const p = steam[stmI = (stmI + 1) % STM];
      _sv.set(x, y - 0.55, z).applyMatrix4(myModel.root.matrixWorld);
      _so.set(Math.sign(x) * (2 + Math.random() * 3), 0.6 + Math.random() * 1.4, (Math.random() - 0.5) * 2).applyQuaternion(me.quat);
      p.sp.position.copy(_sv); p.v.copy(me.vel).multiplyScalar(0.8).add(_so.multiplyScalar(big ? 1.6 : 1));
      p.life = p.max = (big ? 1.4 : 0.8) + Math.random() * 0.4; p.s0 = (big ? 1.4 : 0.8) * (0.6 + k * 0.6);
      p.sp.visible = true;
    }
  }
  sound.psh(big ? 0.32 : 0.12 + k * 0.12, big ? 0.7 : 0.18 + Math.random() * 0.1);
}
function updateSteam(dt) {
  // detect hard slowing (on the road, not just turbo ending) and the moment you come to rest
  const v = me.v, dv = (v - lastV) / Math.max(dt, 1e-3); lastV = v;
  fastV = Math.max(v, fastV - dt * 15);
  if (started && !replay && me.mode === 'track' && v > 6 && (dv < -18 || (input.brake && v > 12)) && me.sonic <= 0) {
    puffT -= dt; if (puffT <= 0) { puff(Math.min(1, -dv / 60)); puffT = 0.16 + Math.random() * 0.18; }
  } else puffT = Math.min(puffT, 0.05);
  if (started && !replay && lastStopV > 5 && v <= 5 && fastV > 35) { puff(1, true); fastV = 0; }
  lastStopV = v;
  for (const p of steam) {
    if (p.life <= 0) { if (p.sp.visible) p.sp.visible = false; continue; }
    p.life -= dt; const f = 1 - p.life / p.max;
    p.v.multiplyScalar(Math.exp(-dt * 2.2)); p.v.y += dt * 1.2;
    p.sp.position.addScaledVector(p.v, dt);
    p.sp.scale.setScalar(p.s0 * (1 + f * 5));
    const dc = p.sp.position.distanceTo(camera.position);   // never fog the camera itself
    p.sp.material.opacity = 0.42 * Math.sin(Math.min(1, f * 4) * Math.PI / 2) * (1 - f) * Math.max(0, Math.min(1, (dc - 3) / 7));
  }
}
let lastStopV = 0;

// joined mid-race (online): until the next race you either drive the course as a ghost (see-through for everyone,
// no contact) or watch a racer (the camera follows them; ◀ ▶ / A D / ← → switch). V or the button toggles.
const spec = { id: null, mode: 'ghost' };
const lateJoin = () => mode === 'online' && session && !session.me.racing && (session.phase === 'race' || session.phase === 'count') && !replay;
const spectating = () => lateJoin() && spec.mode === 'watch';
function setSpecMode(m) {
  if (m === spec.mode) return;
  spec.mode = m;
  if (m === 'ghost') {   // drop the ghost onto the course where the camera was
    const q = nearest(tr, me.pos.x, me.pos.y, me.pos.z, -1);
    me.place(q.s, Math.max(-5, Math.min(5, q.u))); me.v = 60; me.hold = false;
    cam.pos.copy(me.pos).addScaledVector(me.fwd, -9.5).addScaledVector(me.up, 3);
  }
  renderSpecBar(true);
}
// see-through look for a ghost car (mine, or another player's ghost run)
function ghostLook(model, on) {
  if (!model || !!model.ghost === on) return; model.ghost = on;
  model.root.traverse((o) => { if (o.isMesh && o.material && o.material.blending === THREE.NormalBlending) { if (on) { o.userData.op = [o.material.transparent, o.material.opacity]; o.material.transparent = true; o.material.opacity = 0.35; o.material.depthWrite = false; } else if (o.userData.op) { [o.material.transparent, o.material.opacity] = o.userData.op; o.material.depthWrite = true; } o.material.needsUpdate = true; } });
}
const setGhostLook = (on) => ghostLook(myModel, on);
// racers in race order (finished first, then by distance)
function specList() {
  return [...session.others.values()].filter((o) => o.racing !== false && racers.get(o.id)?.model.root.visible)
    .sort((a, b) => (a.fin ?? Infinity) - (b.fin ?? Infinity) || (b.dist || 0) - (a.dist || 0));
}
function specNext(d) {
  const l = specList(); if (!l.length) return;
  const i = l.findIndex((o) => o.id === spec.id);
  spec.id = l[((i < 0 ? 0 : i + d) % l.length + l.length) % l.length].id; renderSpecBar(true);
}
// put the view (me.*) on the watched racer: the camera, speedometer and sound follow it
function stepSpectate() {
  const l = specList(); if (!l.length) return;
  if (!l.some((o) => o.id === spec.id)) spec.id = l[0].id;
  const r = racers.get(spec.id); if (!r) return;
  me.pos.copy(r.model.root.position); me.quat.copy(r.model.root.quaternion);
  me.fwd.set(0, 0, 1).applyQuaternion(me.quat); me.up.set(0, 1, 0).applyQuaternion(me.quat);
  me.v = r.sp || 0; me.vu = 0; me.vh = 0; me.vel.copy(me.fwd).multiplyScalar(me.v);
  me.boosting = false; me.sonic = 0; me.mode = 'track'; me.hold = true;
}
let specHtml = '';
function renderSpecBar(force) {
  const bar = $('#spec');
  $('#hud').classList.toggle('spectating', !!spectating());
  if (!lateJoin()) { if (!bar.classList.contains('hidden')) { bar.classList.add('hidden'); spec.mode = 'ghost'; } return; }
  const l = specList(), o = l.find((q) => q.id === spec.id), watch = spec.mode === 'watch';
  const h = `<div class="sp-t">${watch ? L('観戦中', 'Spectating') : L('ゴーストで走行中（他の人には半透明で見えます・当たりません）', 'Ghost run (others see you see-through, no contact)')} — ${L('次のレースから参加します', 'you join the next race')}</div>
    <div class="sp-row">${watch ? `<button data-d="-1">◀</button><div class="sp-who">${o ? `<i style="background:${hex(o.col)}"></i>${flag(o.cc)}<b>${esc(showName(o.name))}</b><span>${l.indexOf(o) + 1}${L('位', 'th')}</span>` : L('レーサーを待っています…', 'waiting for racers…')}</div><button data-d="1">▶</button>` : ''}
      <button class="sp-mode" data-m="${watch ? 'ghost' : 'watch'}">${watch ? L('ゴーストで走る', 'Ghost run') : L('観戦する', 'Watch')}</button></div>`;
  if (h === specHtml && !force && !bar.classList.contains('hidden')) return;
  specHtml = h; bar.innerHTML = h; bar.classList.remove('hidden');
  for (const b of bar.querySelectorAll('button[data-d]')) b.onclick = (e) => { e.currentTarget.blur(); specNext(+b.dataset.d); };
  const mb = bar.querySelector('.sp-mode'); mb.onclick = (e) => { e.currentTarget.blur(); setSpecMode(mb.dataset.m); };
}

// recording of my run (for the replay of a ranked time): REC_HZ frames of [t ms, x, y, z (cm), quaternion (x1000), speed (x10), flags]
const REC_HZ = 10;
let rec = null, recT = 0;
function recordFrame(dt) {
  if (!session || session.phase !== 'race' || !session.me.racing || session.me.fin !== null || replay) { if (session?.phase !== 'race') rec = null; return; }
  if (!rec) { rec = { f: [] }; recT = 0; }
  recT -= dt; if (recT > 0) return; recT += 1 / REC_HZ;
  const t = Math.round(session.now() - session.startAt), q = me.quat;
  if (t < 0 || rec.f.length > 39000) return;
  rec.f.push(t, Math.round(me.pos.x * 100), Math.round(me.pos.y * 100), Math.round(me.pos.z * 100), Math.round(q.x * 1000), Math.round(q.y * 1000), Math.round(q.z * 1000), Math.round(q.w * 1000), Math.round(me.speed * 10), (me.boosting ? 1 : 0) | (me.mode === 'air' ? 2 : 0) | (me.sonic > 0 ? 4 : 0));
}

// ------------------------------------------------------------------ replay player (?replay=ID or ▶ in the rankings)
let replay = null;
const _rq = new THREE.Quaternion(), _rq2 = new THREE.Quaternion(), _rv = new THREE.Vector3(), _rz = new THREE.Vector3(0, 0, 1), _ry = new THREE.Vector3(0, 1, 0);
async function openReplay(id) {
  boardLink = boardLink || new BoardLink();
  toast(L('リプレイを読み込み中…', 'Loading replay…'));
  const r = await boardLink.ask({ t: 'getReplay', id }, 'replayData');
  if (!r || !r.data) { toast(L('リプレイが見つかりません', 'Replay not found')); return; }
  if (session) exitToTitle();
  $('#ranks').classList.add('hidden');
  setStage(r.data.stage);
  replay = { id, d: r.data, e: r.entry, t: 0, speed: 1, playing: true, end: r.data.f[r.data.f.length - 10], hold: 0 };
  setMyColor(r.data.col || 0xff3b5c);
  started = true; me.hold = true; me.energy = 1; me.nitro = 0;
  $('#title').classList.add('hidden'); $('#hud').classList.remove('hidden'); $('#hud').classList.add('replaying');
  const e = r.entry || { name: r.data.name, cc: r.data.cc, time: r.data.time };
  $('#rp-info').innerHTML = `<b>REPLAY</b>${e.rank ? `<span class="rk">${e.rank}${L('位', '')}</span>` : ''}${flag(e.cc)}<span class="nm">${esc(e.name)}</span><span class="tm">${fmt(e.time)}</span>${e.msg ? `<q>${esc(e.msg)}</q>` : ''}<span class="st">${STAGES[r.data.stage].name}</span>`;
  $('#rp-bar').classList.remove('hidden');
  try { history.replaceState(null, '', location.pathname + '?replay=' + encodeURIComponent(id)); } catch { /* ignore */ }
  cam.pos.copy(me.pos); sound.pickSong(tr.id); sound.start();
}
function closeReplay() {
  replay = null; started = false; $('#rp-bar').classList.add('hidden'); $('#hud').classList.remove('replaying');
  try { history.replaceState(null, '', location.pathname); } catch { /* ignore */ }
  setMyColor(0xff3b5c); exitToTitle();
}
function stepReplay(dt) {
  const R = replay, f = R.d.f, N = f.length / 10;
  if (R.playing) R.t += dt * 1000 * R.speed;
  if (R.t > R.end) { R.hold += dt; if (R.hold > 2.5) { R.t = 0; R.hold = 0; } R.t = Math.min(R.t, R.end); }
  // frame pair around R.t (binary search on the time column)
  let lo = 0, hi = N - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (f[mid * 10] <= R.t) lo = mid; else hi = mid; }
  const a = lo * 10, b = hi * 10, u = f[b] > f[a] ? Math.max(0, Math.min(1, (R.t - f[a]) / (f[b] - f[a]))) : 0;
  const L1 = (k) => f[a + k] + (f[b + k] - f[a + k]) * u;
  me.pos.set(L1(1) / 100, L1(2) / 100, L1(3) / 100);
  _rq.set(f[a + 4], f[a + 5], f[a + 6], f[a + 7]).normalize(); _rq2.set(f[b + 4], f[b + 5], f[b + 6], f[b + 7]).normalize();
  me.quat.copy(_rq.slerp(_rq2, u));
  me.fwd.copy(_rz).applyQuaternion(me.quat); me.up.copy(_ry).applyQuaternion(me.quat);
  const fl = f[b + 9]; me.v = L1(8) / 10; me.vu = 0; me.vh = 0; me.vel.copy(me.fwd).multiplyScalar(me.v);
  me.boosting = !!(fl & 1); me.mode = fl & 2 ? 'air' : 'track'; me.sonic = fl & 4 ? 1 : 0;
  me.thrust = me.boosting ? 1.6 : 0.75; me.lift = me.mode === 'air' ? 1.3 : 0.6;
  $('#h-time').textContent = fmt(R.t);
  $('#rp-play').textContent = R.playing ? '❚❚' : '▶'; $('#rp-speed').textContent = '×' + R.speed;
}
async function shareReplay(id) {
  const url = location.origin + location.pathname + '?replay=' + encodeURIComponent(id);
  try { if (navigator.share && isTouch) { await navigator.share({ title: 'JET RACER replay', url }); return; } } catch { /* cancelled */ }
  try { await navigator.clipboard.writeText(url); toast(L('リンクをコピーしました', 'Link copied')); } catch { prompt(L('このリンクをコピー', 'Copy this link'), url); }
}

// ------------------------------------------------------------------ full rankings (100 deep) for the selected stage
let ranksKind = 'race';
async function openRanks() {
  const box = $('#ranks'); box.classList.remove('hidden');
  box.innerHTML = `<div class="rk-card"><div class="rk-h">${STAGES[stage].name} ${L('ランキング', 'RANKING')}</div><div class="p-h">${L('読み込み中…', 'Loading…')}</div><button class="p-x" id="rk-x">×</button></div>`;
  $('#rk-x').onclick = () => box.classList.add('hidden');
  boardLink = boardLink || new BoardLink();
  const r = await boardLink.ask({ t: 'board', stage }, 'board');
  const list = r?.best || { race: [], lap: [] };
  const draw = () => {
    const rows = list[ranksKind] || [];
    box.innerHTML = `<div class="rk-card"><div class="rk-h">${STAGES[stage].name} ${L('ランキング', 'RANKING')}</div>
      <div class="rk-tabs"><button data-k="race" class="${ranksKind === 'race' ? 'on' : ''}">${L('レース', 'RACE')}</button><button data-k="lap" class="${ranksKind === 'lap' ? 'on' : ''}">${L('ベストラップ', 'BEST LAP')}</button></div>
      <ul class="p-list rk-list">${rows.map((e, i) => `<li><span class="rk">${i + 1}</span>${flag(e.cc)}<span class="nm">${esc(e.name)}${e.msg ? `<q>${esc(e.msg)}</q>` : ''}</span><span class="tm">${fmt(e.time)}</span>${e.rid ? `<button class="rk-play" data-r="${esc(e.rid)}" title="replay">▶</button><button class="rk-link" data-r="${esc(e.rid)}" title="link">LINK</button>` : '<span class="rk-play off"></span><span class="rk-link off"></span>'}</li>`).join('') || `<li class="dim">${L('まだ記録なし', 'no records yet')}</li>`}</ul>
      <button class="p-x" id="rk-x">×</button></div>`;
    $('#rk-x').onclick = () => box.classList.add('hidden');
    for (const b of box.querySelectorAll('.rk-tabs button')) b.onclick = () => { ranksKind = b.dataset.k; draw(); };
    for (const b of box.querySelectorAll('.rk-play')) if (b.dataset.r) b.onclick = () => openReplay(b.dataset.r);
    for (const b of box.querySelectorAll('.rk-link')) if (b.dataset.r) b.onclick = () => shareReplay(b.dataset.r);
  };
  draw();
}

function frameRest(now, dt) {
  recordFrame(dt);
  // my model
  if (myModel) {
    myModel.root.visible = !spectating();
    setGhostLook(lateJoin() && spec.mode === 'ghost');
    myModel.root.position.copy(me.pos); myModel.root.quaternion.copy(me.quat);
    myModel.anim(dt, me.speed, me.mode === 'air', me.boosting, me.thrust, me.lift, me.sonic > 0);
    updateTrails(myTrail, myModel, Math.min(1, me.speed / 90) * (me.boosting ? 1.4 : 0.8));
  }
  // progress (for the standings and the respawn point) and pose out
  if (session && started) {
    const sn = session.now();
    sendT -= dt;
    if (sendT <= 0) {
      sendT = 1 / 15;
      const r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;
      const p = [r2(me.pos.x), r2(me.pos.y), r2(me.pos.z), r3(me.quat.x), r3(me.quat.y), r3(me.quat.z), r3(me.quat.w), r2(me.speed), (me.boosting ? 1 : 0) | (me.mode === 'air' ? 2 : 0) | (me.sonic > 0 ? 4 : 0) | (lateJoin() ? 8 : 0)];
      if (p.every(Number.isFinite) && !spectating()) session.sendPose(p, me.respawned);   // a ghost run is sent too (flagged), a watcher isn't
      me.respawned = false;
    }
    // others: interpolate
    const rt = sn - (mode === 'online' ? 130 : 0);
    const seen = new Set();
    for (const o of session.others.values()) {
      seen.add(o.id);
      const r = racerFor(o), b = o.buf;
      if (!b.length) { r.model.root.visible = false; continue; }
      while (b.length > 2 && b[1][0] <= rt) b.shift();
      const A = b[0], B = b[1] || b[0], u = B[0] > A[0] ? Math.max(0, Math.min(1, (rt - A[0]) / (B[0] - A[0]))) : 1, a = A[1], c = B[1];
      r.model.root.visible = sn - b[b.length - 1][0] < 3000;
      r.model.root.position.set(a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u, a[2] + (c[2] - a[2]) * u);
      _q.set(a[3], a[4], a[5], a[6]); _q2.set(c[3], c[4], c[5], c[6]); r.model.root.quaternion.copy(_q.slerp(_q2, u));
      if (r.tiltV || r.tilt || r.pjV || r.pj) {       // knocked by me: sprung roll / pitch
        r.tilt = r.tilt || 0; r.pj = r.pj || 0;
        r.tiltV += (-r.tilt * 70 - r.tiltV * 6) * dt; r.tilt += r.tiltV * dt; r.pjV = r.pjV || 0; r.pjV += (-r.pj * 80 - r.pjV * 7) * dt; r.pj += r.pjV * dt;
        r.model.root.quaternion.multiply(_q.setFromAxisAngle(_kz, r.tilt)).multiply(_q.setFromAxisAngle(_kx, r.pj));
        if (Math.abs(r.tilt) + Math.abs(r.tiltV) + Math.abs(r.pj) + Math.abs(r.pjV) < 1e-3) r.tilt = r.tiltV = r.pj = r.pjV = 0;
      }
      const bo = (c[8] & 1) > 0, sp = c[7]; r.sp = sp; r.id = o.id;
      r.model.anim(dt, sp, (c[8] & 2) > 0, bo, (bo ? 1.6 : 0.75) * Math.min(1, sp / 40), undefined, (c[8] & 4) > 0);
      r.ghost = (c[8] & 8) > 0; ghostLook(r.model, r.ghost);   // someone waiting for the next race, on a ghost run
      r.label.material.opacity = Math.max(0, Math.min(1, (camera.position.distanceTo(r.model.root.position) - 6) / 8));
      updateTrails(r.trails, r.model, r.model.root.visible ? Math.min(1, sp / 90) * (bo ? 1.4 : 0.8) : 0);
    }
    for (const id of [...racers.keys()]) if (!seen.has(id)) dropRacer(id);
  }
  // countdown
  if (session && (session.phase === 'count')) {
    const s = Math.ceil((session.startAt - session.now()) / 1000);
    if (s !== frame.lastBeep && s >= 1 && s <= 3) { frame.lastBeep = s; big(String(s), '', 0.9); sound.tone(660, 0.25, 0.18); }
  } else frame.lastBeep = -1;
  world.update(dt, (now - t0) / 1000, camera.position);
  updateCamera(dt, started);
  updateSpeedLines(dt, me.speed, me.boosting || me.sonic > 0);
  updateWaves(dt); updateSparks(dt); updateSteam(dt);
  sound.update(me.speed, me.thrust, me.boosting, me.mode === 'air');
  sound.setMusic(replay || (session && (session.phase === 'race' || session.phase === 'count')) ? 1 : 0);
  composer.render(dt);
  // HUD
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('#msg').classList.remove('on'); }
  if (bigT > 0) { bigT -= dt; if (bigT <= 0) $('#big').className = 'off'; }
  if (started && (hudT -= dt) <= 0) {
    hudT = 0.05;
    $('#spd').textContent = Math.round(me.speed * 3.6);
    $('#spd').classList.toggle('mach', me.speed > VSONIC * 0.97);
    const ni = $('#nitro').children; for (let i = 0; i < ni.length; i++) ni[i].classList.toggle('on', i < me.nitro);
    if (me.sonic > 0 && me.speed > VSONIC * 0.97 && !frame.mach) { frame.mach = true; flash('MACH 1', 1); }
    if (me.sonic <= 0) frame.mach = false;
    const eb = $('#ebar'); eb.firstElementChild.style.width = (me.energy * 100).toFixed(1) + '%'; eb.classList.toggle('boost', me.boosting); eb.classList.toggle('low', me.energy < 0.15);
    if (session) {
      const sn = session.now(), racing = session.me.racing && (session.phase === 'race' || session.phase === 'count');
      const rows = [{ me: true, fin: session.me.fin, d: myProg.total }];
      for (const o of session.others.values()) if (o.racing !== false) rows.push({ fin: o.fin, d: o.dist || 0 });
      rows.sort((a, b) => (a.fin ?? Infinity) - (b.fin ?? Infinity) || b.d - a.d);
      $('#h-pos').innerHTML = racing ? `${rows.findIndex((r) => r.me) + 1}<small>/${rows.length}</small>` : '-<small></small>';
      if (spectating()) {   // the HUD follows the racer you're watching
        const L2 = specList(), o = L2.find((q) => q.id === spec.id);
        if (o) { $('#h-pos').innerHTML = `${L2.indexOf(o) + 1}<small>/${L2.length}</small>`; $('#h-lap span').textContent = o.fin != null ? 'FINISH' : `${Math.min(session.laps, (o.lap || 0) + 1)}/${session.laps}`; }
        $('#h-time').textContent = fmt(session.phase === 'race' ? sn - session.startAt : 0);
      }
      renderSpecBar();
      $('#h-lap span').textContent = session.me.fin !== null ? 'FINISH' : `${Math.min(session.laps, session.me.lap + 1)}/${session.laps}`;
      $('#h-time').textContent = fmt(session.me.fin ?? (session.phase === 'race' ? sn - session.startAt : 0));
      $('#h-best').textContent = 'BEST LAP ' + fmt(myProg.best);
      const clk = $('#p-clock'); if (clk) clk.textContent = session.phaseEnd ? Math.max(0, Math.ceil((session.phaseEnd - sn) / 1000)) : '–';
    }
    if (Math.floor(now / 100) % 2 === 0) drawMap();
  }
}
applyLang();
renderStages();
loadBoards();
for (const b of document.querySelectorAll('#rp-bar button')) b.addEventListener('click', (e) => {
  e.currentTarget.blur(); const a = b.dataset.rp; if (!replay) return;
  if (a === 'play') replay.playing = !replay.playing;
  if (a === 'restart') { replay.t = 0; replay.hold = 0; replay.playing = true; }
  if (a === 'speed') replay.speed = replay.speed === 1 ? 2 : replay.speed === 2 ? 4 : replay.speed === 4 ? 0.5 : 1;
  if (a === 'cam') camMode = (camMode + 1) % 3;
  if (a === 'link') shareReplay(replay.id);
  if (a === 'close') closeReplay();
});
// a shared link: ?replay=ID (sound needs a tap first)
if (params.get('replay')) { const id = params.get('replay'); const go = () => { if (ready) openReplay(id); else setTimeout(go, 300); }; go(); addEventListener('pointerdown', () => sound.start(), { once: true }); }
requestAnimationFrame((t) => { last = t; frame(t); });
document.fonts.ready.then(() => { ready = true; $('#loading').classList.add('hidden'); });
setTimeout(() => { ready = true; $('#loading').classList.add('hidden'); }, 4000);
// test hook: run the player's physics for a while without rendering
window.__jet = { me, tr, session: () => session, begin, setStage, scene, camera, renderer, world, get prog() { return myProg; },
  sim(sec, inp = {}) { const log = []; for (let t = 0; t < sec; t += 1 / 60) { const ev0 = me.events.slice(); simulate(1 / 60, { steer: 0, pitch: 0, ...inp }); if (me.mode !== log.at(-1)?.[1]) log.push([+t.toFixed(2), me.mode, Math.round(me.s), Math.round(me.speed * 3.6), me.pos.toArray().map(Math.round)]); void ev0; } return log; } };
