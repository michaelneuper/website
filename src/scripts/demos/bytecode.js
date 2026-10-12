// Integer expressions compiled to JVM bytecode, then run on an operand stack
// with Java's int semantics (wrap-around, truncating division, / by zero).

import { reducedMotion } from "../util.js";
import "../../styles/demos/bytecode.css";

const LOCALS = { x: 6, y: 7, z: -2 }; // slots 0, 1, 2 of a static method
const SLOT = { x: 0, y: 1, z: 2 };
const OPS = { "+": "iadd", "-": "isub", "*": "imul", "/": "idiv", "%": "irem" };

function tokenize(src) {
  const out = [];
  const re = /\s*(?:(\d+)|([A-Za-z_]\w*)|(.))/gy;
  let m;
  while (re.lastIndex < src.length && (m = re.exec(src))) {
    const pos = m.index + m[0].length - (m[1] || m[2] || m[3] || "").length;
    if (m[1]) out.push({ t: "num", v: m[1], pos });
    else if (m[2]) out.push({ t: "id", v: m[2], pos });
    else if (m[3] && m[3].trim()) out.push({ t: "op", v: m[3], pos });
  }
  out.push({ t: "end", pos: src.length });
  return out;
}

class CompileError extends Error {
  constructor(msg, pos) { super(msg); this.pos = pos; }
}

function parse(src) {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i];
  const next = () => toks[i++];
  const expect = (v) => {
    const t = next();
    if (t.v !== v) throw new CompileError(`'${v}' expected`, t.pos);
  };
  function expr() {
    let l = term();
    while (peek().t === "op" && "+-".includes(peek().v)) l = { t: "bin", op: next().v, l, r: term() };
    return l;
  }
  function term() {
    let l = unary();
    while (peek().t === "op" && "*/%".includes(peek().v)) l = { t: "bin", op: next().v, l, r: unary() };
    return l;
  }
  function unary() {
    if (peek().t === "op" && peek().v === "-") { next(); return { t: "neg", e: unary() }; }
    if (peek().t === "op" && peek().v === "+") { next(); return unary(); }
    return primary();
  }
  function primary() {
    const t = next();
    if (t.t === "num") {
      const v = Number(t.v);
      if (v > 2147483647) throw new CompileError("integer number too large", t.pos);
      return { t: "num", v };
    }
    if (t.t === "id") {
      if (!(t.v in SLOT)) throw new CompileError(`cannot find symbol: variable ${t.v}`, t.pos);
      return { t: "var", name: t.v };
    }
    if (t.v === "(") { const e = expr(); expect(")"); return e; }
    throw new CompileError(t.t === "end" ? "illegal start of expression" : `unexpected '${t.v}'`, t.pos);
  }
  const tree = expr();
  if (peek().t !== "end") throw new CompileError(`unexpected '${peek().v}'`, peek().pos);
  return tree;
}

function codegen(tree) {
  const code = [];
  const pool = [];
  const emit = (op, arg, size = 1) => code.push({ op, arg, size });
  (function gen(n) {
    if (n.t === "num") {
      const v = n.v;
      if (v >= -1 && v <= 5) emit(v === -1 ? "iconst_m1" : `iconst_${v}`);
      else if (v >= -128 && v <= 127) emit("bipush", v, 2);
      else if (v >= -32768 && v <= 32767) emit("sipush", v, 3);
      else {
        let k = pool.indexOf(v);
        if (k < 0) k = pool.push(v) - 1;
        emit("ldc", v, 2);
        code[code.length - 1].text = `ldc #${k + 2}`;
      }
    } else if (n.t === "var") emit(`iload_${SLOT[n.name]}`, n.name);
    else if (n.t === "neg") { gen(n.e); emit("ineg"); }
    else { gen(n.l); gen(n.r); emit(OPS[n.op]); }
  })(tree);
  emit("ireturn");
  let off = 0;
  for (const c of code) { c.off = off; off += c.size; }
  return code;
}

