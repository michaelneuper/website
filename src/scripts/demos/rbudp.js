// Reliable Blast UDP in miniature, following our sender: blast every packet
// over UDP, send BLAST_COMPLETE over TCP, get back MISSING_PACKETS (or
// TRANSFER_DONE), and blast just the missing ones until nothing is missing.

import { fitCanvasOnResize, frameWhileVisible, themeColors, reducedMotion, on } from "../util.js";
import "../../styles/demos/rbudp.css";

const PACKETS = 64;
const FLIGHT = 0.7; // seconds for a datagram to cross
const TCP_TRIP = 0.55;

export function mount(host) {
  host.innerHTML = `
    <div class="demo-bar">
      <button type="button" class="btn" data-k="send">send file</button>
      <label class="sim-field" style="margin:0"><span>packet loss</span>
        <input type="range" min="0" max="60" value="20" data-k="loss" aria-label="Packet loss rate">
        <output data-k="lossOut">20%</output>
      </label>
      <span class="dim" data-k="stats"></span>
    </div>
    <canvas class="rb-canvas" height="190" role="img" aria-label="Packets travelling from sender to receiver"></canvas>
    <ol class="rb-log" aria-live="polite"></ol>`;
  const cv = host.querySelector("canvas");
  const log = host.querySelector(".rb-log");
  const stats = host.querySelector('[data-k="stats"]');
  const lossIn = host.querySelector('[data-k="loss"]');
  const lossOut = host.querySelector('[data-k="lossOut"]');

  let received = new Array(PACKETS).fill(false);
  let toSend = [];
  let round = 0;
  let datagrams = 0;
  let phase = "idle"; // idle | blast | tcp | done
  let flights = [];
  let tcp = null;
  let clock = 0;
  const loss = () => +lossIn.value / 100;

  // Protocol and message names (UDP, BLAST_COMPLETE) are code, so page
  // translators should leave them alone.
  const code = (s) => Object.assign(document.createElement("span"), { textContent: s, translate: false });
  const line = (r, proto, text) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="dim">round ${r}</span><span class="rb-proto"${proto === "done" ? "" : ' translate="no"'}>${proto}</span><span></span>`;
    // the odd parts are the message names
    li.lastChild.append(...text.split(/\b([A-Z]+(?:_[A-Z]+)+)\b/).map((s, i) => (i % 2 ? code(s) : s)));
    log.append(li);
    log.scrollTop = log.scrollHeight;
  };

  function start() {
    received.fill(false);
    toSend = Array.from({ length: PACKETS }, (_, i) => i);
    round = 0;
    datagrams = 0;
    log.replaceChildren();
    blast();
    draw();
    // with reduced motion the whole transfer has already happened
    if (moving()) loop.wake();
  }

  function blast() {
    round++;
    datagrams += toSend.length;
    line(round, "UDP", `blast ${toSend.length} packet${toSend.length === 1 ? "" : "s"}`);
    const gap = Math.min(0.03, 0.9 / toSend.length);
    flights = toSend.map((seq, k) => ({ seq, lost: Math.random() < loss(), t0: clock + k * gap }));
    phase = "blast";
    if (reducedMotion.matches) {
      for (const f of flights) if (!f.lost) received[f.seq] = true;
      report();
    }
  }

  function report() {
    const missing = toSend.filter((s) => !received[s]);
    line(round, "TCP", `BLAST_COMPLETE (${toSend.length} sequence numbers)`);
    if (missing.length) {
      const shown = missing.slice(0, 10).join(", ") + (missing.length > 10 ? ", …" : "");
      line(round, "TCP", `MISSING_PACKETS ${missing.length}: ${shown}`);
    } else {
      line(round, "TCP", "TRANSFER_DONE");
    }
    toSend = missing;
    if (reducedMotion.matches) {
      if (missing.length && round < 50) return blast();
      return finish();
    }
    tcp = { t0: clock, done: missing.length === 0 };
    phase = "tcp";
  }

  function finish() {
    phase = "done";
    const extra = datagrams - PACKETS;
    stats.textContent = `${round} round${round === 1 ? "" : "s"}, ${datagrams} datagrams (${extra} resent)`;
    line(round, "done", `${PACKETS} packets delivered in ${round} round${round === 1 ? "" : "s"}`);
  }

  function step(dt) {
    clock += dt;
    if (phase === "blast") {
      let pending = false;
      for (const f of flights) {
        const t = (clock - f.t0) / FLIGHT;
        if (t >= 1 && !f.lost) received[f.seq] = true;
        if (t < (f.lost ? 1.4 : 1)) pending = true;
      }
      if (!pending) report();
    } else if (phase === "tcp" && clock - tcp.t0 > TCP_TRIP) {
      if (tcp.done) finish();
      else blast();
    }
    if (phase !== "done" && phase !== "idle") {
      const got = received.filter(Boolean).length;
      stats.textContent = `round ${round}, ${got} of ${PACKETS} received`;
    }
  }

  // the canvas's CSS size, kept up to date by fitCanvasOnResize below
  let W = 0;
  let H = 0;
  function draw() {
    if (!W) return;
    const g = cv.getContext("2d");
    const c = themeColors();
    g.clearRect(0, 0, W, H);
    g.font = "11px 'JetBrains Mono', monospace";
    g.textBaseline = "middle";

    const tile = Math.max(7, Math.min(13, Math.floor((H - 70) / 8) - 3));
    const step8 = tile + 3;
    const gridW = 8 * step8 - 3;
    const top = 24;
    const sx = 4;
    const rx = W - gridW - 4;
    const pos = (x0, seq) => [x0 + (seq % 8) * step8, top + Math.floor(seq / 8) * step8];

    g.fillStyle = c.dim;
    g.textAlign = "left";
    g.fillText("sender", sx, 10);
    g.textAlign = "right";
    g.fillText("receiver", rx + gridW, 10);
    g.textAlign = "center";
    g.fillText("UDP datagrams", W / 2, 10);

    const resend = new Set(phase === "blast" || phase === "tcp" ? toSend : []);
    for (let s = 0; s < PACKETS; s++) {
      const [x, y] = pos(sx, s);
      g.fillStyle = resend.has(s) && round > 1 ? c.yellow : c.faint;
      g.fillRect(x, y, tile, tile);
      const [x2, y2] = pos(rx, s);
      g.fillStyle = received[s] ? c.green : c.rule;
      g.fillRect(x2, y2, tile, tile);
    }

    if (phase === "blast") {
      for (const f of flights) {
        const t = (clock - f.t0) / FLIGHT;
        if (t <= 0 || (!f.lost && t >= 1) || t >= 1.4) continue;
        const [ax, ay] = pos(sx, f.seq);
        const [bx, by] = pos(rx, f.seq);
        if (f.lost && t > 0.55) {
          // dropped somewhere in the network
          const k = (t - 0.55) / 0.85;
          const x = ax + (bx - ax) * 0.55;
          const y = ay + (by - ay) * 0.55 + k * k * 60;
          g.globalAlpha = Math.max(0, 1 - k);
          g.fillStyle = c.red;
          g.fillRect(x, y, tile, tile);
          g.globalAlpha = 1;
        } else {
          g.fillStyle = c.fg;
          g.fillRect(ax + (bx - ax) * t, ay + (by - ay) * t, tile, tile);
        }
      }
    }

    // the TCP control channel along the bottom
    const ty = top + 8 * step8 + 16;
    g.strokeStyle = c.rule;
    g.beginPath();
    g.moveTo(sx, ty + 0.5);
    g.lineTo(rx + gridW, ty + 0.5);
    g.stroke();
    g.fillStyle = c.dim;
    g.textAlign = "center";
    g.fillText("TCP control channel", W / 2, ty + 14);
    if (phase === "tcp") {
      const k = Math.min(1, (clock - tcp.t0) / TCP_TRIP);
      const x = rx + gridW - (rx + gridW - sx) * k;
      g.fillStyle = c.cyan;
      g.beginPath();
      g.arc(x, ty + 0.5, 4, 0, Math.PI * 2);
      g.fill();
      g.textAlign = "center";
      g.fillText(tcp.done ? "TRANSFER_DONE" : `MISSING_PACKETS (${toSend.length})`, x, ty - 10);
    }
  }

  host.querySelector('[data-k="send"]').addEventListener("click", start);
  lossIn.addEventListener("input", () => { lossOut.value = `${lossIn.value}%`; });

  // Frames only while packets or a TCP message are in flight and the canvas is
  // on screen; otherwise it is drawn once per change.
  const moving = () => phase === "blast" || phase === "tcp";
  const loop = frameWhileVisible(cv, (t, dt) => {
    step(dt);
    draw();
    return moving();
  });
  const unfit = fitCanvasOnResize(cv, (w, h) => { W = w; H = h; draw(); });
  const offTheme = on("theme", () => draw());
  stats.textContent = "64 packets ready to send";
  return () => { loop.stop(); unfit(); offTheme(); };
}
