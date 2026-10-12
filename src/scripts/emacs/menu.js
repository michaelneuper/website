// The top line's menu button, which shows the section links on narrow screens.

import { $ } from "../util.js";

const nav = $(".nav");
const menuKey = $(".menu-key");

export const menuOpen = () => nav.classList.contains("is-open");

export function toggleMenu(open = !nav.classList.contains("is-open")) {
  nav.classList.toggle("is-open", open);
  menuKey.setAttribute("aria-expanded", String(open));
}
menuKey.addEventListener("click", () => toggleMenu());
nav.addEventListener("click", (e) => { if (e.target.closest("a")) toggleMenu(false); });
document.addEventListener("click", (e) => {
  if (nav.classList.contains("is-open") && !e.target.closest(".nav, .menu-key")) toggleMenu(false);
});
