// Race sessions with one interface: Online (WebSocket to server/jet.mjs) and Solo (the same rules run locally with CPU racers).
// session.phase: 'connecting' | 'wait' | 'count' | 'race' | 'result' | 'offline'
// session.others: Map id -> { id, name, col, cc, bot, racing, lap, fin, dist, buf: [[t, pose]] }   pose = [x,y,z,qx,qy,qz,qw,speed,boost]
import { gridSlot } from './track.js';
import { Progress, Bot, BOT_NAMES } from './rules.js';

const wsUrl = () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${location.pathname.replace(/[^/]*$/, '')}ws`;

// a short-lived connection to the race server for the record boards: fetch them, submit a solo result, sign a record
export class BoardLink {
  constructor() { this.waits = []; this.q = []; this.open(); }
  open() {
    try { this.ws = new WebSocket(wsUrl()); } catch { return; }
    this.ws.onopen = () => { for (const m of this.q) this.ws.send(JSON.stringify(m)); this.q = []; };
    this.ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } this.waits = this.waits.filter((w) => (w.type === m.t ? (w.res(m), false) : true)); };
    this.ws.onclose = () => { for (const w of this.waits) w.res(null); this.waits = []; this.ws = null; };
  }
  // send m and resolve with the first reply of type `type` (null on failure / timeout)
  ask(m, type) {
    if (!this.ws) this.open();
    return new Promise((res) => {
      if (!this.ws) { res(null); return; }
      this.waits.push({ type, res }); setTimeout(() => res(null), 6000);
      if (this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); else this.q.push(m);
    });
  }
  close() { try { this.ws && this.ws.close(); } catch { /* ignore */ } }
}

const COLORS = [0xff3b5c, 0x2f8bff, 0xffc400, 0x2ee59d, 0xff7a1a, 0xb05cff, 0xf2f2f2, 0x17d4e0];

class Base {
  constructor(tr, emit) { this.tr = tr; this.emit = emit; this.phase = 'connecting'; this.others = new Map(); this.offset = 0; this.laps = tr.laps; this.me = { id: 0, slot: -1, racing: false, lap: 0, fin: null, place: 0, ready: false, col: COLORS[0] }; this.best = { race: [], lap: [] }; this.result = null; }
  now() { return Date.now() + this.offset; }
}

export class Online extends Base {
  constructor(tr, emit, name, cc) {
    super(tr, emit); this.name = name; this.cc = cc; this.rtt = Infinity; this.closed = false;
    this.connect();
  }
  url() { return wsUrl(); }
  connect() {
    const ws = this.ws = new WebSocket(this.url());
    ws.onopen = () => { this.send({ t: 'hello', name: this.name, cc: this.cc, stage: this.tr.id }); this.pings = 0; this.ping(); };
    ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } this.onMsg(m); };
    ws.onclose = () => { if (this.ws !== ws || this.closed) return; this.phase = 'offline'; this.others.clear(); this.emit('room'); this.retry = setTimeout(() => !this.closed && this.connect(), 3000); };
  }
  close() { this.closed = true; clearTimeout(this.retry); try { this.ws.close(); } catch { /* ignore */ } }
  send(m) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }
  ping() { this.send({ t: 'ping', c: Date.now() }); }
  sendPose(p, respawn) { this.send(respawn ? { t: 's', p, respawn: 1 } : { t: 's', p }); }
  setReady(v) { this.send({ t: 'ready', v }); }
  setName(n) { this.name = n; this.send({ t: 'name', name: n }); }
  sign(token, name, cc, msg) { this.send({ t: 'sign', token, name, cc, msg }); }
  sendReplay(data) { this.send({ t: 'replay', data }); }
  onMsg(m) {
    if (m.t === 'welcome') { this.me.id = m.id; this.laps = m.laps; this.best = m.best; this.offset = m.now - Date.now(); }
    else if (m.t === 'pong') { const rtt = Date.now() - m.c; if (rtt < this.rtt) { this.rtt = rtt; this.offset = m.s - (m.c + rtt / 2); } if (++this.pings < 6) setTimeout(() => this.ping(), 400); }
    else if (m.t === 'room') this.onRoom(m);
    else if (m.t === 's') {
      for (const a of m.a) {
        if (a[0] === this.me.id) continue;
        const o = this.others.get(a[0]); if (!o) continue;
        o.buf.push([m.n, a.slice(1, 10)]); if (o.buf.length > 30) o.buf.shift();
        o.dist = a[10];
      }
    } else if (m.t === 'lap') {
      if (m.id === this.me.id) { this.me.lap = m.lap; this.emit('lap', { lap: m.lap, lapTime: m.lapTime }); }
      else { const o = this.others.get(m.id); if (o) o.lap = m.lap; }
    } else if (m.t === 'fin') {
      if (m.id === this.me.id) { this.me.fin = m.time; this.me.place = m.place; this.me.lap = this.laps; this.emit('finish', { time: m.time, place: m.place }); }
      else { const o = this.others.get(m.id); if (o) { o.fin = m.time; this.emit('otherFinish', { name: o.name, time: m.time, place: m.place }); } }
    } else if (m.t === 'result') { this.result = m.list; this.best = m.best; this.emit('result'); }
    else if (m.t === 'record') this.emit('record', m);
    else if (m.t === 'signed') { this.best = m.best; this.emit('signed'); }
    else if (m.t === 'bye') { this.others.delete(m.id); this.emit('room'); }
  }
  onRoom(m) {
    const prev = this.phase;
    Object.assign(this, { phase: m.phase, phaseEnd: m.phaseEnd, startAt: m.startAt, laps: m.laps });
    const seen = new Set();
    for (const p of [...m.players, ...m.bots]) {
      if (p.id === this.me.id) { Object.assign(this.me, { slot: p.slot, racing: p.racing, ready: p.ready, col: p.col }); continue; }
      seen.add(p.id);
      let o = this.others.get(p.id); if (!o) { o = { id: p.id, buf: [], dist: 0, lap: 0 }; this.others.set(p.id, o); }
      Object.assign(o, { name: p.name, cc: p.cc, col: p.col, bot: p.bot, racing: p.racing, fin: p.fin });
    }
    for (const id of [...this.others.keys()]) if (!seen.has(id)) this.others.delete(id);
    if (m.phase === 'count' && prev !== 'count') { this.me.lap = 0; this.me.fin = null; this.result = null; for (const o of this.others.values()) { o.lap = 0; o.fin = null; } }
    if (m.phase === 'wait' && prev === 'result') this.result = null;
    this.emit('room', { prev });
  }
}

// solo: the server's room cycle, locally, with 3 CPU racers; no lobby (straight to the countdown)
export class Solo extends Base {
  constructor(tr, emit, name, cc) {
    super(tr, emit); this.name = name; this.cc = cc; this.me.id = 1; this.me.col = COLORS[0];
    this.key = tr.id === 'sky' ? 'jet-solo-best' : 'jet-solo-best-' + tr.id;
    try { this.best = JSON.parse(localStorage.getItem(this.key) || 'null') || { race: [], lap: [] }; } catch { /* ignore */ }
    // the stage's world board, when the server is reachable
    this.link = new BoardLink();
    this.link.ask({ t: 'boards' }, 'boards').then((r) => { if (r?.boards?.[tr.id]) { this.best = r.boards[tr.id]; this.emit('result'); } });
    setTimeout(() => this.start(), 50);
  }
  start() {
    this.result = null; this.me = { ...this.me, slot: 0, racing: true, lap: 0, fin: null, place: 0 };
    this.prog = new Progress(this.tr); this.prog.reset(gridSlot(this.tr, 0).s);
    this.bots = []; this.others.clear();
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    for (let k = 0; k < 3; k++) {
      const b = new Bot(this.tr, k + 1, 0.2 + k * 0.22 + Math.random() * 0.15);
      Object.assign(b, { id: -(k + 1), name: 'CPU·' + names[k], col: COLORS[k + 1], prog: new Progress(this.tr), fin: null });
      b.prog.reset(b.s); this.bots.push(b);
      this.others.set(b.id, { id: b.id, name: b.name, col: b.col, bot: true, racing: true, lap: 0, fin: null, dist: 0, buf: [] });
    }
    this.phase = 'count'; this.startAt = this.now() + 4000; this.phaseEnd = this.startAt;
    this.prog.lapStart = this.startAt; for (const b of this.bots) b.prog.lapStart = this.startAt;
    this.emit('room', { prev: 'wait' });
  }
  close() { if (this.link) this.link.close(); }
  setReady() {} setName(n) { this.name = n; }
  // send the result to the server's board for this stage; a top-10 time comes back with a token to sign it
  sendReplay(data) { this.replay = data; }
  async submit(race, lap) {
    this.link = this.link || new BoardLink();
    await new Promise((r) => setTimeout(r, 300));    // the recording is handed over right after the finish event
    const r = await this.link.ask({ t: 'submit', stage: this.tr.id, race: Math.round(race), lap: lap ? Math.round(lap) : null, name: this.name, cc: this.cc || '', replay: this.replay || null }, 'submitted');
    if (!r) return;
    this.best = r.best; this.emit('result');
    if (r.rec) this.emit('record', { stage: r.stage, ...r.rec });
  }
  async sign(token, name, cc, msg) {
    this.link = this.link || new BoardLink();
    const r = await this.link.ask({ t: 'sign', token, name, cc, msg }, 'signed');
    if (r) { this.best = r.best; this.emit('signed'); }
  }
  sendPose(p) {
    if (this.phase !== 'race' || this.me.fin !== null) return;
    const ev = this.prog.update(p[0], p[1], p[2], this.now());
    if (ev) this.onLap(this.me, ev, true);
  }
  onLap(r, ev, me) {
    const now = this.now();
    if (me && ev.lapTime > 8000) this.addBest('lap', ev.lapTime);
    if (ev.finished) {
      r.fin = now - this.startAt;
      const place = [this.me, ...this.bots].filter((q) => q.fin !== null).length;
      if (me) { this.me.place = place; this.me.lap = this.laps; this.addBest('race', r.fin); this.emit('finish', { time: r.fin, place }); this.endAt = now + 12000; this.submit(r.fin, this.prog.best); }
      else { const o = this.others.get(r.id); o.fin = r.fin; this.lastBot = now; this.emit('otherFinish', { name: r.name, time: r.fin, place }); }
    } else if (me) { this.me.lap = ev.lap; this.emit('lap', { lap: ev.lap, lapTime: ev.lapTime }); }
    else this.others.get(r.id).lap = ev.lap;
  }
  addBest(kind, t) {
    const l = this.best[kind]; l.push({ name: this.name, cc: '', time: Math.round(t), ts: Math.floor(Date.now() / 1000) }); l.sort((a, b) => a.time - b.time); this.best[kind] = l.slice(0, 10);
    try { localStorage.setItem(this.key, JSON.stringify(this.best)); } catch { /* ignore */ }
  }
  tick(dt) {
    const now = this.now();
    if (this.phase === 'count' && now >= this.startAt) { this.phase = 'race'; this.phaseEnd = 0; this.emit('room', { prev: 'count' }); }
    if (this.phase === 'race' || this.phase === 'count') {
      for (const b of this.bots) {
        b.step(dt, this.phase === 'race');
        const { p, q, air } = b.pose();
        if (this.phase === 'race' && b.fin === null) { const ev = b.prog.update(p[0], p[1], p[2], now); if (ev) this.onLap(b, ev, false); }
        const o = this.others.get(b.id); o.buf.push([now, [p[0], p[1], p[2], q[0], q[1], q[2], q[3], b.v, (b.boostT > 0 ? 1 : 0) | (air ? 2 : 0)]]); if (o.buf.length > 30) o.buf.shift(); o.dist = b.prog.total;
      }
      // the race ends 12 s after you finish (or 30 s after the last CPU if you are still going)
      if (this.phase === 'race' && ((this.me.fin !== null && now >= this.endAt) || (this.bots.every((b) => b.fin !== null) && now >= this.lastBot + 30000))) this.finish();
    }
    if (this.phase === 'result' && now >= this.phaseEnd) this.start();
  }
  finish() {
    const all = [{ id: 1, name: this.name, col: this.me.col, time: this.me.fin, best: this.prog.best, dist: this.prog.total }, ...this.bots.map((b) => ({ id: b.id, name: b.name, col: b.col, bot: true, time: b.fin, best: b.prog.best, dist: b.prog.total }))];
    all.sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity) || b.dist - a.dist);
    all.forEach((r, i) => { r.place = i + 1; });
    this.result = all; this.phase = 'result'; this.phaseEnd = this.now() + 12000;
    this.emit('result'); this.emit('room', { prev: 'race' });
  }
  get dist() { return this.prog ? this.prog.total : 0; }
}
