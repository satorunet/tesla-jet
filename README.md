# TESRA JET RACER

ジェットで浮かぶテスラの次世代レース — a browser racing game where a hovering Tesla flies round sky circuits on jets.

**Play:** https://satoru.net/tesra/jet/

> 本作はテスラ社（Tesla, Inc.）の**非公式ファンゲーム**です。テスラ社とは関係ありません。
> An unofficial Tesla fan game. Not affiliated with or endorsed by Tesla, Inc.
>
> コードは AI アシスタント **Claude（Anthropic）** によって作成されました。
> The code was written with the AI assistant **Claude** (Anthropic).

## Features

- 4 stages: SKY CIRCUIT / TWIST NEBULA (space, corkscrews, loops, upside-down) / OCEAN SOAR (huge ramp over the sea) / NEON SPIRAL (night city, tower spiral)
- Always-hovering car on four lift jets; JET to climb and fly the gaps, the course guides the line
- Dash gates, boost pads, air rings, item boxes, JET orbs, NITRO (stock 2, shockwave + sonic boost)
- Online races (up to 8, CPUs fill the grid) or solo against 3 CPUs
- Per-stage world boards (top 100) with flag, name and comment; replays of ranked runs with shareable links (`?replay=ID`)
- Procedural BGM (3 songs per stage) synthesised with Web Audio; no assets to download

## Layout

```
jet/            the game (static files: index.html, style.css, js/*.js — three.js from a CDN via an import map)
  js/track.js   stages and the course maths (shared with the server)
  js/rules.js   laps / checkpoints and CPU racers (shared with the server)
server/jet.mjs  WebSocket server: rooms, CPU racers, server-side lap timing, boards, replays
```

## Run it

```sh
cd server && npm install && PORT=3332 node jet.mjs   # boards/replays go to server/data/
```

Serve `jet/` with any static web server and proxy its `ws` path (the page connects to `<page dir>/ws`) to the server, e.g. nginx:

```nginx
location = /jet/ws {
  proxy_pass http://127.0.0.1:3332;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

Without the server the game still runs in solo mode.

Controls: W accelerate · A/D steer · Space/Shift JET (boost + climb) · S brake · N NITRO · R back to checkpoint · C camera. Touch and gamepad are supported.

## License

[MIT](LICENSE) © satoru.net. Uses [three.js](https://threejs.org/) (MIT).
