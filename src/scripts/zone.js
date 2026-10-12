// M-x zone, after Emacs's zone.el: the reward for finding all three flags.
// Every character on screen comes loose and drips off the bottom while its
// bits flip, then they all fly back and correct themselves as they land, the
// way the name decodes on load. Any key, tap or scroll brings them back early.
//
// The page is copied onto a canvas one character at a time (text only: the
// chip and the demos fade out under it), so nothing in the page itself moves.

import { $, reducedMotion, onFrame } from "./util.js";
import { message, setSegment } from "./emacs/index.js";
import "../styles/zone.css";

const rand = (n) => Math.floor(Math.random() * n);
const printable = (v) => v >= 0x21 && v < 0x7f;
const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const MAX_CHARS = 4000;

// every visible character in <main>, with where it sits and how it's drawn
function collect() {
  const W = innerWidth, H = innerHeight;
  const chars = [];
  const styles = new Map();
  const range = document.createRange();
  const walker = document.createTreeWalker($("main"), NodeFilter.SHOW_TEXT);
  for (let node; (node = walker.nextNode()) && chars.length < MAX_CHARS;) {
    const text = node.data;
    if (!text.trim()) continue;
    const el = node.parentElement;
    if (!el || el.closest("script, style, noscript, [hidden], .sr-only, [aria-hidden='true'] svg")) continue;
    range.selectNodeContents(node);
    const box = range.getBoundingClientRect();
    if (box.bottom < 0 || box.top > H || box.right < 0 || box.left > W || !box.width) continue;
    let st = styles.get(el);
    if (!st) {
      const cs = getComputedStyle(el);
      if (cs.visibility !== "visible" || +cs.opacity === 0) continue;
      st = { font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, color: cs.color };
      styles.set(el, st);
    }
    for (let i = 0; i < text.length && chars.length < MAX_CHARS; i++) {
      const ch = text[i];
      if (/\s/.test(ch)) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getClientRects()[0];
      if (!r || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue;
      chars.push({ ch, code: ch.charCodeAt(0), x: r.left, top: r.top, ...st });
    }
  }
  return chars;
}

// a byte with k bits flipped, and the bytes on the way back, all printable
function corrupt(code, k) {
  if (!printable(code)) return [code];
  for (let tries = 0; tries < 30; tries++) {
    let v = code;
    const order = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5).slice(0, k);
    for (const b of order) v ^= 1 << b;
    const path = [v];
    for (const b of order) path.push((v ^= 1 << b));
    if (path.every(printable)) return path;
  }
  return [code];
}

let running = false;

export function zone({ done = "" } = {}) {
  if (running) return;
  if (reducedMotion.matches) {
    if (done) message(done, "ok", 6000);
    return;
  }
  running = true;
  const chars = collect();
  const W = innerWidth, H = innerHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const cv = document.createElement("canvas");
  cv.className = "zone";
  cv.setAttribute("aria-hidden", "true");
  cv.width = W * dpr;
  cv.height = H * dpr;
  document.body.append(cv);
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#000";

  // the baseline of each font, from the top of a character's box
  const ascent = new Map();
  for (const c of chars) {
    if (!ascent.has(c.font)) {
      ctx.font = c.font;
      const m = ctx.measureText("Hg");
      ascent.set(c.font, m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent);
    }
    c.y0 = c.top + ascent.get(c.font);
    c.y = c.y0;
    c.cx = c.x;
    c.vy = 0;
    c.g = 1500 + Math.random() * 1500;
    c.delay = 0.25 + Math.random() * 1.2;
    c.flipAt = c.delay + Math.random() * 0.2;
    c.shown = c.code;
  }
  // drawn a font at a time, so the canvas switches fonts as little as possible
  chars.sort((a, b) => (a.font < b.font ? -1 : a.font > b.font ? 1 : 0));

  const mode = $(".ml-mode")?.textContent ?? "";
  setSegment("mode", "Zone");

  // input during the drip brings everything back; the page doesn't scroll meanwhile
  const block = (e) => e.preventDefault();
  const early = () => { if (phase === "drip" || phase === "hold") back(); };
  const opts = { capture: true, passive: false };
  addEventListener("wheel", block, opts);
  addEventListener("touchmove", block, opts);
  for (const t of ["keydown", "pointerdown", "wheel", "touchstart"]) addEventListener(t, early, { capture: true });
  const keys = (e) => { if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) e.preventDefault(); };
  addEventListener("keydown", keys, true);

  let phase = "drip";
  let t = 0;
  let tBack = 0;
  let fade = 0; // how much of the page is covered: 0 to 1

  function back() {
    phase = "back";
    tBack = t;
    for (const c of chars) {
      c.fromX = c.cx;
      // the ones that fell off the bottom come back up from below it
      c.fromY = c.y > H + 30 ? H + 40 + Math.random() * 240 : c.y;
      c.backDelay = Math.random() * 0.45;
      c.path = corrupt(c.code, 2 + rand(2));
    }
    if (done) message(done, "ok", 6000);
  }

  const stop = onFrame((_, dt) => {
    t += dt;
    if (phase === "drip") {
      fade = Math.min(1, t / 0.2);
      let left = 0;
      for (const c of chars) {
        if (t < c.delay) { left++; continue; }
        c.vy += c.g * dt;
        c.y += c.vy * dt;
        if (t >= c.flipAt && printable(c.shown)) {
          const v = c.shown ^ (1 << rand(5));
          if (printable(v)) c.shown = v;
          c.flipAt = t + 0.06 + Math.random() * 0.16;
        }
        if (c.y < H + 30) left++;
      }
      if (!left || t > 3.4) { phase = "hold"; tBack = t; }
    } else if (phase === "hold") {
      if (t - tBack > 0.35) back();
    } else if (phase === "back") {
      const s = t - tBack;
      let moving = 0;
      for (const c of chars) {
        const p = ease((s - c.backDelay) / 0.9);
        c.cx = c.fromX + (c.x - c.fromX) * p;
        c.y = c.fromY + (c.y0 - c.fromY) * p;
        c.shown = c.path[Math.min(c.path.length - 1, Math.floor(p * c.path.length))];
        if (p < 1) moving++;
      }
      if (!moving) { phase = "out"; tBack = t; }
    } else if (phase === "out") {
      fade = 1 - Math.min(1, (t - tBack) / 0.25);
      if (fade <= 0) {
        finish();
        return;
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = fade;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    let font = "";
    for (const c of chars) {
      if (c.y > H + 60 || c.y < -60) continue;
      if (c.font !== font) ctx.font = font = c.font;
      ctx.fillStyle = c.color;
      ctx.fillText(c.shown === c.code ? c.ch : String.fromCharCode(c.shown), c.cx, c.y);
    }
  });

  function finish() {
    stop();
    cv.remove();
    removeEventListener("wheel", block, opts);
    removeEventListener("touchmove", block, opts);
    for (const tt of ["keydown", "pointerdown", "wheel", "touchstart"]) removeEventListener(tt, early, { capture: true });
    removeEventListener("keydown", keys, true);
    setSegment("mode", mode);
    running = false;
  }
}