function exec(ins, stack) {
  const pop = () => stack.pop();
  if (ins.op.startsWith("iconst_")) stack.push(ins.op === "iconst_m1" ? -1 : +ins.op.slice(7));
  else if (ins.op === "bipush" || ins.op === "sipush" || ins.op === "ldc") stack.push(ins.arg);
  else if (ins.op.startsWith("iload_")) stack.push(LOCALS[ins.arg]);
  else if (ins.op === "ineg") stack.push(-pop() | 0);
  else if (ins.op === "ireturn") return { done: true, value: stack[stack.length - 1] };
  else {
    const b = pop();
    const a = pop();
    if ((ins.op === "idiv" || ins.op === "irem") && b === 0) throw new Error("java.lang.ArithmeticException: / by zero");
    stack.push(
      ins.op === "iadd" ? (a + b) | 0
        : ins.op === "isub" ? (a - b) | 0
          : ins.op === "imul" ? Math.imul(a, b)
            : ins.op === "idiv" ? Math.trunc(a / b) | 0
              : (a % b) | 0,
    );
  }
  return { done: false };
}

export function mount(host) {
  host.innerHTML = `
    <div class="bc-input">
      <input type="text" name="expression" value="(x + 3) * y - 10 / z" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="Expression to compile">
      <button type="button" class="btn" data-k="step">step</button>
      <button type="button" class="btn" data-k="run">run</button>
    </div>
    <p class="dim" style="margin:0 0 12px">int x = 6, y = 7, z = -2 (local variable slots 0 to 2)</p>
    <div class="bc-cols">
      <div><div class="dim">javap -c</div><ol class="bc-code" translate="no"></ol></div>
      <div><div class="dim">operand stack</div><div class="bc-stack"></div><p class="dim" data-k="result" aria-live="polite" style="margin:8px 0 0"></p></div>
    </div>`;
  const input = host.querySelector("input");
  const list = host.querySelector(".bc-code");
  const stackEl = host.querySelector(".bc-stack");
  // Only the outcome is announced: what it returns, the exception, or why it
  // won't compile when you try to step or run it (not on every keystroke).
  const result = host.querySelector('[data-k="result"]');
  let code = [];
  let error = "";
  let pc = 0;
  let stack = [];
  let timer = 0;
  let finished = false;

  function compile() {
    clearInterval(timer);
    pc = 0;
    stack = [];
    finished = false;
    error = "";
    try {
      code = codegen(parse(input.value));
      list.replaceChildren(...code.map((c) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="off">${c.off}:</span><span><span class="op">${c.text ? "ldc" : c.op}</span>${c.text ? ` ${c.text.slice(4)}<span class="dim">  // int ${c.arg}</span>` : c.arg !== undefined && !c.op.startsWith("iload") ? ` ${c.arg}` : ""}</span>`;
        return li;
      }));
      result.textContent = "";
    } catch (e) {
      code = [];
      error = `error: ${e.message}`;
      const pre = document.createElement("li");
      pre.className = "bc-err";
      pre.textContent = `${error}\n  ${input.value}\n  ${" ".repeat(e.pos ?? 0)}^`;
      list.replaceChildren(pre);
      result.textContent = "";
    }
    paint();
  }

  function paint() {
    [...list.children].forEach((li, i) => {
      if (i === pc && !finished && code.length > 0) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    stackEl.replaceChildren(...stack.map((v) => {
      const s = document.createElement("span");
      s.textContent = v;
      return s;
    }));
  }

  function step() {
    if (!code.length) {
      result.textContent = error;
      return false;
    }
    if (finished) { pc = 0; stack = []; finished = false; result.textContent = ""; }
    try {
      const r = exec(code[pc], stack);
      if (r.done) {
        finished = true;
        result.textContent = `returns ${r.value}`;
      } else pc++;
    } catch (e) {
      finished = true;
      result.textContent = e.message;
    }
    paint();
    return !finished;
  }

  function run() {
    clearInterval(timer);
    // nothing compiled: step says why
    if (!code.length) { step(); return; }
    if (finished) step();
    if (reducedMotion.matches) {
      while (step()) { /* run to the end */ }
      return;
    }
    timer = setInterval(() => { if (!step()) clearInterval(timer); }, 320);
  }

  let debounce = 0;
  input.addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(compile, 180); });
  // Enter compiles now, so a compile still pending from typing mustn't stop the run
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); clearTimeout(debounce); compile(); run(); } });
  host.querySelector('[data-k="step"]').addEventListener("click", () => { clearInterval(timer); step(); });
  host.querySelector('[data-k="run"]').addEventListener("click", run);
  compile();
  return () => { clearInterval(timer); clearTimeout(debounce); };
}
