// The 8-bit computer's board: Ben Eater's layout drawn from the simulated
// machine in machine.js, with RAM you can edit, the bus, the control word and a
// 7-segment display. The 8-bit project mounts it as its demo.

import { $, $$, hex, reducedMotion, onFrame, isTyping } from "../../util.js";
import { message } from "../../emacs/index.js";
import { LINES, L, LABEL, OPS, PROGRAMS, controlWord, alu, busValue, tick, resetState, disasm, assemble } from "./machine.js";
import { clockBoost, currentBoard, setCurrentBoard } from "./commands.js";
import "../../../styles/demos/computer.css";

// ── 7-segment digits ──────────────────────────────────────────────────

const H = (y, x1, x2) => `M${x1} ${y}l1.6 -1.6H${x2 - 1.6}l1.6 1.6l-1.6 1.6H${x1 + 1.6}z`;
const V = (x, y1, y2) => `M${x} ${y1}l1.6 1.6V${y2 - 1.6}l-1.6 1.6l-1.6 -1.6V${y1 + 1.6}z`;
const SEGS = { a: H(2, 3, 19), b: V(20, 3, 18.4), c: V(20, 19.6, 35), d: H(36, 3, 19), e: V(2, 19.6, 35), f: V(2, 3, 18.4), g: H(19, 3, 19) };
const GLYPH = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g", " ": "" };

// ── UI ────────────────────────────────────────────────────────────────

// with a non-breaking space, so the unit never wraps away from its number
const fmtHz = (f) => (f < 10 ? `${f.toFixed(1)} Hz` : `${Math.round(f)} Hz`);

