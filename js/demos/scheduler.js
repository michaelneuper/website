// A toy multicore scheduler: processes arrive, wait in one shared ready queue,
// and get dispatched to four cores under the chosen policy. Drawn as a Gantt chart.

import { fitCanvas, themeColors, onFrame } from "../util.js";

const CORES = 4;
const SPAN = 48;
const QUANTUM = 3;

export function mount(host) {
  host.innerHTML = `
    <div class="demo-bar">
      <select aria-label="Scheduling policy">
        <option value="rr">round robin, quantum ${QUANTUM}</option>
        <option value="sjf">shortest job first</option>
        <option value="fcfs">first come, first served</option>
      </select>
      <button type="button" class="btn" data-k="add">add process</button>
      <button type="button" class="btn" data-k="pause" aria-pressed="false">pause</button>
      <span class="dim" data-k="stats"></span>
    </div>
    <canvas height="150" aria-label="Gantt chart of processes running on four cores" role="img"></canvas>
    <p class="cap">A small simulation written for this page: four cores share one ready queue. Round robin preempts a process after ${QUANTUM} ticks; the other two policies let it run to completion.</p>`;
  const cv = host.querySelector("canvas");
  const sel = host.querySelector("select");
  const stats = host.querySelector('[data-k="stats"]');
  const pauseBtn = host.querySelector('[data-k="pause"]');

  let t = 0;
  let nextId = 1;
  let queue = [];
  let cores = Array.from({ length: CORES }, () => ({ p: null, slice: 0 }));
  let hist = Array.from({ length: CORES }, () => []);
  let done = 0;
  let waitSum = 0;
  let paused = false;

  const spawn = () => {
    const burst = 2 + Math.floor(Math.random() * 10);
    queue.push({ id: nextId++, burst, left: burst, arrive: t, waited: 0 });
  };
  for (let i = 0; i < 7; i++) spawn();

  function tick() {
    const active = queue.length + cores.filter((c) => c.p).length;
    if (active < 12 && Math.random() < 0.38) spawn();
    // preempt
    if (sel.value === "rr") {
      for (const c of cores) {
        if (c.p && c.slice >= QUANTUM && queue.length) {
          queue.push(c.p);
          c.p = null;
        }
      }
    }
    // dispatch
    for (const c of cores) {
      if (c.p || !queue.length) continue;
      let i = 0;
      if (sel.value === "sjf") queue.forEach((p, j) => { if (p.left < queue[i].left) i = j; });
      c.p = queue.splice(i, 1)[0];
      c.slice = 0;
    }
    // run one tick
    cores.forEach((c, k) => {
      hist[k].push(c.p ? c.p.id : 0);
      if (hist[k].length > SPAN) hist[k].shift();
      if (!c.p) return;
      c.p.left--;
      c.slice++;
      if (c.p.left === 0) {
        done++;
        waitSum += c.p.waited;
        c.p = null;
      }
    });
    for (const p of queue) p.waited++;
    t++;
    stats.textContent = `t = ${t}, finished ${done}, mean wait ${done ? (waitSum / done).toFixed(1) : "0.0"} ticks`;
  }

  function draw() {
    if (!cv.isConnected) return;
    fitCanvas(cv);
    const g = cv.getContext("2d");
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    const c = themeColors();
    const palette = [c.blue, c.green, c.yellow, c.magenta, c.cyan, c.orange, c.red];
    const color = (id) => palette[id % palette.length];
    g.clearRect(0, 0, W, H);
    g.font = "11px 'JetBrains Mono', monospace";
    g.textBaseline = "middle";
    const lw = 46;
    const cw = (W - lw) / SPAN;
    const rh = 22;
    for (let k = 0; k < CORES; k++) {
      const y = 4 + k * (rh + 6);
      g.fillStyle = c.dim;
      g.fillText(`cpu${k}`, 0, y + rh / 2);
      g.fillStyle = c.rule;
      g.fillRect(lw, y, W - lw, rh);
      const row = hist[k];
      const off = SPAN - row.length;
      // draw each uninterrupted run as one block, labelled if it is wide enough
      for (let i = 0; i < row.length;) {
        const id = row[i];
        let j = i;
        while (j < row.length && row[j] === id) j++;
        if (id) {
          const x = lw + (off + i) * cw;
          const w = (j - i) * cw - 1;
          g.fillStyle = color(id);
          g.globalAlpha = 0.85;
          g.fillRect(x, y, w, rh);
          g.globalAlpha = 1;
          const label = `P${id}`;
          if (g.measureText(label).width + 6 < w) {
            g.fillStyle = c.bg;
            g.fillText(label, x + 3, y + rh / 2);
          }
        }
        i = j;
      }
    }
    // ready queue
    const qy = 4 + CORES * (rh + 6) + 4;
    g.fillStyle = c.dim;
    g.fillText("ready", 0, qy + 9);
    let x = lw;
    for (const p of queue) {
      const label = `P${p.id}·${p.left}`;
      const w = g.measureText(label).width + 10;
      if (x + w > W) break;
      g.strokeStyle = color(p.id);
      g.strokeRect(x + 0.5, qy + 0.5, w, 17);
      g.fillStyle = c.fg;
      g.fillText(label, x + 5, qy + 9);
      x += w + 5;
    }
  }

  let acc = 0;
  const off = onFrame((now, dt) => {
    if (!host.isConnected) { off(); return; }
    if (!paused) {
      acc += dt;
      while (acc > 0.25) { tick(); acc -= 0.25; }
    }
    draw();
  });

  host.querySelector('[data-k="add"]').addEventListener("click", () => { spawn(); draw(); });
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.textContent = paused ? "resume" : "pause";
  });
  sel.addEventListener("change", () => {
    hist = hist.map(() => []);
    done = 0;
    waitSum = 0;
  });

  return () => off();
}
