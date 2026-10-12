// M-x coffee-refill: my GitHub bio, made to do something. A mug fills while
// VCC (the chip's coffee supply pin) climbs back to 5 V, then the 8-bit
// computer in Projects runs at four times its clock for 30 seconds.

import { $, emit, reducedMotion, isTyping } from "../util.js";
import { defcommand, message } from "../emacs/index.js";
import { showComputer } from "../demos/computer/commands.js";

const ROWS = 5;
const WIDTH = 10;
const V_LOW = 2.6;
const V_FULL = 5.0;
const BOOST = { factor: 4, seconds: 30 };
const STEAM = [
  ["     (  )  (      ", "      )  (  )     "],
  ["      )  (  )     ", "     (  )  (      "],
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function mug(level, frame) {
  const filled = Math.round(level * ROWS);
  const row = (i) => {
    const fromBottom = ROWS - 1 - i;
    if (fromBottom >= filled) return " ".repeat(WIDTH);
    const top = fromBottom === filled - 1;
    return `<span class="${top ? "crema" : "brew"}">${(top ? "~" : "▒").repeat(WIDTH)}</span>`;
  };
  const steam = filled ? STEAM[frame % 2] : ["", ""];
  const handle = ["|--.", "|  |", "|  |", "|--'", "|   "];
  return [
    `<span class="steam">${esc(steam[0])}</span>`,
    `<span class="steam">${esc(steam[1])}</span>`,
    "  .----------.",
    ...Array.from({ length: ROWS }, (_, i) => `  |${row(i)}${handle[i]}`),
    "  '----------'",
  ].join("\n");
}

function cupsToday(increment = false) {
  const key = `coffee:${new Date().toISOString().slice(0, 10)}`;
  let n = 0;
  try {
    n = Number(localStorage.getItem(key)) || 0;
    if (increment) localStorage.setItem(key, String(++n));
  } catch {
    if (increment) n = 1;
  }
  return n;
}

export function initCoffee() {
  const panel = $(".coffee");
  if (!panel) return;
  const pre = $(".mug", panel);
  const bar = $(".vbar", panel);
  const volts = $(".volts", panel);
  const msg = $(".coffee-msg", panel);
  const links = $(".coffee-links", panel);
  const closeBtn = $(".coffee-close", panel);

  const watch = document.createElement("button");
  watch.type = "button";
  watch.className = "linkish";
  watch.textContent = "watch the computer";
  watch.hidden = true;
  watch.addEventListener("click", () => showComputer());
  links.append(" ", watch);

  let raf = 0;
  let steamTimer = 0;
  let returnFocus = null;

  const meter = (v, over = false) => {
    const cells = 12;
    const n = Math.max(0, Math.min(cells, Math.round(((v - V_LOW) / (V_FULL - V_LOW)) * cells)));
    bar.textContent = `▕${"█".repeat(n)}${"░".repeat(cells - n)}▏`;
    volts.textContent = `${v.toFixed(1)} V`;
    panel.classList.toggle("is-over", over);
  };

  function close() {
    if (panel.hidden) return;
    cancelAnimationFrame(raf);
    clearInterval(steamTimer);
    panel.hidden = true;
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
  }

  function refill() {
    cancelAnimationFrame(raf);
    clearInterval(steamTimer);
    returnFocus = document.activeElement;
    panel.hidden = false;
    watch.hidden = true;
    msg.textContent = "brewing…";
    closeBtn.focus({ preventScroll: true });

    const finish = () => {
      const n = cupsToday(true);
      let frame = 0;
      steamTimer = setInterval(() => { pre.innerHTML = mug(1, ++frame); }, 450);
      pre.innerHTML = mug(1, 0);
      if (n > 5) {
        meter(5.6, true);
        msg.textContent = `Cup ${n} today. Absolute maximum rating exceeded: stresses beyond it may cause permanent damage, so no overclock this time. Have some water.`;
        message("VCC above absolute maximum rating", "error");
        return;
      }
      meter(V_FULL);
      const note = n === 1 ? "VCC is back to 5.0 V."
        : n <= 3 ? `Cup ${n} today, within the typical range.`
          : n === 4 ? "Cup 4 today, above typical."
            : "Cup 5 today: that’s the absolute maximum rating.";
      msg.textContent = `${note} The 8-bit computer in Projects now runs at ${BOOST.factor}× clock for ${BOOST.seconds} seconds.`;
      watch.hidden = false;
      emit("caffeine", BOOST);
      message(`Refilled. VCC 5.0 V, ${BOOST.factor}× clock for ${BOOST.seconds}s`, "ok");
    };

    if (reducedMotion.matches) return finish();
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 2400);
      const e = 1 - Math.pow(1 - t, 2);
      pre.innerHTML = mug(e, Math.floor(now / 450));
      meter(V_LOW + (V_FULL - V_LOW) * e);
      if (t < 1) raf = requestAnimationFrame(step);
      else finish();
    };
    meter(V_LOW);
    raf = requestAnimationFrame(step);
  }

  closeBtn.addEventListener("click", close);
  addEventListener("keydown", (e) => {
    if (panel.hidden || e.metaKey || e.altKey || isTyping(e)) return;
    if (e.key === "q" || e.key === "Escape" || (e.ctrlKey && e.key === "g")) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }, true);

  defcommand("coffee-refill", refill, { doc: "Top up VCC and overclock the computer for a while", key: "SPC r" });
  pre.innerHTML = mug(0, 0);
  meter(V_LOW);
}