// The controls go above the board so they're in sight with it; c, n and r are
// in the buttons' tooltips and in M-x (commands.js).
const TEMPLATE = `
  <div class="sim-bar">
    <button type="button" class="btn" data-sim="run" aria-pressed="false" title="Run or pause (c)" aria-keyshortcuts="c">run</button>
    <button type="button" class="btn" data-sim="step" title="Step one clock cycle (n)" aria-keyshortcuts="n">step</button>
    <button type="button" class="btn" data-sim="reset" title="Reset, keeping RAM (r)" aria-keyshortcuts="r">reset</button>
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
      <output>10&nbsp;Hz</output>
    </label>
  </div>
  <div class="board" role="group" aria-label="Simulated 8-bit breadboard computer"></div>`;

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
  let touch = false; // a coarse pointer: RAM rows are the targets, not bits
  let editing = -1; // the address open in the row editor
  let dirty = true;
  let lastBoost = clockBoost();
  const effHz = () => Math.min(500, hz * clockBoost());

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
    const lines = el("span", "sigs");
    head.append(el("span", "mod-name", name), lines);
    for (const sig of sigs) {
      const t = el("span", "sig", LABEL[sig] ?? sig);
      t.dataset.sig = sig;
      lines.append(t);
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
    row.dataset.addr = a;
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
    ramRows.push({ row, pcMark, bits, cells, dis });
  }
  ram.body.replaceWith(rows);

  // A bit is too small to tap, so on a coarse pointer each row is the target and
  // opens this editor for its byte. It goes over the board under the row (above
  // it near the bottom), so nothing on the board moves as it opens and closes.
  const editor = el("div", "mod ram-edit");
  editor.setAttribute("role", "dialog");
  editor.hidden = true;
  const edHead = el("div", "mod-head");
  const edAddr = el("span", "mod-name");
  const edDis = el("span", "mod-val");
  const edClose = el("button", "btn", "close");
  edClose.type = "button";
  edHead.append(edAddr, edDis, edClose);
  const edBits = el("div", "ram-edit-bits");
  const edCells = [];
  for (let b = 7; b >= 0; b--) {
    const t = el("button", "ram-edit-bit");
    t.type = "button";
    t.dataset.bit = b;
    t.setAttribute("aria-label", `Bit ${b}`);
    t.append(el("span", "led"), el("span", "", String(b)));
    edBits.append(t);
    edCells.push(t);
  }
  editor.append(edHead, edBits);
  ram.m.append(editor);

  const ir = mod("ir", "instruction", ["II", "IO"]);
  ir.body.append(leds(ir, 8, "", 4), value(ir));
  // the opcode nibble in green, the operand in yellow
  ir.leds.forEach((l, i) => l.classList.add(i < 4 ? "g" : "y"));

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
  // The display is a toggle for signed numbers. The number it shows is read out
  // from outLabel beside it, so the button's name stays put as the number changes.
  const outLabel = el("span", "sr-only");
  const outBtn = el("button", "mod-body");
  outBtn.type = "button";
  outBtn.title = "Click to switch between unsigned and signed";
  outBtn.setAttribute("aria-label", "Signed numbers");
  outBtn.append(seg, value(out));
  out.body.replaceWith(outLabel, outBtn);
  const flags = mod("flags", "flags", ["FI"]);
  const fl = el("div", "leds");
  const cfLed = el("span", "led g");
  const zfLed = el("span", "led g");
  fl.append(cfLed, el("span", "dim", "C"), el("span", "gap"), zfLed, el("span", "dim", "Z"));
  fl.style.alignItems = "center";
  flags.body.append(fl, value(flags));
  const pcRow = el("div", "mod-pair");
  pcRow.append(pc.m, flags.m);

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

  // the microstep counter beside the clock it counts, and the control word that step sets
  const stepMod = mod("step", "microstep counter", []);
  const stepWrap = el("div", "cw");
  const stepLeds = [];
  for (let i = 0; i < 5; i++) {
    const bit = el("span", "cw-bit");
    const l = el("span", "led g");
    bit.append(l, el("span", "", `T${i}`));
    stepWrap.append(bit);
    stepLeds.push([bit, l]);
  }
  stepMod.body.replaceWith(stepWrap);
  const ctrl = mod("ctrl", "control word", []);
  const cwWrap = el("div", "cw");
  const cwBits = LINES.map((n) => {
    const bit = el("span", "cw-bit");
    const l = el("span", "led y");
    bit.append(l, el("span", "", LABEL[n] ?? n));
    cwWrap.append(bit);
    return [bit, l];
  });
  const ustep = el("p", "ustep");
  ctrl.body.replaceWith(cwWrap);
  ctrl.m.append(ustep);
  const clkRow = el("div", "mod-pair");
  clkRow.append(clk.m, stepMod.m);
  left.append(clkRow, mar.m, ram.m, ir.m);
  right.append(pcRow, a.m, sum.m, b.m, out.m, ctrl.m);

  board.replaceChildren(left, bus, right);

  // ── render ─────────────────────────────────────────────────────────
  const setBits = (list, v, n = list.length) => {
    for (let i = 0; i < n; i++) list[i].classList.toggle("on", ((v >> (n - 1 - i)) & 1) === 1);
  };
  const setText = (node, text) => {
    if (node.textContent !== text) node.textContent = text;
  };
  const setAttr = (node, name, v) => {
    if (node.getAttribute(name) !== v) node.setAttribute(name, v);
  };
  // bit i of a byte counting from bit 7, the order the LEDs are laid out in
  const bitOn = (byte, i) => ((byte >> (7 - i)) & 1) === 1;
  const disText = (addr) => {
    const data = program.data[addr];
    return data ? `${data[0]} = ${s.ram[addr]}` : disasm(s.ram[addr]);
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
    setText(clk.val, s.halted ? "halted" : running ? (clockBoost() > 1 ? `${fmtHz(effHz())} (${clockBoost()}×)` : fmtHz(hz)) : "paused");

    // output display
    const o = signed && s.out > 127 ? -(256 - s.out) : s.out;
    const txt = (o < 0 ? "-" : " ") + String(Math.abs(o)).padStart(3, " ");
    txt.split("").forEach((ch, i) => {
      const on = GLYPH[ch] ?? "";
      for (const [k, p] of Object.entries(digits[i])) p.classList.toggle("on", on.includes(k));
    });
    setText(out.val, signed ? "signed" : "");
    setText(outLabel, `output ${o}`);
    setAttr(outBtn, "aria-pressed", String(signed));

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
        rr.cells.forEach((c, i) => {
          const on = bitOn(s.ram[addr], i);
          c.classList.toggle("on", on);
          setAttr(c, "aria-pressed", String(on));
        });
        rr.row.classList.toggle("is-mar", addr === s.mar);
        setText(rr.pcMark, addr === s.pc ? "▸" : "");
        const text = disText(addr);
        setText(rr.dis, text);
        if (touch) setAttr(rr.row, "aria-label", `Address ${addr}, ${text}`);
      });
      paintEditor();
    }
  }

  function paintEditor() {
    if (editing < 0) return;
    setText(edAddr, `address ${hex(editing, 1)}`);
    setText(edDis, disText(editing));
    edCells.forEach((t, i) => {
      const on = bitOn(s.ram[editing], i);
      t.firstChild.classList.toggle("on", on);
      setAttr(t, "aria-pressed", String(on));
    });
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
    if (clockBoost() !== lastBoost) {
      lastBoost = clockBoost();
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

  // a toggle keeps its label, as the scheduler's pause does: pressed means running
  function paintRun() {
    runBtn.setAttribute("aria-pressed", String(running));
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
    const text = fmtHz(hz);
    hzOut.value = text;
    // the slider's own 0 to 100 means nothing read out, so it gives the speed
    hzIn.setAttribute("aria-valuetext", text);
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
  outBtn.addEventListener("click", () => {
    signed = !signed;
    dirty = true;
    message(signed ? "Output shows signed two’s complement" : "Output shows unsigned");
  });

  // Edit RAM by clicking bits; arrow keys move around the matrix. On touch a tap
  // on a row opens the row editor instead, and the arrow keys move between rows.
  rows.addEventListener("click", (e) => {
    if (touch) {
      const row = e.target.closest(".ram-row");
      if (row) toggleEditor(+row.dataset.addr);
      return;
    }
    const btn = e.target.closest(".led");
    if (!btn) return;
    s.ram[+btn.dataset.addr] ^= 1 << +btn.dataset.bit;
    focusCell(+btn.dataset.addr, +btn.dataset.bit);
    dirty = true;
  });
  rows.addEventListener("keydown", (e) => {
    if (touch) return rowKey(e);
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

  // ── touch: rows and the row editor ─────────────────────────────────
  // On a coarse pointer each row is a button, and the bits in it are inert, so a
  // tap anywhere on the row lands on the row.
  const coarse = matchMedia("(pointer: coarse)");
  function setTouch(on) {
    closeEditor(false);
    touch = on;
    board.classList.toggle("is-touch", on);
    ramRows.forEach((rr, addr) => {
      rr.bits.inert = on;
      if (on) {
        rr.row.setAttribute("role", "button");
        rr.row.setAttribute("aria-haspopup", "dialog");
        rr.row.setAttribute("aria-expanded", "false");
        rr.row.tabIndex = addr === 0 ? 0 : -1;
      } else {
        for (const name of ["role", "aria-haspopup", "aria-expanded", "aria-label", "tabindex"]) rr.row.removeAttribute(name);
      }
    });
    // render() labels the rows
    lastRam = "";
    dirty = true;
  }
  const onPointer = () => setTouch(coarse.matches);
  coarse.addEventListener("change", onPointer);

  function rowKey(e) {
    const row = e.target.closest(".ram-row");
    if (!row) return;
    const addr = +row.dataset.addr;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleEditor(addr);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      focusRow((addr + (e.key === "ArrowUp" ? 15 : 1)) % 16);
    }
  }
  // the rows are one tab stop, on the row last used
  const roveTo = (addr) => ramRows.forEach((rr, i) => { rr.row.tabIndex = i === addr ? 0 : -1; });
  function focusRow(addr) {
    roveTo(addr);
    ramRows[addr].row.focus({ preventScroll: true });
  }

  function toggleEditor(addr) {
    if (editing === addr) return closeEditor(true);
    closeEditor(false);
    editing = addr;
    roveTo(addr);
    ramRows[addr].row.setAttribute("aria-expanded", "true");
    editor.setAttribute("aria-label", `Edit address ${addr}`);
    editor.hidden = false;
    paintEditor();
    place();
    // Focus moves in without scrolling, which would slide the bits out from
    // under a finger; the page only scrolls if the editor runs off screen.
    edCells[0].focus({ preventScroll: true });
    editor.scrollIntoView({ block: "nearest" });
    document.addEventListener("pointerdown", onOutside);
  }
  function closeEditor(refocus) {
    if (editing < 0) return;
    const row = ramRows[editing].row;
    editing = -1;
    editor.hidden = true;
    row.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onOutside);
    if (refocus) row.focus({ preventScroll: true });
  }
  // a tap anywhere else closes it, as a popup would
  const onOutside = (e) => {
    if (!editor.contains(e.target) && !rows.contains(e.target)) closeEditor(false);
  };
  // under its row, or above it if it would run past the bottom of the board
  function place() {
    if (editing < 0) return;
    const row = ramRows[editing].row;
    const below = row.offsetTop + row.offsetHeight;
    editor.style.top = `${below + editor.offsetHeight > board.clientHeight ? row.offsetTop - editor.offsetHeight : below}px`;
  }
  const ro = new ResizeObserver(place);
  ro.observe(board);

  editor.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (t === edClose) closeEditor(true);
    else if (t) {
      s.ram[editing] ^= 1 << +t.dataset.bit;
      render();
    }
  });
  editor.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    closeEditor(true);
  });

  // The loop runs while the board is on screen. c, n and r work while focus is
  // in the demo, or on nothing at all with at least a quarter of the board in
  // view, so a key meant for something else on the page never resets it.
  let visible = false;
  let off = null;
  const io = new IntersectionObserver(([e]) => {
    visible = e.intersectionRatio >= 0.25;
    if (e.isIntersecting && !off) off = onFrame(frame);
    else if (!e.isIntersecting && off) { off(); off = null; }
  }, { threshold: [0, 0.25] });
  io.observe(board);
  const onKey = (e) => {
    if (e.defaultPrevented || e.repeat || isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const focus = document.activeElement;
    if (!host.contains(focus) && !(visible && (!focus || focus === document.body))) return;
    if (document.querySelector("dialog[open]")) return;
    const act = { c: () => run(), n: step, r: reset }[e.key];
    if (!act) return;
    e.preventDefault();
    act();
  };
  document.addEventListener("keydown", onKey);

  load("fibonacci");
  setHz(+hzIn.value);
  setTouch(coarse.matches);
  // It waits for run (or c) so it doesn't flicker beside the write-up, unless a coffee overclock is on.
  run(clockBoost() > 1);
  // Drawn once now, so the board is its full height before it scrolls into view
  // (its values fill in, and the page under it would shift).
  render();
  const api = { run, step, reset, load, board, halted: () => s.halted, running: () => running };
  setCurrentBoard(api);
  return () => {
    io.disconnect();
    ro.disconnect();
    off?.();
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("pointerdown", onOutside);
    coarse.removeEventListener("change", onPointer);
    if (currentBoard() === api) setCurrentBoard(null);
  };
}
