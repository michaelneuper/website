// The code wall behind the name: three Emacs windows of my C (src/data/wall.js),
// after the wall on hancore.dev. Each window scrolls at its own pace, and now
// and then a ghost evil cursor changes a word, makes a typo, fixes it and undoes
// the change. With a mouse, pointing at a line lights it. The wall is only
// decoration: the canvas is aria-hidden, and without JavaScript the landing
// section is the name and lede on their own.

import { $, clamp, ease, on, reducedMotion, themeColors, frameWhileVisible, fitCanvas, fontsReady } from "../util.js";
import { setSegment } from "../emacs/index.js";
import { WALL } from "../../data/wall.js";

const FONT_PX = 12;
const FONT = `${FONT_PX}px "JetBrains Mono", ui-monospace, monospace`;
const LH = 17;
const NUM_W = 5; // the line numbers, display-line-numbers-width 4 and a space
const GAP = 4; // blank lines between the end of a file and its start again
const NARROW = 920; // one window below the width where the nav becomes a menu
const FEATHER = 160; // how far the calm patch around the name fades out
const CALM = 0.03; // what's left of the wall behind the name
const TAB = 4; // the files' tab-width

// doom-gruvbox's font-lock, faint: [colour, alpha]
const KIND = {
  keyword: ["red", 0.5], string: ["green", 0.46], number: ["magenta", 0.5], constant: ["magenta", 0.46],
  function: ["yellow", 0.46], type: ["blue", 0.46], ident: ["fg", 0.36], member: ["fg", 0.3], punct: ["fg", 0.24],
  comment: ["dim", 0.42],
};

// ── reading C, a line at a time ───────────────────────────────────────

const KEYWORDS = new Set(("if else for while do switch case default break continue return goto sizeof " +
  "typedef struct enum union static const extern inline volatile register").split(" "));
const TYPES = new Set("void char short int long float double signed unsigned bool size_t FILE".split(" "));
const CONSTANTS = new Set("true false NULL TRUE FALSE".split(" "));

