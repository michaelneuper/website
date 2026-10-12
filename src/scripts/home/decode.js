// The name arrives as bytes with a few bits flipped, so each letter starts out
// as some other character. The flipped bits are corrected one at a time, and
// every correction changes the letter to the character one bit closer, until
// it lands on the right one. The echo area shows the bytes while that happens.
//
// Afterwards, pointing at a letter flips a couple of its bits again, and
// M-x flip-bits replays the whole thing.

import { $, onFrame, reducedMotion } from "../util.js";
import { message, defcommand, goto } from "../emacs/index.js";

const rand = (n) => Math.floor(Math.random() * n);
const bin = (n) => n.toString(2).padStart(8, "0");

// Characters a letter may pass through: printable, and in the serif font
// (it has no backtick).
const printable = (v) => v >= 0x20 && v < 0x7f && v !== 0x60;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick k bits to flip and the order to correct them in, so that every byte on
// the way back is printable. Letters keep bit 6 (they stay in 0x40-0x7f) and
// the space keeps bits 5 and 6 (it stays in 0x20-0x3f).
function corrupt(code, k) {
  const pool = code === 0x20 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5];
  for (let tries = 0; tries < 50; tries++) {
    const order = shuffle([...pool]).slice(0, k);
    let v = order.reduce((x, b) => x ^ (1 << b), code);
    const path = [v];
    for (const b of order) path.push((v ^= 1 << b));
    if (path.every(printable)) return path; // path[0] corrupted ... path[k] === code
  }
  return [code];
}

function build(h1) {
  const text = h1.textContent.trim();
  h1.setAttribute("aria-label", text);
  h1.textContent = "";
  // Measure on one line, so the space between the words keeps its width.
  h1.style.whiteSpace = "nowrap";
  let word = null;
  const cells = [...text].map((ch) => {
    // Each word's letters sit in a span that doesn't wrap: the browser would
    // otherwise break the line between any two of them.
    if (!word) {
      word = document.createElement("span");
      word.className = "bc-word";
      h1.append(word);
    }
    const el = document.createElement("span");
    el.className = "bc";
    const glyph = document.createElement("span");
    glyph.className = "bc-ch";
    glyph.textContent = ch;
    el.append(glyph);
    word.append(el);
    if (ch === " ") word = null; // the line may break after the space
    return { el, glyph, code: ch.charCodeAt(0), path: [], busy: false };
  });
  // Fix each cell at its final letter's width, so the other characters a letter
  // passes through never push the rest of the name around.
  const fs = parseFloat(getComputedStyle(h1).fontSize);
  const widths = cells.map((c) => c.el.getBoundingClientRect().width);
  cells.forEach((c, i) => { c.el.style.width = `${(widths[i] / fs).toFixed(4)}em`; });
  h1.style.whiteSpace = "";
  h1.classList.add("is-cells");
  return cells;
}

function show(c, v) {
  c.glyph.textContent = String.fromCharCode(v);
  c.el.classList.toggle("is-wrong", v !== c.code);
}

// Step every cell along its path on its own schedule until all are correct.
// onStep runs after any change, for the echo area.
function run(cells, onStep) {
  const t0 = performance.now();
  return new Promise((resolve) => {
    const off = onFrame(() => {
      const t = performance.now() - t0;
      let changed = false;
      let left = 0;
      for (const c of cells) {
        while (c.plan.length && c.plan[0].t <= t) {
          show(c, c.plan.shift().v);
          changed = true;
        }
        left += c.plan.length;
      }
      if (changed) onStep?.();
      if (!left) {
        off();
        resolve();
      }
    });
  });
}

export async function initDecode() {
  const root = document.documentElement;
  const h1 = $(".hero-name");
  const reveal = () => root.classList.remove("boot");
  if (!h1 || reducedMotion.matches) return reveal();

  let cells;
  try {
    // The cells are measured in the serif, so wait for it (briefly).
    await Promise.race([document.fonts.load(`400 64px "Computer Modern"`, "Michael Neuper"), new Promise((r) => setTimeout(r, 1500))]);
    cells = build(h1);
  } catch (err) {
    console.error(err);
    return reveal();
  }
  // the byte each cell shows right now
  const current = (c) => c.glyph.textContent.charCodeAt(0);

  async function decode() {
    if (cells.some((c) => c.busy)) return;
    let flipped = 0;
    cells.forEach((c, j) => {
      c.busy = true;
      const path = corrupt(c.code, 3 + rand(3));
      flipped += path.length - 1;
      show(c, path[0]);
      let t = 150 + j * 55;
      c.plan = path.slice(1).map((v) => ({ v, t: (t += 70 + Math.random() * 50) }));
    });
    const echo = () => message(cells.map((c) => bin(current(c))).join(" "), "", 0);
    reveal();
    echo();
    await run(cells, echo);
    cells.forEach((c) => { c.busy = false; });
    message(`Corrected ${flipped} flipped bits in ${cells.length} bytes.`, "ok", 4000);
  }

  // Point at a letter to flip a couple of its bits.
  for (const c of cells) {
    if (c.code === 0x20) continue;
    c.el.addEventListener("pointerenter", () => {
      if (c.busy || reducedMotion.matches) return;
      c.busy = true;
      const path = corrupt(c.code, 2);
      show(c, path[0]);
      c.plan = path.slice(1).map((v, n) => ({ v, t: 110 + n * 90 }));
      run([c]).then(() => { c.busy = false; });
    });
  }

  defcommand("flip-bits", () => {
    goto("top", true);
    setTimeout(decode, 400);
  }, { doc: "Flip random bits in my name and watch them get corrected" });

  if (root.classList.contains("boot")) await decode();
  else reveal();
}
