// ジェットレース（tesra-jet.service, 127.0.0.1:3332）
// nginx: /tesra/jet/ws -> ws://127.0.0.1:3332
// Rooms of up to 8. Clients fly their own machine and send their pose ~15x/s; the server works out checkpoints and laps
// from those positions (same rules as the client's solo mode, ../jet/js/rules.js), fills empty grid slots with CPU
// racers and relays everything.
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { buildTrack, gridSlot, STAGE_IDS } from '../jet/js/track.js';
import { Progress, Bot, BOT_NAMES } from '../jet/js/rules.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3332;
const BEST_FILE = process.env.BEST_FILE || path.join(DIR, 'data', 'jet-best.json');
const REPLAY_DIR = path.join(path.dirname(BEST_FILE), 'jet-replays');   // one JSON file per ranked run
const ROOM_MAX = 8, MIN_GRID = 4;
const T_WAIT = 20000, T_JOIN = 7000, T_READY = 3000, T_COUNT = 5000, T_AFTER = 30000, T_RACE = 300000, T_RESULT = 12000, T_QUIET = 12000;
const COLORS = [0xff3b5c, 0x2f8bff, 0xffc400, 0x2ee59d, 0xff7a1a, 0xb05cff, 0xf2f2f2, 0x17d4e0];
const VMAX = 420;                  // m/s: faster than any machine; poses that jump further are ignored (respawns go backwards)
const tracks = Object.fromEntries(STAGE_IDS.map((id) => [id, buildTrack(id)]));

// best times per stage: { sky: { race: [], lap: [] }, ... }  (old files held sky's lists at the top level)
let best = {};
try { const b = JSON.parse(fs.readFileSync(BEST_FILE, 'utf8')); best = Array.isArray(b.race) ? { sky: b } : b; } catch { /* first run */ }
for (const id of STAGE_IDS) best[id] = { race: [], lap: [], ...(best[id] || {}) };
function saveBest() { try { fs.mkdirSync(path.dirname(BEST_FILE), { recursive: true }); fs.writeFileSync(BEST_FILE + '.tmp', JSON.stringify(best)); fs.renameSync(BEST_FILE + '.tmp', BEST_FILE); } catch (e) { console.error(e); } }
// a new personal best goes on the board; a top-10 place gets a token so the driver can sign it (name, flag, comment)
const signs = new Map();   // token -> { stage, kind, entry, exp }
const TOP = 10, KEEP = 100;  // sign from the top 10; boards (and replays) go 100 deep
const rid = () => crypto.randomBytes(8).toString('base64url');
const replayPath = (id) => path.join(REPLAY_DIR, id.replace(/[^\w-]/g, '') + '.json');
function dropReplay(e) { if (e?.rid) { fs.unlink(replayPath(e.rid), () => {}); delete e.rid; } }
// store a run's recording for its board entry (only race lines inside the top 100)
function saveReplay(stage, e, data, who) {
  if (!e || !best[stage].race.includes(e) || !data || !Array.isArray(data.f) || data.f.length > 40000 || !data.f.every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
  dropReplay(e);
  const id = rid();
  try {
    fs.mkdirSync(REPLAY_DIR, { recursive: true });
    fs.writeFileSync(replayPath(id), JSON.stringify({ v: 1, id, stage, time: e.time, name: who.name, cc: who.cc, hz: Number(data.hz) || 10, col: Number(data.col) || 0xff3b5c, f: data.f, ts: Math.floor(Date.now() / 1000) }));
  } catch (err) { console.error(err); return null; }
  e.rid = id; saveBest();
  return id;
}
function addBest(stage, kind, p, time) {
  const B = best[stage], list = B[kind], i = list.findIndex((b) => b.name === p.name && b.cc === p.cc);
  let msg = '';
  if (i >= 0) { if (list[i].time <= time) return null; msg = list[i].msg || ''; dropReplay(list[i]); list.splice(i, 1); }
  const entry = { name: p.name, cc: p.cc, msg, time: Math.round(time), ts: Math.floor(Date.now() / 1000) };
  list.push(entry); list.sort((a, b) => a.time - b.time);
  for (const e of list.slice(KEEP + 20)) dropReplay(e);
  B[kind] = list.slice(0, KEEP + 20); saveBest();
  const rank = B[kind].indexOf(entry) + 1;
  if (kind === 'race' && rank >= 1 && rank <= KEEP) p.lastEntry = { stage, entry };   // its replay may follow
  if (rank < 1 || rank > TOP) return null;
  const token = crypto.randomBytes(9).toString('base64url');
  signs.set(token, { stage, kind, entry, exp: Date.now() + 15 * 60000 });
  return { kind, rank, time: entry.time, token };
}
function sign(m) {
  const sg = signs.get(String(m.token || '')); if (!sg || sg.exp < Date.now()) return null;
  signs.delete(m.token);
  const e = sg.entry, list = best[sg.stage][sg.kind];
  if (!list.includes(e)) return sg.stage;
  const oldName = e.name, oldCc = e.cc, now = Math.floor(Date.now() / 1000);
  e.name = cleanName(m.name); e.cc = cleanCC(m.cc); e.msg = cleanMsg(m.msg);
  // the same run's other line (lap / race) takes the new name and flag too
  for (const k of ['race', 'lap']) for (const b of best[sg.stage][k]) if (b !== e && b.name === oldName && b.cc === oldCc && now - b.ts < 900) { b.name = e.name; b.cc = e.cc; }
  // one line per driver: drop their other, slower lines
  best[sg.stage][sg.kind] = list.filter((b) => b === e || b.name !== e.name || b.cc !== e.cc || b.time < e.time);
  saveBest();
  return sg.stage;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of signs) if (v.exp < now) signs.delete(k); }, 60000);