// inBlock: the line starts inside a /* */ comment (see blockComments).
function tokenize(line, inBlock) {
  const out = [];
  let rest = line;
  if (inBlock) {
    const end = line.indexOf("*/");
    if (end < 0) return [[line, "comment"]];
    out.push([line.slice(0, end + 2), "comment"]);
    rest = line.slice(end + 2);
  }
  const pre = !inBlock && rest.match(/^(\s*)(#\s*\w+)(\s*)(<[^>]*>)?(.*)$/);
  if (pre) {
    if (pre[1]) out.push([pre[1], "space"]);
    out.push([pre[2], "keyword"]);
    if (pre[3]) out.push([pre[3], "space"]);
    if (pre[4]) out.push([pre[4], "string"]);
    rest = pre[5];
  }
  const re = /(\/\/.*$|\/\*.*?(?:\*\/|$))|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?[fFuUlL]*\b)|([A-Za-z_]\w*)|(\s+)|([^\s])/g;
  let m;
  while ((m = re.exec(rest))) {
    if (m[1]) out.push([m[1], "comment"]);
    else if (m[2]) out.push([m[2], "string"]);
    else if (m[3]) out.push([m[3], "number"]);
    else if (m[4]) {
      const w = m[4];
      let kind = "ident";
      if (KEYWORDS.has(w)) kind = "keyword";
      else if (TYPES.has(w) || /_t$/.test(w)) kind = "type";
      else if (CONSTANTS.has(w)) kind = "constant";
      else if (/^\s*\(/.test(rest.slice(re.lastIndex))) kind = "function";
      else if (/(\.|->)$/.test(rest.slice(0, m.index))) kind = "member";
      else if (/^[A-Z][A-Z0-9_]+$/.test(w)) kind = "constant";
      else if (/^[A-Z]/.test(w)) kind = "type";
      out.push([w, kind]);
    } else if (m[5]) out.push([m[5], "space"]);
    else out.push([m[6], "punct"]);
  }
  return out;
}

// For each line, whether it starts inside a /* */ comment.
function blockComments(lines) {
  let open = false;
  return lines.map((line) => {
    const start = open;
    let i = 0;
    while (i < line.length) {
      if (open) {
        const end = line.indexOf("*/", i);
        if (end < 0) break;
        open = false;
        i = end + 2;
      } else {
        const m = line.slice(i).match(/\/\*|\/\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/);
        if (!m || m[0] === "//") break;
        i += m.index + m[0].length;
        if (m[0] === "/*") open = true;
      }
    }
    return start;
  });
}

// Tabs to spaces, to the next tab stop.
function untab(line) {
  let out = "";
  for (const ch of line) out += ch === "\t" ? " ".repeat(TAB - (out.length % TAB)) : ch;
  return out;
}

// ── typos ─────────────────────────────────────────────────────────────

const KEY_ROWS = ["1234567890-=", "qwertyuiop[]", "asdfghjkl;'", "zxcvbnm,./"];

// A key next to ch on the keyboard, the kind of key a finger slips onto.
function nearKey(ch) {
  const lower = ch.toLowerCase();
  for (const row of KEY_ROWS) {
    const i = row.indexOf(lower);
    if (i < 0) continue;
    const opts = [row[i - 1], row[i + 1]].filter(Boolean);
    const k = opts[Math.floor(Math.random() * opts.length)];
    return ch === lower ? k : k.toUpperCase();
  }
  return null;
}

const mod = (a, n) => ((a % n) + n) % n;
const smooth = (x) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

export async function initWall() {
  const hero = $(".hero");
  const canvas = $(".hero-wall");
  const id = $(".hero-id");
  if (!hero || !canvas || !id) return;

  // While the landing section is the buffer in the modeline, its file is the one
  // in the window pointed at, or the one the ghost is in. Listen before waiting
  // for the fonts, so the first section event isn't missed.
  let current = $(".ml-buf")?.textContent === hero.dataset.file;
  on("section", (sec) => {
    current = sec === "top";
  });

  await fontsReady();
  const ctx = canvas.getContext("2d");
  ctx.font = FONT;
  const cw = ctx.measureText("M").width;
  const rand = Math.random;

  // One view per file: its text (which the ghost edits), tokens and scroll.
  const views = WALL.map((w, n) => {
    const lines = w.text.replace(/\n+$/, "").split("\n").map(untab);
    const src = {
      lines,
      start: w.start,
      file: w.path.split("/").pop(),
      path: `~/Developer/${w.repo}/${w.path}`,
      inBlock: blockComments(lines),
    };
    const edits = w.edits.flatMap((e) => {
      const idx = lines.findIndex((l) => l.includes(e.line));
      if (idx < 0) return [];
      return [{ idx, col: lines[idx].indexOf(e.line) + e.line.indexOf(e.word), len: e.word.length, text: e.text }];
    });
    return {
      src,
      edits,
      text: [...lines],
      tokens: lines.map((l, i) => tokenize(l, src.inBlock[i])),
      len: lines.length,
      top: w.top,
      anim: null,
      period: 2.3 + n * 0.65,
      next: 1.5 + n * 0.9,
      point: w.top + 4,
      col: 0,
      mode: "N",
    };
  });

  let W = 0;
  let H = 0;
  let wins = [];
  let calm = { l: 0, t: 0, r: 0, b: 0 };
  let wall = 1; // how strong the wall is: fainter with one window, and in light themes
  let hover = null; // { win, k, idx }
  let dirty = true;

  // Each window has a modeline at the bottom, except the one window on a small
  // screen, where it would sit right on top of the page's own.
  const bodyTop = () => LH + 6;
  const bodyBottom = () => (wins.length > 1 ? H - LH - 2 : H);
  const bodyRows = () => Math.max(1, Math.floor((bodyBottom() - bodyTop()) / LH));

  // How much of the wall shows at (x, y): almost none behind the name and lede.
  function fadeAt(x, y) {
    const dx = Math.max(calm.l - x, 0, x - calm.r);
    const dy = Math.max(calm.t - y, 0, y - calm.b);
    return CALM + (1 - CALM) * smooth(Math.hypot(dx, dy) / FEATHER);
  }

  function layout() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    fitCanvas(canvas);
    const c = canvas.getBoundingClientRect();
    const h = id.getBoundingClientRect();
    calm = { l: h.left - c.left - 16, t: h.top - c.top - 12, r: h.right - c.left + 12, b: h.bottom - c.top + 12 };
    const n = W < NARROW ? 1 : 3;
    const w = (W - (n - 1)) / n;
    wins = Array.from({ length: n }, (_, i) => ({ x: Math.round(i * (w + 1)), w: Math.round(w), view: views[i] }));
    for (const win of wins) keepPointInView(win.view);
    dirty = true;
  }

  function keepPointInView(v) {
    const first = Math.floor(v.top);
    v.point = clamp(v.point, first + 1, first + bodyRows() - 2);
  }

  // ── drawing ─────────────────────────────────────────────────────────

  // Text in short pieces, so each fades by where it sits.
  function run(text, x, y, [colour, a]) {
    ctx.fillStyle = themeColors()[colour];
    for (let i = 0; i < text.length; i += 4) {
      const piece = text.slice(i, i + 4);
      if (!piece.trim()) continue;
      const px = x + i * cw;
      const f = a * wall * fadeAt(px + piece.length * cw / 2, y);
      if (f < 0.015) continue;
      ctx.globalAlpha = f;
      ctx.fillText(piece, px, y);
    }
    ctx.globalAlpha = 1;
  }

  // A band of colour, faded by where it sits.
  function band(x, y, w, h, colour, a) {
    ctx.fillStyle = themeColors()[colour];
    for (let bx = x; bx < x + w; bx += 16) {
      const bw = Math.min(16, x + w - bx);
      const f = a * fadeAt(bx + bw / 2, y + h / 2);
      if (f < 0.015) continue;
      ctx.globalAlpha = f;
      ctx.fillRect(bx, y, bw, h);
    }
    ctx.globalAlpha = 1;
  }

  function drawWindow(win) {
    const v = win.view;
    const x0 = win.x + cw;
    ctx.save();
    ctx.beginPath();
    ctx.rect(win.x, 0, win.w, H);
    ctx.clip();

    // the header line: the file
    run(v.src.path, x0, LH / 2 + 3, ["dim", 0.55]);

    // the text, with relative line numbers as in my config
    const top = bodyTop();
    const bottom = bodyBottom();
    ctx.save();
    ctx.beginPath();
    ctx.rect(win.x, top, win.w, bottom - top);
    ctx.clip();
    const first = Math.floor(v.top);
    const off = (v.top - first) * LH;
    const rows = bodyRows();
    for (let row = -1; row <= rows + 1; row++) {
      const k = first + row;
      const y = top + row * LH - off + LH / 2;
      const idx = mod(k, v.len + GAP);
      if (hover && hover.win === win && hover.k === k) {
        ctx.fillStyle = themeColors().hl;
        ctx.fillRect(win.x, y - LH / 2, win.w, LH);
      }
      if (idx >= v.len) continue;
      const num = k === v.point ? String(v.src.start + idx) : String(Math.abs(k - v.point));
      run(num.padStart(NUM_W - 1), x0, y, k === v.point ? ["fg", 0.55] : ["dim", 0.32]);
      let col = NUM_W;
      for (const [t, kind] of v.tokens[idx]) {
        if (kind !== "space") run(t, x0 + col * cw, y, KIND[kind]);
        col += t.length;
      }
      if (ghost.view === v && k === v.point) drawCursor(v, x0 + (NUM_W + v.col) * cw, y, v.text[idx]);
    }
    ctx.restore();
    if (bottom === H) {
      ctx.restore();
      return;
    }

    // the window's modeline: the line pointed at, or the cursor's
    band(win.x, H - LH, win.w, LH, "bgAlt", 0.7);
    const y = H - LH / 2;
    const pointed = hover?.win === win;
    const line = v.src.start + (pointed ? hover.idx : Math.min(mod(v.point, v.len + GAP), v.len - 1));
    const busy = ghost.view === v;
    run(`<${busy ? v.mode : "N"}>`, x0, y, [busy && v.mode === "I" ? "yellow" : "green", 0.6]);
    run(v.src.file, x0 + 5 * cw, y, ["fg", 0.55]);
    run(`${line}:${busy && !pointed ? v.col : 0}`, x0 + (6 + v.src.file.length) * cw, y, ["dim", 0.5]);
    run("C", win.x + win.w - 3 * cw, y, ["blue", 0.55]);
    ctx.restore();
  }

  function drawCursor(v, x, y, text) {
    const f = fadeAt(x, y);
    const c = themeColors();
    ctx.fillStyle = c.fg;
    if (v.mode === "I") {
      ctx.globalAlpha = 0.8 * f;
      ctx.fillRect(x, y - LH / 2 + 2, 2, LH - 4);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.globalAlpha = 0.75 * f;
    ctx.fillRect(x, y - LH / 2 + 1, cw, LH - 2);
    ctx.globalAlpha = 1;
    const ch = text[v.col];
    if (ch && ch !== " ") {
      ctx.fillStyle = c.bg;
      ctx.fillText(ch, x, y);
    }
  }

  function draw() {
    dirty = false;
    // Dark text on a light page reads more strongly at the same alpha.
    wall = (wins.length === 1 ? 0.5 : 0.62) * (themeColors().light ? 0.75 : 1);
    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;
    ctx.textBaseline = "middle";
    for (const win of wins) drawWindow(win);
    // the dividers between windows
    ctx.fillStyle = themeColors().rule;
    for (const win of wins.slice(1)) {
      for (let y = 0; y < H; y += 8) {
        ctx.globalAlpha = fadeAt(win.x - 1, y + 4);
        ctx.fillRect(win.x - 1, y, 1, 8);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ── the ghost: one evil cursor that edits a line and undoes it ─────────

  const ghost = { view: null, queue: [], wait: 0, last: null };

  const retokenize = (v, idx) => {
    v.tokens[idx] = tokenize(v.text[idx], v.src.inBlock[idx]);
  };

  // The visible row where the wall shows most, nearest the middle first.
  function goodRow(win) {
    const rows = bodyRows();
    let best = Math.floor(rows / 2);
    let bestScore = -1;
    for (let row = 2; row < rows - 2; row++) {
      const y = bodyTop() + row * LH + LH / 2;
      const score = fadeAt(win.x + (NUM_W + 12) * cw, y) - Math.abs(row - rows / 2) * 0.004;
      if (score > bestScore) {
        bestScore = score;
        best = row;
      }
    }
    return { row: best, score: bestScore };
  }

  // Queue one edit: to the line, w to the word, cw, the new word with a near
  // miss in it, Esc, a look, and u.
  function plan() {
    const scored = wins.map((win) => ({ win, ...goodRow(win) }));
    let pool = scored.filter((s) => s.score > 0.6 && s.win.view.edits.length);
    if (!pool.length) pool = scored.filter((s) => s.win.view.edits.length).sort((a, b) => b.score - a.score).slice(0, 1);
    if (pool.length > 1) pool = pool.filter((s) => s.win.view !== ghost.last);
    const pick = pool[Math.floor(rand() * pool.length)];
    if (!pick) return;
    const { win, row } = pick;
    const v = win.view;
    const period = v.len + GAP;
    const first = Math.floor(v.top);
    const want = first + row;
    // One of the two edits nearest to where the wall reads, so the window
    // seldom has to scroll far.
    const near = v.edits.map((e) => {
      const ahead = want + mod(e.idx - want, period);
      const k = ahead - want <= want - (ahead - period) ? ahead : ahead - period;
      return { e, k, d: Math.abs(k - want) };
    }).sort((a, b) => a.d - b.d);
    const { e, k } = near.length > 1 && near[1].d <= bodyRows() && rand() < 0.5 ? near[1] : near[0];
    const q = [];
    const at = (delay, fn) => q.push({ delay, fn });

    ghost.view = v;
    ghost.last = v;
    v.mode = "N";
    v.col = 0;
    keepPointInView(v);

    // Bring the line to where it reads, if it isn't there already.
    const rowNow = k - first;
    if (rowNow < 2 || rowNow > bodyRows() - 3 || fadeAt(win.x + (NUM_W + 12) * cw, bodyTop() + rowNow * LH + LH / 2) < 0.6) {
      const to = k - row;
      const dur = clamp(0.4 + Math.abs(to - v.top) * 0.012, 0.5, 1.2);
      at(dur + 0.1, () => scrollTo(v, to, now, dur));
      at(0.3, () => keepPointInView(v));
    }

    // j and k to the line, or a jump when it's far
    at(0.3, () => {
      const steps = k - v.point;
      if (Math.abs(steps) > 10) {
        v.point = k;
        return;
      }
      const dir = Math.sign(steps);
      for (let i = 0; i < Math.abs(steps); i++) ghost.queue.unshift({ delay: 0.07 + rand() * 0.05, fn: () => { v.point += dir; } });
    });
    // w to the word
    at(0.25, () => {
      const starts = [...v.text[e.idx].matchAll(/[A-Za-z0-9_]+|[^\sA-Za-z0-9_]+/g)].map((m) => m.index).filter((s) => s <= e.col);
      ghost.queue.unshift(...starts.map((s) => ({ delay: 0.12 + rand() * 0.06, fn: () => { v.col = s; } })));
    });
    // cw
    at(0.3, () => {
      v.col = e.col;
      v.mode = "I";
      const t = v.text[e.idx];
      v.text[e.idx] = t.slice(0, e.col) + t.slice(e.col + e.len);
      retokenize(v, e.idx);
    });
    const type = (ch) => () => {
      const t = v.text[e.idx];
      v.text[e.idx] = t.slice(0, v.col) + ch + t.slice(v.col);
      v.col++;
      retokenize(v, e.idx);
    };
    const backspace = () => {
      const t = v.text[e.idx];
      v.text[e.idx] = t.slice(0, v.col - 1) + t.slice(v.col);
      v.col--;
      retokenize(v, e.idx);
    };
    // the new word, with a wrong key somewhere that's noticed a key or two later
    const typoAt = rand() < 0.85 ? Math.floor(rand() * e.text.length) : -1;
    for (let i = 0; i < e.text.length; i++) {
      const wrong = i === typoAt ? nearKey(e.text[i]) : null;
      if (wrong) {
        at(0.09 + rand() * 0.08, type(wrong));
        const extra = i + 1 < e.text.length && rand() < 0.6;
        if (extra) at(0.09 + rand() * 0.08, type(e.text[i + 1]));
        at(0.45, backspace);
        if (extra) at(0.07, backspace);
      }
      at(0.09 + rand() * 0.08, type(e.text[i]));
    }
    // Esc, a look, then u
    at(0.35, () => {
      v.mode = "N";
      v.col = Math.max(0, v.col - 1);
    });
    at(1.8 + rand() * 0.8, () => {
      v.text[e.idx] = v.src.lines[e.idx];
      v.col = e.col;
      retokenize(v, e.idx);
    });
    at(1.4, () => { v.col = 0; });
    at(2.4 + rand() * 2, () => { ghost.view = null; });
    ghost.queue = q;
    ghost.wait = 0.8;
  }

  function scrollTo(v, to, t = now, dur = 0.6) {
    v.anim = { from: v.top, to, t0: t, dur };
  }

  // ── the loop ────────────────────────────────────────────────────────

  let now = 0;
  function tick(t, dt) {
    now = t;
    for (const win of wins) {
      const v = win.view;
      if (v.anim) {
        const p = (t - v.anim.t0) / v.anim.dur;
        v.top = v.anim.from + (v.anim.to - v.anim.from) * ease(p);
        if (p >= 1) {
          v.top = v.anim.to;
          v.anim = null;
        }
        if (ghost.view !== v) keepPointInView(v);
        dirty = true;
      } else if (ghost.view !== v && t >= v.next) {
        scrollTo(v, Math.round(v.top) + (rand() < 0.15 ? 3 : 1), t);
        v.next = t + v.period * (0.8 + rand() * 0.4);
      }
    }
    if (ghost.view || ghost.queue.length) {
      ghost.wait -= dt;
      while (ghost.wait <= 0 && ghost.queue.length) {
        const a = ghost.queue.shift();
        a.fn();
        ghost.wait += a.delay;
        dirty = true;
      }
    } else {
      ghost.wait -= dt;
      if (ghost.wait <= -2) plan();
    }
    select();
    if (dirty) draw();
  }

  // ── the modeline ────────────────────────────────────────────────────

  function select() {
    const v = hover?.win.view ?? ghost.view ?? ghost.last ?? wins[Math.floor(wins.length / 2)]?.view;
    if (!v || hero.dataset.file === v.src.file) return;
    hero.dataset.file = v.src.file;
    if (current) setSegment("buf", v.src.file);
  }

  // ── pointer ─────────────────────────────────────────────────────────

  function lineAt(e) {
    if (e.target.closest(".hero-id")) return null;
    const c = canvas.getBoundingClientRect();
    const x = e.clientX - c.left;
    const y = e.clientY - c.top;
    const win = wins.find((w) => x >= w.x && x < w.x + w.w);
    if (!win || y < bodyTop() || y > bodyBottom()) return null;
    const v = win.view;
    const first = Math.floor(v.top);
    const off = (v.top - first) * LH;
    const k = first + Math.floor((y - bodyTop() + off) / LH);
    const idx = mod(k, v.len + GAP);
    return idx < v.len ? { win, k, idx } : null;
  }

  function point(h) {
    if (h?.win === hover?.win && h?.k === hover?.k) return;
    hover = h;
    select();
    draw();
  }

  // Only a mouse points: on a phone the wall is just something to look at.
  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") point(lineAt(e));
  });
  hero.addEventListener("pointerleave", () => point(null));

  // ── start ───────────────────────────────────────────────────────────

  const ro = new ResizeObserver(() => {
    layout();
    select();
    draw();
  });
  ro.observe(canvas);
  ro.observe(id);
  on("theme", () => draw());

  // Under reduced motion the wall holds still, and pointing still works.
  if (!reducedMotion.matches) frameWhileVisible(canvas, tick);
}
