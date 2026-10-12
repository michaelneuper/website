// Builds the DIP-16 pinout from the ordered list of pins in the HTML.
// Pins 1–8 run down the left side, 9–16 run back up the right.

import { $, $$ } from "../util.js";
import { call } from "../emacs/index.js";

export function initPinout() {
  const fig = $(".pinout");
  if (!fig) return;
  const pins = $$(".pin-list li", fig).map((li, i) => ({
    num: i + 1,
    name: li.dataset.name,
    type: li.dataset.type,
    ch: li.dataset.cat,
    text: li.textContent.trim(),
  }));
  const half = pins.length / 2;
  const readout = $(".pin-readout", fig);

  const chip = document.createElement("div");
  chip.className = "chip";
  const left = side("left");
  const right = side("right");
  const body = document.createElement("div");
  body.className = "chip-body";
  body.innerHTML = "<span>MN-2026</span>";
  chip.append(left, body, right);

  pins.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pin";
    if (p.ch) btn.dataset.cat = p.ch;
    btn.setAttribute("aria-label", `Pin ${p.num}, ${p.name}`);
    const parts = { name: p.name, num: p.num, leg: "" };
    const order = i < half ? ["name", "num", "leg"] : ["leg", "num", "name"];
    for (const k of order) {
      const s = document.createElement("span");
      s.className = k;
      s.textContent = parts[k];
      btn.append(s);
    }
    btn.addEventListener("pointerenter", () => show(p, btn));
    btn.addEventListener("focus", () => show(p, btn));
    btn.addEventListener("click", () => show(p, btn));
    if (i < half) left.append(btn);
    else right.prepend(btn);
  });

  $(".chip-wrap", fig).append(chip);
  fig.classList.add("is-built");

  function show(p, btn) {
    $$(".pin.is-active", chip).forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    if (p.ch) readout.dataset.cat = p.ch;
    else delete readout.dataset.cat;
    readout.innerHTML = "";
    const head = document.createElement("p");
    head.className = "pr-head";
    head.innerHTML = `<span class="dim">pin ${p.num}</span><span class="pr-name"></span><span class="dim"></span>`;
    head.children[1].textContent = p.name;
    head.children[2].textContent = p.type;
    // "M-x some-command" in a pin description becomes a button that runs it.
    const text = document.createElement("p");
    for (const part of p.text.split(/(M-x [\w-]+)/)) {
      if (!part.startsWith("M-x ")) {
        text.append(part);
        continue;
      }
      const b = document.createElement("button");
      b.type = "button";
      b.className = "linkish";
      b.textContent = part;
      b.addEventListener("click", () => call(part.slice(4)));
      text.append(b);
    }
    readout.append(head, text);
  }
}

function side(cls) {
  const d = document.createElement("div");
  d.className = `chip-side ${cls}`;
  return d;
}