const topBest = (stage, n = TOP) => ({ race: best[stage].race.slice(0, n).map(({ ts, ...b }) => b), lap: best[stage].lap.slice(0, n).map(({ ts, ...b }) => b) });
const cleanMsg = (s) => [...String(s || '').replace(/[\u0000-\u001f\u007f<>&"']/g, '').trim()].slice(0, 40).join('');

const cleanName = (s) => [...String(s || '').replace(/[\u0000-\u001f\u007f<>&"']/g, '').trim()].slice(0, 16).join('') || 'NoName';
const cleanCC = (s) => (/^[A-Z]{2}$/.test(String(s || '').toUpperCase()) ? String(s).toUpperCase() : '');
const send = (p, m) => { if (p.ws && p.ws.readyState === 1) p.ws.send(typeof m === 'string' ? m : JSON.stringify(m)); };
const r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;

const rooms = new Set();
let nextId = 1, nextRoom = 1;

class Room {
  constructor(stage) { this.stage = stage; this.track = tracks[stage]; this.id = nextRoom++; this.players = new Map(); this.bots = []; this.phase = 'wait'; this.phaseEnd = 0; this.startAt = 0; this.firstFin = 0; this.racers = []; rooms.add(this); }
  broadcast(m) { const d = JSON.stringify(m); for (const p of this.players.values()) send(p, d); }
  info() {
    const pl = (p) => ({ id: p.id, name: p.name, cc: p.cc, col: p.col, ready: !!p.ready, slot: p.slot, racing: !!p.racing, lap: p.prog?.lap || 0, fin: p.fin ?? null, bot: !!p.bot });
    return { t: 'room', room: this.id, stage: this.stage, phase: this.phase, phaseEnd: this.phaseEnd, startAt: this.startAt, now: Date.now(), laps: this.track.laps, players: [...this.players.values()].map(pl), bots: this.bots.map(pl) };
  }
  sync() { this.broadcast(this.info()); }
  add(p) {
    Object.assign(p, { room: this, ready: false, racing: false, slot: -1, fin: null, prog: null });
    const used = new Set([...this.players.values()].map((q) => q.col));
    p.col = COLORS.find((c) => !used.has(c)) ?? COLORS[p.id % COLORS.length];
    this.players.set(p.id, p);
    if (this.phase === 'wait') this.phaseEnd = Math.max(this.phaseEnd || 0, Date.now() + (this.players.size === 1 ? T_WAIT : T_JOIN));
    this.sync();
  }
  remove(p) {
    this.players.delete(p.id); this.broadcast({ t: 'bye', id: p.id });
    if (!this.players.size) { rooms.delete(this); return; }
    this.checkEnd(); this.checkReady(); this.sync();
  }
  checkReady() { if (this.phase === 'wait' && this.players.size && [...this.players.values()].every((p) => p.ready)) this.phaseEnd = Math.min(this.phaseEnd, Date.now() + T_READY); }
  setPhase(ph, dur) { this.phase = ph; this.phaseEnd = dur ? Date.now() + dur : 0; }
  start() {
    const humans = [...this.players.values()];
    humans.forEach((p, i) => { Object.assign(p, { racing: true, slot: i, fin: null, ready: false, prog: new Progress(this.track), poseT: Date.now(), lastPose: null }); p.prog.reset(gridSlot(this.track, i).s); });
    // CPU racers fill the grid up to MIN_GRID
    const nb = Math.max(0, MIN_GRID - humans.length), names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    const used = new Set(humans.map((p) => p.col));
    this.bots = [];
    for (let k = 0; k < nb; k++) {
      const slot = humans.length + k, b = new Bot(this.track, slot, 0.15 + Math.random() * 0.6);
      Object.assign(b, { id: -(k + 1), name: 'CPU·' + names[k], cc: '', col: COLORS.find((c) => !used.has(c)), bot: true, racing: true, slot, fin: null, prog: new Progress(this.track) });
      used.add(b.col); b.prog.reset(b.s); this.bots.push(b);
    }
    this.racers = [...humans, ...this.bots];
    this.setPhase('count', T_COUNT); this.startAt = this.phaseEnd; this.firstFin = 0;
    for (const r of this.racers) r.prog.lapStart = this.startAt;
    this.sync();
  }
  tick(now, dt) {
    if (this.phase === 'wait' && this.players.size && this.phaseEnd && now >= this.phaseEnd) this.start();
    else if (this.phase === 'count' && now >= this.phaseEnd) { this.setPhase('race', T_RACE); this.sync(); }
    else if (this.phase === 'race') {
      if (now >= this.phaseEnd || (this.firstFin && now >= this.firstFin + T_AFTER)) { this.finish(); return; }
      let drop = false;
      for (const p of this.racers) if (!p.bot && p.racing && p.fin === null && now - (p.poseT || 0) > T_QUIET) { p.racing = false; drop = true; }
      if (drop) { this.sync(); this.checkEnd(); }
    } else if (this.phase === 'result' && now >= this.phaseEnd) {
      for (const p of this.players.values()) Object.assign(p, { racing: false, slot: -1, fin: null, ready: false, prog: null });
      this.bots = []; this.racers = [];
      this.setPhase('wait', this.players.size ? T_WAIT : 0); this.startAt = 0; this.sync();
    }
    // CPU racers drive during the countdown (held) and the race
    if (this.phase === 'count' || this.phase === 'race') {
      const go = this.phase === 'race';
      for (const b of this.bots) {
        if (b.fin !== null) { b.step(dt, true); continue; }
        b.step(dt, go);
        const { p } = b.pose();
        if (go) this.progress(b, p[0], p[1], p[2], now);
      }
    }
  }
  progress(p, x, y, z, now) {
    const ev = p.prog.update(x, y, z, now);
    if (!ev) return;
    if (!p.bot && ev.lapTime > 8000) { const rec = addBest(this.stage, 'lap', p, ev.lapTime); if (rec) p.lapRec = rec; }
    if (ev.finished) {
      p.fin = now - this.startAt;
      if (!this.firstFin) this.firstFin = now;
      const place = this.racers.filter((q) => q.fin !== null).length;
      if (!p.bot) {
        const rec = addBest(this.stage, 'race', p, p.fin) || p.lapRec;
        if (rec) send(p, { t: 'record', stage: this.stage, ...rec });
        p.lapRec = null;
      }
      this.broadcast({ t: 'fin', id: p.id, time: p.fin, place });
      this.checkEnd();
    } else this.broadcast({ t: 'lap', id: p.id, lap: ev.lap, lapTime: ev.lapTime });
  }
  checkEnd() {
    if (this.phase !== 'race' && this.phase !== 'count') return;
    if (!this.racers.some((p) => !p.bot && p.racing && p.fin === null && (this.players.has(p.id)))) this.finish();
  }
  finish() {
    const list = this.racers.filter((p) => p.bot || this.players.has(p.id) || p.fin !== null)
      .map((p) => ({ id: p.id, name: p.name, cc: p.cc, col: p.col, bot: !!p.bot, time: p.fin, best: p.prog?.best ?? null, dist: p.prog ? p.prog.total : 0 }))
      .sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity) || b.dist - a.dist);
    list.forEach((r, i) => { r.place = i + 1; delete r.dist; });
    this.setPhase('result', T_RESULT);
    this.broadcast({ t: 'result', list, best: topBest(this.stage) });
    this.sync();
  }
}

function pickRoom(stage) {
  let bestRoom = null, score = -1;
  for (const r of rooms) {
    if (r.stage !== stage || r.players.size >= ROOM_MAX) continue;
    const s = r.players.size * 2 + (r.phase === 'wait' ? 20 : r.phase === 'result' ? 10 : 0);
    if (s > score) { score = s; bestRoom = r; }
  }
  return bestRoom || new Room(stage);
}

const perIp = new Map();
const wss = new WebSocketServer({ host: '127.0.0.1', port: PORT, maxPayload: 512 * 1024 });   // big enough for a replay upload
wss.on('connection', (ws, req) => {
  const ip = String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if ((perIp.get(ip) || 0) >= 6) { ws.close(1008, 'too many'); return; }
  perIp.set(ip, (perIp.get(ip) || 0) + 1);
  const p = { id: nextId++, ws, name: 'NoName', cc: '', room: null, pose: null, msgs: 0, alive: true };
  const cfCC = cleanCC(req.headers['cf-ipcountry']);
  ws.on('pong', () => { p.alive = true; });
  ws.on('message', (raw) => {
    if (++p.msgs > 60) return;
    if (raw.length > 4096 && (p.bigs = (p.bigs || 0) + 1) > 3) return;   // only a few big (replay) messages per connection
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
    if (raw.length > 4096 && m.t !== 'replay' && m.t !== 'submit') return;
    if (m.t === 'hello' && !p.room) {
      p.name = cleanName(m.name); p.cc = cfCC && cfCC !== 'XX' && cfCC !== 'T1' ? cfCC : cleanCC(m.cc);
      const stage = tracks[m.stage] ? m.stage : 'sky';
      send(p, { t: 'welcome', id: p.id, now: Date.now(), stage, laps: tracks[stage].laps, best: topBest(stage) });
      pickRoom(stage).add(p);
      return;
    }
    // boards for the title screen, solo results, and signing a record
    if (m.t === 'boards') { send(p, { t: 'boards', boards: Object.fromEntries(STAGE_IDS.map((id) => [id, topBest(id, 3)])) }); return; }
    if (m.t === 'board' && tracks[m.stage]) { send(p, { t: 'board', stage: m.stage, best: topBest(m.stage, KEEP) }); return; }
    if (m.t === 'getReplay') {
      fs.readFile(replayPath(String(m.id || '')), 'utf8', (err, txt) => {
        if (err) { send(p, { t: 'replayData', id: m.id, error: 'notfound' }); return; }
        let d; try { d = JSON.parse(txt); } catch { send(p, { t: 'replayData', id: m.id, error: 'bad' }); return; }
        const e = best[d.stage]?.race.find((b) => b.rid === d.id), rank = e ? best[d.stage].race.indexOf(e) + 1 : 0;
        send(p, { t: 'replayData', id: m.id, data: d, entry: e ? { name: e.name, cc: e.cc, msg: e.msg, time: e.time, rank } : null });
      });
      return;
    }
    // a finished online run's recording (the server already timed it)
    if (m.t === 'replay') { const le = p.lastEntry; p.lastEntry = null; const id = le && saveReplay(le.stage, le.entry, m.data, p); send(p, { t: 'replaySaved', id: id || null }); return; }
    if (m.t === 'submit' && tracks[m.stage] && (p.submits = (p.submits || 0) + 1) <= 4) {
      const tr = tracks[m.stage], who = { name: cleanName(m.name), cc: cfCC && cfCC !== 'XX' && cfCC !== 'T1' ? cfCC : cleanCC(m.cc) };
      const fast = (L) => L / 330 * 1000;     // nothing averages the speed of sound over a lap
      const ok = (v, min) => typeof v === 'number' && Number.isFinite(v) && v >= min && v < 3600000;
      let rec = null;
      if (ok(m.lap, fast(tr.L))) rec = addBest(m.stage, 'lap', who, m.lap);
      if (ok(m.race, fast(tr.L * tr.laps))) rec = addBest(m.stage, 'race', who, m.race) || rec;
      let replay = null;
      if (who.lastEntry && m.replay) replay = saveReplay(m.stage, who.lastEntry.entry, m.replay, who);
      send(p, { t: 'submitted', stage: m.stage, rec, replay, best: topBest(m.stage) });
      return;
    }
    if (m.t === 'sign') { const st = sign(m); if (st) send(p, { t: 'signed', stage: st, best: topBest(st) }); return; }
    const r = p.room; if (!r) return;
    if (m.t === 's' && Array.isArray(m.p) && m.p.length === 9 && m.p.every((v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 20000)) {
      const now = Date.now();
      if (p.lastPose && r.phase === 'race' && p.racing) {
        const dt = Math.max(0.03, (now - p.poseT) / 1000), d = Math.hypot(m.p[0] - p.lastPose[0], m.p[1] - p.lastPose[1], m.p[2] - p.lastPose[2]);
        if (d / dt > VMAX && !m.respawn) { p.flag = (p.flag || 0) + 1; }
      }
      p.pose = m.p; p.lastPose = m.p; p.poseT = now;
      if (r.phase === 'race' && p.racing && p.fin === null && p.prog) r.progress(p, m.p[0], m.p[1], m.p[2], now);
    } else if (m.t === 'ready') { p.ready = !!m.v; r.checkReady(); r.sync(); }
    else if (m.t === 'name') { p.name = cleanName(m.name); r.sync(); }
    else if (m.t === 'ping') send(p, { t: 'pong', c: m.c, s: Date.now() });
  });
  ws.on('close', () => {
    perIp.set(ip, (perIp.get(ip) || 1) - 1); if (perIp.get(ip) <= 0) perIp.delete(ip);
    if (p.room) p.room.remove(p);
  });
});

// 15 Hz: room clocks, CPU racers, pose relay ([id, x, y, z, qx, qy, qz, qw, speed, boost, distance])
let last = Date.now();
setInterval(() => {
  const now = Date.now(), dt = Math.min(0.2, (now - last) / 1000); last = now;
  for (const r of rooms) {
    r.tick(now, dt);
    const a = [];
    for (const p of r.players.values()) if (p.pose) a.push([p.id, ...p.pose, p.prog ? r2(p.prog.total) : 0]);
    for (const b of r.bots) { const { p, q, air } = b.pose(); a.push([b.id, r2(p[0]), r2(p[1]), r2(p[2]), r3(q[0]), r3(q[1]), r3(q[2]), r3(q[3]), r2(b.v), (b.boostT > 0 ? 1 : 0) | (air ? 2 : 0), r2(b.prog.total)]); }
    if (a.length) r.broadcast({ t: 's', n: now, a });
  }
}, 1000 / 15);
setInterval(() => { for (const r of rooms) for (const p of r.players.values()) p.msgs = 0; }, 1000);
setInterval(() => {
  const all = [...rooms].flatMap((r) => [...r.players.values()]);
  for (const ws of wss.clients) { const p = all.find((q) => q.ws === ws); if (p && !p.alive) { ws.terminate(); continue; } if (p) p.alive = false; ws.ping(); }
}, 20000);
console.log(`tesra jet race server on 127.0.0.1:${PORT} (stages ${STAGE_IDS.map((id) => `${id} ${Math.round(tracks[id].L)} m`).join(', ')})`);
