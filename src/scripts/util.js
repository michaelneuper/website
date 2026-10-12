// Small shared helpers: DOM, maths, theme colours, one animation loop, notes.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
export const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

// ── events ────────────────────────────────────────────────────────────
const bus = new EventTarget();
export const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
// Returns a function that stops listening.
export function on(type, fn) {
  const h = (e) => fn(e.detail);
  bus.addEventListener(type, h);
  return () => bus.removeEventListener(type, h);
}

// ── theme colours, for canvases ───────────────────────────────────────
let colors = null;
export function themeColors() {
  if (colors) return colors;
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  colors = {
    bg: v("--bg"), fg: v("--fg"), dim: v("--dim"), faint: v("--faint"), rule: v("--rule"), hl: v("--hl"),
    red: v("--red"), orange: v("--orange"), yellow: v("--yellow"), green: v("--green"),
    cyan: v("--cyan"), blue: v("--blue"), magenta: v("--magenta"),
    light: v("--glow") === "0",
  };
  return colors;
}
on("theme", () => { colors = null; });

// ── one requestAnimationFrame loop for everything ─────────────────────
const subs = new Set();
let raf = 0;
let last = 0;
function frame(now) {
  const t = now / 1000;
  const dt = last ? Math.min(0.1, t - last) : 1 / 60;
  last = t;
  for (const fn of subs) fn(t, dt);
  raf = subs.size ? requestAnimationFrame(frame) : 0;
  if (!raf) last = 0;
}
export function onFrame(fn) {
  subs.add(fn);
  if (!raf) raf = requestAnimationFrame(frame);
  return () => subs.delete(fn);
}

// Run fn(t, dt) every frame, but only while el is on screen. fn returns false
// when nothing is left to animate, which parks the loop until wake(). Returns
// { wake, stop }; stop() is for good, when el goes away.
export function frameWhileVisible(el, fn, margin = "80px") {
  let visible = false;
  let parked = false;
  let off = null;
  const sync = () => {
    const want = visible && !parked;
    if (want && !off) off = onFrame(tick);
    else if (!want && off) { off(); off = null; }
  };
  const tick = (t, dt) => {
    if (fn(t, dt) === false) { parked = true; sync(); }
  };
  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    sync();
  }, { rootMargin: margin });
  io.observe(el);
  return {
    wake() { parked = false; sync(); },
    stop() { io.disconnect(); visible = false; sync(); },
  };
}

// Size a canvas to its CSS box at device resolution. Returns true if it changed.
export function fitCanvas(canvas, maxDpr = 2) {
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width === pw && canvas.height === ph) return false;
  canvas.width = pw;
  canvas.height = ph;
  canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}

// Fit a canvas before its first paint and again whenever its CSS box changes,
// then call draw(w, h) with its CSS size, since resizing a canvas clears it.
// Returns a disposer.
export function fitCanvasOnResize(canvas, draw, maxDpr = 2) {
  const ro = new ResizeObserver(() => {
    fitCanvas(canvas, maxDpr);
    draw(canvas.clientWidth, canvas.clientHeight);
  });
  ro.observe(canvas);
  return () => ro.disconnect();
}

export async function fontsReady() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('12px "JetBrains Mono"'), document.fonts.load('40px "Computer Modern"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fall back to whatever is there */ }
}

export function isTyping(e) {
  const t = e.target;
  return t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.type !== "range");
}

export const hex = (n, w = 2) => n.toString(16).toUpperCase().padStart(w, "0");
