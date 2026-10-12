// The 404 page's status code in binary. On load the bits arrive with three or
// four flipped and are corrected one at a time, like the name on the home page,
// and the buffer's header line follows the code as it changes.

import { $, $$, reducedMotion } from "../util.js";
import { message } from "../emacs/index.js";

const rand = (n) => Math.floor(Math.random() * n);

export function initStatusBits() {
  const root = $(".sb");
  if (!root) return;
  const home = Number(root.dataset.code);
  const bits = $$(".sb-bit", root);
  const meta = $("#missing .winbar .meta");

  let code = home;
  function show(next) {
    for (const b of bits) {
      const was = (code & Number(b.dataset.w)) !== 0;
      const on = (next & Number(b.dataset.w)) !== 0;
      b.querySelector(".d").textContent = on ? "1" : "0";
      b.classList.toggle("is-on", on);
      if (was !== on) {
        // restart the flip
        b.classList.remove("is-flipping");
        void b.offsetWidth;
        b.classList.add("is-flipping");
      }
    }
    code = next;
    if (meta) meta.textContent = String(code).padStart(3, "0");
  }

  const html = document.documentElement;
  if (reducedMotion.matches || !html.classList.contains("sb-boot")) {
    html.classList.remove("sb-boot");
    return;
  }
  const order = bits.map((b) => Number(b.dataset.w)).sort(() => Math.random() - 0.5).slice(0, 3 + rand(2));
  show(order.reduce((c, w) => c ^ w, home));
  html.classList.remove("sb-boot");
  order.forEach((w, i) => setTimeout(() => {
    show(code ^ w);
    if (i === order.length - 1) message(`Corrected ${order.length} flipped bits.`, "ok", 4000);
  }, 200 + i * 130));
}
