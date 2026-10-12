// The 8-bit computer's board: Ben Eater's layout drawn from the simulated
// machine in machine.js, with RAM you can edit, the bus, the control word and a
// 7-segment display. The 8-bit project mounts it as its demo.

import { $, $$, hex, reducedMotion, onFrame, isTyping, on } from "../../util.js";
import { message, setSegment } from "../../emacs/index.js";
import { LINES, L, LABEL, OPS, PROGRAMS, controlWord, alu, busValue, tick, resetState, disasm, assemble } from "./machine.js";
import "../../../styles/demos/computer.css";

// ── 7-segment digits ──────────────────────────────────────────────────

const H = (y, x1, x2) => `M${x1} ${y}l1.6 -1.6H${x2 - 1.6}l1.6 1.6l-1.6 1.6H${x1 + 1.6}z`;
const V = (x, y1, y2) => `M${x} ${y1}l1.6 1.6V${y2 - 1.6}l-1.6 1.6l-1.6 -1.6V${y1 + 1.6}z`;
const SEGS = { a: H(2, 3, 19), b: V(20, 3, 18.4), c: V(20, 19.6, 35), d: H(36, 3, 19), e: V(2, 19.6, 35), f: V(2, 3, 18.4), g: H(19, 3, 19) };
const GLYPH = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g", " ": "" };

// ── UI ────────────────────────────────────────────────────────────────

const fmtHz = (f) => (f < 10 ? `${f.toFixed(1)} Hz` : `${Math.round(f)} Hz`);

// State that outlives any one mounted board: the coffee overclock, and which
// board is on the page (the 8-bit project's demo mounts and unmounts it).
let boost = 1;
let boostTimer = 0;
let current = null;

const TEMPLATE = `
  <div class="board" role="group" aria-label="Simulated 8-bit breadboard computer"></div>
  <div class="sim-bar">
    <button type="button" class="btn" data-sim="run" aria-pressed="false">run</button>
    <button type="button" class="btn" data-sim="step">step</button>
    <button type="button" class="btn" data-sim="reset">reset</button>
    <label class="sim-field"><span>program</span>
      <select data-sim="program">
        <option value="fibonacci">fibonacci</option>
        <option value="multiply">multiply 7 × 6</option>
        <option value="count">count up and down</option>
        <option value="add">add 28 + 14</option>
      </select>
    </label>
    <label class="sim-field"><span>clock</span>
      <input type="range" min="0" max="100" value="43" data-sim="hz" aria-label="Clock speed">
      <output>10 Hz</output>
    </label>
  </div>
  <p class="sim-note">Simulated one clock cycle at a time. <kbd>c</kbd> runs or pauses, <kbd>n</kbd> steps one cycle, <kbd>r</kbd> resets. Click a bit in RAM to change the program, or the display to switch to signed.</p>`;

