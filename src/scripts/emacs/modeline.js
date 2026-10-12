// doom-modeline: evil state, buffer name, position, major mode and a clock.
// Other modules fill the misc and flags segments with setSegment().

import { $, isTyping, reducedMotion } from "../util.js";

const root = document.documentElement;
const modeline = $(".modeline");
const ml = {
  evil: $(".ml-evil"), buf: $(".ml-buf"), pos: $(".ml-pos"), pct: $(".ml-pct"),
  flags: $(".ml-flags"), misc: $(".ml-misc"), mode: $(".ml-mode"), time: $(".ml-time"),
};
const mini = $(".mini");

export function setSegment(name, text) {
  if (ml[name]) ml[name].textContent = text;
}

export function evilState() {
  const a = document.activeElement;
  let s = "N";
  if (!mini.hidden || (a && isTyping({ target: a }))) s = "I";
  else if (String(getSelection()).length) s = "V";
  modeline.dataset.evil = s;
  ml.evil.textContent = `<${s}>`;
}
document.addEventListener("focusin", evilState);
document.addEventListener("focusout", () => setTimeout(evilState));
document.addEventListener("selectionchange", evilState);

// back to top, once the reader is a screen down; gg does the same
const toTop = $(".to-top");
toTop.addEventListener("click", () => {
  scrollTo({ top: 0, behavior: reducedMotion.matches ? "instant" : "smooth" });
  // the button hides at the top, so focus goes to the first link on the page
  $(".brand")?.focus({ preventScroll: true });
});

function onScroll() {
  const max = root.scrollHeight - innerHeight;
  const y = scrollY;
  ml.pct.textContent = y <= 2 ? "Top" : y >= max - 2 ? "Bot" : `${Math.round((y / max) * 100)}%`;
  ml.pos.textContent = `${Math.floor(y / 21) + 1}:0`;
  root.classList.toggle("is-scrolled", y > 24);
  toTop.hidden = y < innerHeight;
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

function clock() {
  const d = new Date();
  ml.time.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
clock();
setInterval(clock, 15000);
