// Ben Eater's 8-bit breadboard computer, simulated one clock cycle at a time.
//
// Same architecture as the build: a 4-bit address space with 16 bytes of RAM,
// an 8-bit bus, A and B registers, an adder/subtractor, an output register on
// a 7-segment display, carry and zero flags, and microcode that drives sixteen
// control lines over five steps per instruction.
//
// This is the machine itself, with no page attached: board.js draws it and
// commands.js drives it from M-x.

// Control lines, in the order the control-word LEDs show them.
export const LINES = ["HLT", "MI", "RI", "RO", "IO", "II", "AI", "AO", "EO", "SU", "BI", "OI", "CE", "CO", "J", "FI"];
export const L = Object.fromEntries(LINES.map((n, i) => [n, 1 << (15 - i)]));
// How the lines are printed on the board: the sum-out line is ΣO, as on the build.
export const LABEL = { EO: "ΣO" };

export const OPS = { 0: "NOP", 1: "LDA", 2: "ADD", 3: "SUB", 4: "STA", 5: "LDI", 6: "JMP", 7: "JC", 8: "JZ", 14: "OUT", 15: "HLT" };
const CODE = Object.fromEntries(Object.entries(OPS).map(([k, v]) => [v, +k]));
const TAKES_ARG = new Set(["LDA", "ADD", "SUB", "STA", "LDI", "JMP", "JC", "JZ"]);

// Microcode. Every instruction starts with the same two fetch steps.
const FETCH = [L.CO | L.MI, L.RO | L.II | L.CE];
const MICRO = {
  LDA: [L.IO | L.MI, L.RO | L.AI, 0],
  ADD: [L.IO | L.MI, L.RO | L.BI, L.EO | L.AI | L.FI],
  SUB: [L.IO | L.MI, L.RO | L.BI, L.EO | L.AI | L.SU | L.FI],
  STA: [L.IO | L.MI, L.AO | L.RI, 0],
  LDI: [L.IO | L.AI, 0, 0],
  JMP: [L.IO | L.J, 0, 0],
  JC: [L.IO | L.J, 0, 0],
  JZ: [L.IO | L.J, 0, 0],
  OUT: [L.AO | L.OI, 0, 0],
  HLT: [L.HLT, 0, 0],
};

export function controlWord(s) {
  if (s.step < 2) return FETCH[s.step];
  const op = OPS[s.ir >> 4];
  if (!MICRO[op]) return 0;
  if ((op === "JC" && !s.cf) || (op === "JZ" && !s.zf)) return 0;
  return MICRO[op][s.step - 2];
}

export function alu(s, cw) {
  const raw = cw & L.SU ? s.a + ((~s.b & 0xff) + 1) : s.a + s.b;
  return { sum: raw & 0xff, carry: raw > 0xff ? 1 : 0, zero: (raw & 0xff) === 0 ? 1 : 0 };
}

export function busValue(s, cw, sum) {
  if (cw & L.CO) return s.pc;
  if (cw & L.RO) return s.ram[s.mar];
  if (cw & L.IO) return s.ir & 0x0f;
  if (cw & L.AO) return s.a;
  if (cw & L.EO) return sum;
  return 0; // pull-down resistors
}

// One rising clock edge: everything with an "in" line latches the bus.
export function tick(s) {
  if (s.halted) return;
  const cw = controlWord(s);
  const r = alu(s, cw);
  const v = busValue(s, cw, r.sum);
  if (cw & L.MI) s.mar = v & 0x0f;
  if (cw & L.RI) s.ram[s.mar] = v;
  if (cw & L.II) s.ir = v;
  if (cw & L.AI) s.a = v;
  if (cw & L.BI) s.b = v;
  if (cw & L.OI) s.out = v;
  if (cw & L.FI) { s.cf = r.carry; s.zf = r.zero; }
  if (cw & L.J) s.pc = v & 0x0f;
  if (cw & L.CE) s.pc = (s.pc + 1) & 0x0f;
  s.step = (s.step + 1) % 5;
  s.cycles++;
  // HLT gates the clock as soon as its control word appears.
  if (controlWord(s) & L.HLT) s.halted = true;
}

export function resetState(s) {
  Object.assign(s, { a: 0, b: 0, ir: 0, mar: 0, pc: 0, out: 0, step: 0, cf: 0, zf: 0, halted: false, cycles: 0 });
}

export const disasm = (byte) => {
  const op = OPS[byte >> 4] ?? "???";
  return TAKES_ARG.has(op) ? `${op} ${byte & 15}` : op;
};

// ── programs ──────────────────────────────────────────────────────────

export const PROGRAMS = {
  fibonacci: {
    title: "fibonacci",
    code: [["LDI", 1], ["STA", 15], ["LDI", 0], ["OUT"], ["ADD", 15], ["JC", 0], ["STA", 14], ["LDA", 15],
      ["STA", 13], ["LDA", 14], ["STA", 15], ["LDA", 13], ["JMP", 3]],
    data: { 13: ["z", 0], 14: ["t", 0], 15: ["y", 0] },
  },
  multiply: {
    title: "multiply 7 × 6",
    code: [["LDA", 14], ["SUB", 12], ["JC", 6], ["LDA", 13], ["OUT"], ["HLT"], ["STA", 14], ["LDA", 13],
      ["ADD", 15], ["STA", 13], ["JMP", 0]],
    data: { 12: ["one", 1], 13: ["prod", 0], 14: ["y", 6], 15: ["x", 7] },
  },
  count: {
    title: "count up and down",
    code: [["OUT"], ["ADD", 15], ["JC", 4], ["JMP", 0], ["SUB", 15], ["OUT"], ["JZ", 0], ["JMP", 4]],
    data: { 15: ["step", 5] },
  },
  add: {
    title: "add 28 + 14",
    code: [["LDA", 14], ["ADD", 15], ["OUT"], ["HLT"]],
    data: { 14: ["a", 28], 15: ["b", 14] },
  },
};

export function assemble(p) {
  const ram = new Uint8Array(16);
  p.code.forEach(([op, arg = 0], i) => { ram[i] = (CODE[op] << 4) | (arg & 15); });
  for (const [addr, [, v]] of Object.entries(p.data)) ram[addr] = v;
  return ram;
}