export function mount(host) {
  host.innerHTML = TEMPLATE;
  const board = $(".board", host);
  const runBtn = $('[data-sim="run"]', host);
  const progSel = $('[data-sim="program"]', host);
  const hzIn = $('[data-sim="hz"]', host);
  const hzOut = $("output", host);

  const s = { ram: new Uint8Array(16) };
  resetState(s);
  let program = PROGRAMS.fibonacci;
  let running = false;
  let hz = 10;
  let acc = 0;
  let phase = 0;
  let signed = false;
  let dirty = true;
  let lastBoost = boost;
  const effHz = () => Math.min(500, hz * boost);

  // ── build the board ────────────────────────────────────────────────
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const mods = {};
  const mod = (key, name, sigs = []) => {
    const m = el("section", `mod mod-${key}`);
    const head = el("div", "mod-head");
    head.append(el("span", "mod-name", name));
    for (const sig of sigs) {
      const t = el("span", "sig", LABEL[sig] ?? sig);
      t.dataset.sig = sig;
      head.append(t);
    }
    const body = el("div", "mod-body");
    m.append(head, body);
    mods[key] = { m, body, sigs: $$(".sig", head), val: null, leds: [] };
    return mods[key];
  };
  const leds = (target, n, cls = "", gapAt = -1, tag = "span") => {
    const w = el("div", "leds");
    for (let i = 0; i < n; i++) {
      if (i === gapAt) w.append(el("span", "gap"));
      const l = el(tag, `led ${cls}`);
      w.append(l);
      target.leds.push(l);
    }
    return w;
  };
  const value = (target, text = "") => {
    target.val = el("span", "mod-val", text);
    return target.val;
  };

  const left = el("div", "col col-l");
  const right = el("div", "col col-r");

  const clk = mod("clk", "clock", ["HLT"]);
  clk.body.append(leds(clk, 1, "b"), value(clk));
  const mar = mod("mar", "memory address", ["MI"]);
  mar.body.append(leds(mar, 4, "y"), value(mar));

  const ram = mod("ram", "RAM", ["RI", "RO"]);
  const rows = el("div", "ram-rows");
  const ramRows = [];
  for (let a = 0; a < 16; a++) {
    const row = el("div", "ram-row");
    const pcMark = el("span", "pc");
    const addr = el("span", "addr", hex(a, 1));
    const bits = el("span", "leds");
    const cells = [];
    for (let b = 7; b >= 0; b--) {
      const btn = el("button", "led");
      btn.type = "button";
      btn.tabIndex = a === 0 && b === 7 ? 0 : -1;
      btn.dataset.addr = a;
      btn.dataset.bit = b;
      btn.setAttribute("aria-label", `address ${a}, bit ${b}`);
      bits.append(btn);
      cells.push(btn);
    }
    const dis = el("span", "dis");
    row.append(pcMark, addr, bits, dis);
    rows.append(row);
    ramRows.push({ row, pcMark, cells, dis });
  }
  ram.body.replaceWith(rows);

  const ir = mod("ir", "instruction", ["II", "IO"]);
  ir.body.append(leds(ir, 8, "", 4), value(ir));
  ir.leds.forEach((l, i) => l.classList.add(i < 4 ? "b" : "y"));
  left.append(clk.m, mar.m, ram.m, ir.m);

  const pc = mod("pc", "program counter", ["CO", "J", "CE"]);
  pc.body.append(leds(pc, 4, "g"), value(pc));
  const a = mod("a", "A register", ["AI", "AO"]);
  a.body.append(leds(a, 8), value(a));
  const sum = mod("sum", "ALU Σ", ["EO", "SU"]);
  sum.body.append(leds(sum, 8), value(sum));
  const b = mod("b", "B register", ["BI"]);
  b.body.append(leds(b, 8), value(b));
  const out = mod("out", "output", ["OI"]);
  const seg = el("div", "seg7");
  const digits = [];
  for (let d = 0; d < 4; d++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 22 38");
    svg.setAttribute("aria-hidden", "true");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", "skewX(-6) translate(2 0)");
    const segs = {};
    for (const [k, dpath] of Object.entries(SEGS)) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", dpath);
      g.append(p);
      segs[k] = p;
    }
    svg.append(g);
    seg.append(svg);
    digits.push(segs);
  }
  const outLabel = el("span", "sr-only");
  out.body.append(seg, value(out), outLabel);
  out.body.title = "Click to switch between unsigned and signed";
  const flags = mod("flags", "flags", ["FI"]);
  const fl = el("div", "leds");
  const cfLed = el("span", "led g");
  const zfLed = el("span", "led g");
  fl.append(cfLed, el("span", "dim", "C"), el("span", "gap"), zfLed, el("span", "dim", "Z"));
  fl.style.alignItems = "center";
  flags.body.append(fl, value(flags));
  right.append(pc.m, a.m, sum.m, b.m, out.m, flags.m);

  const bus = el("div", "bus");
  const busHead = el("div", "mod-head");
  busHead.append(el("span", "mod-name", "bus"));
  const busVal = el("span", "bus-val mod-val", "0");
  const lanesWrap = el("div", "lanes");
  const lanes = [];
  for (let i = 0; i < 8; i++) {
    const l = el("span", "lane");
    lanesWrap.append(l);
    lanes.push(l);
  }
  bus.append(busHead, busVal, lanesWrap);

  const ctrl = mod("ctrl", "control word", []);
  ctrl.m.classList.add("ctrl");
  const ctrlRow = el("div", "ctrl-row");
  const stepWrap = el("div", "cw");
  const stepLeds = [];
  for (let i = 0; i < 5; i++) {
    const bit = el("span", "cw-bit");
    const l = el("span", "led");
    bit.append(l, el("span", "", `T${i}`));
    stepWrap.append(bit);
    stepLeds.push([bit, l]);
  }
  const cwWrap = el("div", "cw");
  const cwBits = LINES.map((n) => {
    const bit = el("span", "cw-bit");
    const l = el("span", "led b");
    bit.append(l, el("span", "", LABEL[n] ?? n));
    cwWrap.append(bit);
    return [bit, l];
  });
  ctrlRow.append(stepWrap, cwWrap);
  const ustep = el("p", "ustep");
  ctrl.body.replaceWith(ctrlRow);
  ctrl.m.append(ustep);

  board.replaceChildren(left, bus, right, ctrl.m);

  // ── render ─────────────────────────────────────────────────────────
  const setBits = (list, v, n = list.length) => {
    for (let i = 0; i < n; i++) list[i].classList.toggle("on", ((v >> (n - 1 - i)) & 1) === 1);
  };
  const setText = (node, text) => {
    if (node.textContent !== text) node.textContent = text;
  };

  let lastRam = "";
  function render() {
    const cw = controlWord(s);
    const r = alu(s, cw);
    const v = busValue(s, cw, r.sum);

    // registers
    setBits(mar.leds, s.mar); setText(mar.val, String(s.mar));
    setBits(pc.leds, s.pc); setText(pc.val, String(s.pc));
    setBits(a.leds, s.a); setText(a.val, String(s.a));
    setBits(b.leds, s.b); setText(b.val, String(s.b));
    setBits(sum.leds, r.sum); setText(sum.val, `${cw & L.SU ? "A−B" : "A+B"} ${r.sum}`);
    setBits(ir.leds, s.ir); setText(ir.val, s.step < 2 && s.cycles === 0 ? "" : disasm(s.ir));
    cfLed.classList.toggle("on", !!s.cf);
    zfLed.classList.toggle("on", !!s.zf);
    setText(flags.val, "");
    setBits(lanes, v); setText(busVal, String(v));

    // clock
    clk.leds[0].classList.toggle("on", running && !s.halted && (effHz() > 24 || phase < 0.5));
    setText(clk.val, s.halted ? "halted" : running ? (boost > 1 ? `${fmtHz(effHz())} (${boost}×)` : fmtHz(hz)) : "paused");

    // output display
    const o = signed && s.out > 127 ? -(256 - s.out) : s.out;
    const txt = (o < 0 ? "-" : " ") + String(Math.abs(o)).padStart(3, " ");
    txt.split("").forEach((ch, i) => {
      const on = GLYPH[ch] ?? "";
      for (const [k, p] of Object.entries(digits[i])) p.classList.toggle("on", on.includes(k));
    });
    setText(out.val, signed ? "signed" : "");
    setText(outLabel, `output ${o}`);

    // control word and step
    cwBits.forEach(([bit, l], i) => {
      const on = (cw >> (15 - i)) & 1;
      bit.classList.toggle("on", !!on);
      l.classList.toggle("on", !!on);
    });
    stepLeds.forEach(([bit, l], i) => {
      bit.classList.toggle("on", i === s.step);
      l.classList.toggle("on", i === s.step);
    });
    const d = describe(s, cw);
    const html = `T${s.step}&ensp;<b>${d.label}</b>&ensp;${d.text}`;
    if (ustep.innerHTML !== html) ustep.innerHTML = html;

    // which modules drive the bus, which latch it, and their control lines
    const outs = { pc: L.CO, ram: L.RO, ir: L.IO, a: L.AO, sum: L.EO };
    const ins = { mar: L.MI, ram: L.RI, ir: L.II, a: L.AI, b: L.BI, out: L.OI, pc: L.J | L.CE, flags: L.FI, clk: L.HLT };
    for (const [key, m] of Object.entries(mods)) {
      m.m.classList.toggle("is-out", !!(cw & (outs[key] ?? 0)));
      m.m.classList.toggle("is-in", !!(cw & (ins[key] ?? 0)) && !(cw & (outs[key] ?? 0)));
      for (const t of m.sigs) t.classList.toggle("on", !!(cw & L[t.dataset.sig]));
    }

    // RAM matrix
    const key = `${s.ram.join(",")}|${s.mar}|${s.pc}`;
    if (key !== lastRam) {
      lastRam = key;
      ramRows.forEach((rr, addr) => {
        setBits(rr.cells, s.ram[addr]);
        rr.row.classList.toggle("is-mar", addr === s.mar);
        setText(rr.pcMark, addr === s.pc ? "▸" : "");
        const data = program.data[addr];
        setText(rr.dis, data ? `${data[0]} = ${s.ram[addr]}` : disasm(s.ram[addr]));
      });
    }
  }

  function describe(st, cw) {
    if (st.halted) return { label: "HLT", text: "clock stopped; reset to run again" };
    const label = st.step < 2 ? "fetch" : OPS[st.ir >> 4] ?? "???";
    if (!cw) {
      if (label === "JC") return { label, text: "carry clear, so no jump" };
      if (label === "JZ") return { label, text: "zero clear, so no jump" };
      return { label, text: "nothing to do this step" };
    }
    const src = [[L.CO, "PC"], [L.RO, "RAM"], [L.IO, "operand"], [L.AO, "A"], [L.EO, cw & L.SU ? "A − B" : "A + B"]].find(([bit]) => cw & bit);
    const dst = [[L.MI, "MAR"], [L.RI, "RAM"], [L.II, "IR"], [L.AI, "A"], [L.BI, "B"], [L.OI, "output"], [L.J, "PC"]].filter(([bit]) => cw & bit).map(([, n]) => n);
    const parts = [];
    if (src && dst.length) parts.push(`${src[1]} → ${dst.join(", ")}`);
    if (cw & L.CE) parts.push("PC + 1");
    if (cw & L.FI) parts.push("latch flags");
    return { label, text: parts.join(", ") };
  }


  // ── simulation loop ────────────────────────────────────────────────
  function frame(t, dt) {
    if (boost !== lastBoost) {
      lastBoost = boost;
      dirty = true;
    }
    if (running && !s.halted) {
      acc += dt * effHz();
      phase = (phase + dt * effHz()) % 1;
      let n = Math.floor(acc);
      acc -= n;
      n = Math.min(n, 400);
      while (n-- > 0 && !s.halted) tick(s);
      if (s.halted) halted();
      dirty = true;
    }
    if (dirty) {
      render();
      dirty = false;
    }
  }

  function halted() {
    running = false;
    paintRun();
    message(`HLT: ${program.title} finished with ${s.out} on the display. Press r to reset.`, "", 6000);
  }

  function paintRun() {
    runBtn.setAttribute("aria-pressed", String(running));
    runBtn.textContent = running ? "pause" : "run";
  }

  // ── controls ───────────────────────────────────────────────────────
  function run(want = !running) {
    if (want && s.halted) return message("Halted. Press r (or the reset button) to start again.");
    running = want;
    acc = 0;
    paintRun();
    dirty = true;
  }
  function step() {
    if (running) run(false);
    if (s.halted) return message("Halted. Press r to reset.");
    tick(s);
    if (s.halted) halted();
    dirty = true;
  }
  function reset() {
    resetState(s);
    dirty = true;
  }
  function load(key) {
    program = PROGRAMS[key] ?? PROGRAMS.fibonacci;
    progSel.value = key;
    s.ram = assemble(program);
    resetState(s);
    lastRam = "";
    dirty = true;
  }
  function setHz(v) {
    hz = 0.5 * Math.pow(1000, v / 100);
    hzOut.value = fmtHz(hz);
    dirty = true;
  }

  runBtn.addEventListener("click", () => run());
  $('[data-sim="step"]', host).addEventListener("click", step);
  $('[data-sim="reset"]', host).addEventListener("click", reset);
  progSel.addEventListener("change", () => {
    load(progSel.value);
    if (!reducedMotion.matches) run(true);
  });
  hzIn.addEventListener("input", () => setHz(+hzIn.value));
  out.body.addEventListener("click", () => {
    signed = !signed;
    dirty = true;
    message(signed ? "Output shows signed two’s complement" : "Output shows unsigned");
  });

  // Edit RAM by clicking bits; arrow keys move around the matrix.
  rows.addEventListener("click", (e) => {
    const btn = e.target.closest(".led");
    if (!btn) return;
    s.ram[+btn.dataset.addr] ^= 1 << +btn.dataset.bit;
    focusCell(+btn.dataset.addr, +btn.dataset.bit);
    dirty = true;
  });
  rows.addEventListener("keydown", (e) => {
    const btn = e.target.closest(".led");
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, 1], ArrowRight: [0, -1] }[e.key];
    if (!btn || !d) return;
    e.preventDefault();
    focusCell((+btn.dataset.addr + d[0] + 16) % 16, Math.min(7, Math.max(0, +btn.dataset.bit + d[1])));
  });
  function focusCell(addr, bit) {
    for (const rr of ramRows) for (const c of rr.cells) c.tabIndex = -1;
    const c = ramRows[addr].cells[7 - bit];
    c.tabIndex = 0;
    c.focus({ preventScroll: true });
  }

  // c, n and r while the computer is on screen
  let visible = false;
  let off = null;
  const io = new IntersectionObserver(([e]) => {
    visible = e.intersectionRatio >= 0.25;
    if (e.isIntersecting && !off) off = onFrame(frame);
    else if (!e.isIntersecting && off) { off(); off = null; }
  }, { threshold: [0, 0.25] });
  io.observe(board);
  const onKey = (e) => {
    if (!visible || e.defaultPrevented || e.repeat || isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    const act = { c: () => run(), n: step, r: reset }[e.key];
    if (!act) return;
    e.preventDefault();
    act();
  };
  document.addEventListener("keydown", onKey);

  load("fibonacci");
  setHz(+hzIn.value);
  run(!reducedMotion.matches || boost > 1);
  const api = { run, step, reset, load, board, halted: () => s.halted, running: () => running };
  current = api;
  return () => {
    io.disconnect();
    off?.();
    document.removeEventListener("keydown", onKey);
    if (current === api) current = null;
  };
}

/** The board on the page, if one is mounted. */
export const currentBoard = () => current;

// M-x coffee-refill: four times the clock for a while.
on("caffeine", ({ factor, seconds }) => {
  boost = factor;
  if (current) {
    if (current.halted()) current.reset();
    if (!current.running()) current.run(true);
  }
  let left = seconds;
  clearInterval(boostTimer);
  setSegment("misc", `${factor}× clock ${left}s`);
  boostTimer = setInterval(() => {
    left--;
    if (left > 0) return setSegment("misc", `${factor}× clock ${left}s`);
    clearInterval(boostTimer);
    boost = 1;
    setSegment("misc", "");
    message("The caffeine wore off. The clock is back to normal.");
  }, 1000);
});
