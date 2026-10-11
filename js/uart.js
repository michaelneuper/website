// Draws the email address as a UART capture: 115200 baud, 8N1. Each byte is a
// low start bit, eight data bits least-significant first, and a high stop bit,
// with the decoded character above it the way a logic analyser shows it.

import { $, $$, hex, reducedMotion } from "./util.js";
import { message } from "./shell.js";

const SVG = "http://www.w3.org/2000/svg";
const BIT_US = 1e6 / 115200;
const IDLE = 3;

function el(name, attrs = {}, parent) {
  const n = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.append(n);
  return n;
}

export function initUart() {
  const sec = $("#contact");
  if (!sec) return;
  const mail = $(".mail", sec);
  const svg = $(".uart-svg", sec);
  const scroller = $(".uart-scroll", sec);
  const info = $(".uart-frame", sec);
  // The page only shows "michael <at> michaelneuper.com"; the address is put
  // together here so a scraper reading the HTML never sees it whole.
  const address = `${mail.dataset.user}@${mail.dataset.host}`;
  const arm = () => { mail.href = `mailto:${address}`; };
  for (const ev of ["pointerenter", "focus", "touchstart"]) mail.addEventListener(ev, arm, { passive: true });
  mail.addEventListener("click", arm);

  const copy = $('[data-email="copy"]', sec);
  copy?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(address);
      copy.textContent = "copied";
      message(`Copied ${address}`, "ok", 3000);
    } catch {
      message(address, "", 8000);
      copy.textContent = "shown below";
    }
    setTimeout(() => { copy.textContent = "copy address"; }, 2000);
  });
  const bytes = [...new TextEncoder().encode(address)];
  const total = IDLE * 2 + bytes.length * 10;
  let drawn = false;

  function render() {
    const avail = scroller.clientWidth;
    const bw = Math.max(3.6, (avail - 24) / total);
    const W = Math.round(bw * total + 24);
    const H = 132;
    const x0 = 12;
    const hi = 62;
    const lo = 96;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.replaceChildren();

    // frames: hover areas, decoder bubbles, labels
    const framesG = el("g", {}, svg);
    bytes.forEach((b, i) => {
      const fx = x0 + (IDLE + i * 10) * bw;
      const fw = 10 * bw;
      const g = el("g", { class: "frame" }, framesG);
      el("rect", { x: fx, y: 0, width: fw, height: H }, g);
      el("rect", { class: "bubble", x: fx + 1.5, y: 10, width: fw - 3, height: fw > 34 ? 34 : 22, rx: 3 }, g);
      const ch = String.fromCharCode(b);
      const t = el("text", { class: "lbl", x: fx + fw / 2, y: 26, "text-anchor": "middle" }, g);
      t.textContent = ch;
      if (fw > 34) {
        const s = el("text", { class: "sub", x: fx + fw / 2, y: 39, "text-anchor": "middle" }, g);
        s.textContent = hex(b);
      }
      g.addEventListener("pointerenter", () => hot(g, i, b));
    });

    // bit-boundary ticks and a time axis every few frames
    const ticks = el("g", {}, svg);
    for (let k = 0; k <= total; k++) {
      const x = Math.round(x0 + k * bw) + 0.5;
      const frameEdge = k >= IDLE && (k - IDLE) % 10 === 0 && k <= total - IDLE;
      el("line", { class: "tick", x1: x, x2: x, y1: lo + 6, y2: lo + (frameEdge ? 14 : 9) }, ticks);
    }
    const every = Math.max(1, Math.ceil(70 / (10 * bw)));
    for (let i = 0; i <= bytes.length; i += every) {
      const k = IDLE + i * 10;
      const t = el("text", { class: "sub", x: x0 + k * bw, y: H - 6, "text-anchor": i ? "middle" : "start" }, svg);
      t.textContent = `${Math.round(i * 10 * BIT_US)} µs`;
    }

    // the logic trace
    const levels = [];
    for (let k = 0; k < IDLE; k++) levels.push(1);
    for (const b of bytes) {
      levels.push(0);
      for (let i = 0; i < 8; i++) levels.push((b >> i) & 1);
      levels.push(1);
    }
    for (let k = 0; k < IDLE; k++) levels.push(1);
    let d = `M${x0} ${hi}`;
    let prev = 1;
    levels.forEach((v, k) => {
      if (v !== prev) d += `V${v ? hi : lo}`;
      d += `H${x0 + (k + 1) * bw}`;
      prev = v;
    });
    const path = el("path", { class: "trace", d }, svg);

    if (!drawn && !reducedMotion.matches) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      framesG.style.opacity = 0;
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1600, easing: "cubic-bezier(.3,0,.2,1)", fill: "forwards" })
          .finished.then(() => { path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; }).catch(() => {});
        framesG.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 1100, fill: "forwards" })
          .finished.then(() => { framesG.style.opacity = ""; }).catch(() => {});
      }, { threshold: 0.6 });
      io.observe(scroller);
    }
    drawn = true;
  }

  function hot(g, i, b) {
    $$(".frame.is-hot", svg).forEach((f) => f.classList.remove("is-hot"));
    g.classList.add("is-hot");
    const bits = Array.from({ length: 8 }, (_, k) => (b >> k) & 1).join("");
    info.textContent = `frame ${String(i + 1).padStart(2, "0")} of ${bytes.length}   0x${hex(b)} '${String.fromCharCode(b)}'   start 0   data ${bits.slice(0, 4)} ${bits.slice(4)} (LSB first)   stop 1`;
  }
  svg.addEventListener("pointerleave", () => $$(".frame.is-hot", svg).forEach((f) => f.classList.remove("is-hot")));

  render();
  let w = scroller.clientWidth;
  new ResizeObserver(() => {
    if (scroller.clientWidth !== w) {
      w = scroller.clientWidth;
      render();
    }
  }).observe(scroller);
}
