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
        <option value="fcfs">first come, first served</option>
        <option value="rr" selected>round robin, quantum ${QUANTUM}</option>
        <option value="prio">preemptive priority</option>
      </select>
      <button type="button" class="btn" data-k="add">add process</button>
      <button type="button" class="btn" data-k="pause" aria-pressed="false">pause</button>
      <span class="dim" data-k="stats"></span>
    </div>
    <canvas height="150" aria-label="Gantt chart of processes running on four cores" role="img"></canvas>
    <p class="cap">A small simulation written for this page: four cores share one ready queue. First come, first served runs each process to completion. Round robin preempts a process after ${QUANTUM} ticks. Preemptive priority always runs the highest-priority processes (p1 is highest), so a new arrival can take a core from a lower-priority one.</p>`;
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
  let preempted = 0;
  let paused = false;
  const prioOf = new Map();

  const spawn = () => {
    const burst = 2 + Math.floor(Math.random() * 10);
    const prio = 1 + Math.floor(Math.random() * 4);
    prioOf.set(nextId, prio);
    prioOf.delete(nextId - 200);
    queue.push({ id: nextId++, burst, left: burst, prio, arrive: t, waited: 0 });
  };
  for (let i = 0; i < 7; i++) spawn();

  function tick() {
    const active = queue.length + cores.filter((c) => c.p).length;
    if (active < 12 && Math.random() < 0.55) spawn();
    // preempt
    if (sel.value === "rr") {
      for (const c of cores) {
        if (c.p && c.slice >= QUANTUM && queue.length) {
          queue.push(c.p);
          c.p = null;
          preempted++;
        }
      }
    }
    // the first of the highest-priority waiting processes
    const bestWaiting = () => {
      let i = 0;
      queue.forEach((p, j) => { if (p.prio < queue[i].prio) i = j; });
      return i;
    };
    // dispatch
    for (const c of cores) {
      if (c.p || !queue.length) continue;
      const i = sel.value === "prio" ? bestWaiting() : 0;
      c.p = queue.splice(i, 1)[0];
      c.slice = 0;
    }
    if (sel.value === "prio") {
      // once every core is busy, a waiting process that outranks the lowest-priority
      // running one takes its core
      while (queue.length && cores.every((c) => c.p)) {
        const i = bestWaiting();
        const worst = cores.reduce((a, b) => (b.p.prio > a.p.prio ? b : a));
        if (queue[i].prio >= worst.p.prio) break;
        queue.push(worst.p);
        worst.p = queue.splice(i, 1)[0];
        worst.slice = 0;
        preempted++;
      }
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
    const pre = sel.value === "fcfs" ? "" : `, ${preempted} preempted`;
    stats.textContent = `t = ${t}, finished ${done}, mean wait ${done ? (waitSum / done).toFixed(1) : "0.0"} ticks${pre}`;
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
          const long = `P${id} p${prioOf.get(id)}`;
          const label = sel.value === "prio" && g.measureText(long).width + 6 < w ? long : `P${id}`;
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
    // under priority scheduling, show the queue in the order it will be served
    const prio = sel.value === "prio";
    const shown = prio ? [...queue].sort((a, b) => a.prio - b.prio) : queue;
    for (const p of shown) {
      const label = prio ? `P${p.id} p${p.prio}` : `P${p.id}·${p.left}`;
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
    preempted = 0;
  });

  return () => off();
}
