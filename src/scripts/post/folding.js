// Org folding for a post. Each heading owns what follows it, up to the next
// heading at its level or above. Clicking its stars folds that away. With the
// stars focused, TAB does the same and S-TAB cycles the whole buffer
// (overview, contents, show all), as in the posts list on the home page.
// Folding toggles a class rather than moving anything, so videos keep playing.

import { $, $$ } from "../util.js";
import { defcommand, message } from "../emacs/index.js";

/** The post's headings that imenu and the *Ilist* window list. */
export const headings = () => $$(".post-body :is(h2, h3)[id]:not(.sr-only)");
const titles = new Map();
/** A heading's text without the stars and ellipsis added here. */
export const titleOf = (h) => titles.get(h) ?? h.textContent.trim();

const outline = []; // { h, level, folded, owners, stars, ell, hasContent }
const owned = []; // [element, owners] for everything under a heading
const nodeOf = new Map();
let contentsOnly = false;

export function initFolding() {
  const body = $(".post-body");
  if (!body) return;
  for (const h of headings()) titles.set(h, h.textContent.trim());
  const levelOf = (el) => (/^H[234]$/.test(el.tagName) && !el.classList.contains("sr-only") ? +el.tagName[1] - 1 : 0);
  const open = []; // the headings we're inside, outermost first
  for (const el of body.children) {
    if (el.matches(".footnotes")) break;
    const level = levelOf(el);
    if (!level) {
      owned.push([el, [...open]]);
      if (open.length) open.at(-1).hasContent = true;
      continue;
    }
    while (open.length && open.at(-1).level >= level) open.pop();
    const node = { h: el, level, folded: false, owners: [...open], hasContent: false };
    node.stars = Object.assign(document.createElement("button"), { type: "button", className: "org-stars", tabIndex: -1, textContent: "*".repeat(level) });
    node.stars.setAttribute("aria-label", "Fold or unfold");
    node.ell = Object.assign(document.createElement("span"), { className: "org-ellipsis", textContent: "...", hidden: true });
    node.ell.setAttribute("aria-hidden", "true");
    el.prepend(node.stars);
    el.append(node.ell);
    el.classList.add("has-stars");
    node.stars.addEventListener("click", () => {
      toggle(node);
      node.stars.focus({ preventScroll: true });
    });
    node.stars.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      if (e.shiftKey) cycle();
      else toggle(node);
    });
    outline.push(node);
    nodeOf.set(el, node);
    open.push(node);
  }

  if (!outline.length) return;
  defcommand("org-shifttab", cycle, { doc: "Cycle the whole post: overview, contents, show all" });
  // S-TAB with nothing focused cycles too, like in the home page's Org buffer.
  addEventListener("keydown", (e) => {
    if (e.key === "Tab" && e.shiftKey && document.activeElement === document.body) {
      e.preventDefault();
      cycle();
    }
  });
}

function update() {
  const away = (owners) => owners.some((o) => o.folded);
  for (const n of outline) {
    n.h.classList.toggle("is-folded-away", away(n.owners));
    n.stars.setAttribute("aria-expanded", String(!n.folded));
    n.ell.hidden = !(n.folded || (contentsOnly && n.hasContent));
  }
  for (const [el, owners] of owned) {
    el.classList.toggle("is-folded-away", away(owners) || (contentsOnly && owners.length > 0));
  }
}

function toggle(node) {
  if (contentsOnly) {
    // Leaving the contents view: keep only the path to this heading open.
    contentsOnly = false;
    const path = new Set([node, ...node.owners]);
    for (const n of outline) n.folded = !path.has(n);
    node.folded = false;
  } else {
    node.folded = !node.folded;
  }
  update();
}

const STATES = ["OVERVIEW", "CONTENTS", "SHOW ALL"];
let state = 2;
function cycle() {
  state = (state + 1) % 3;
  contentsOnly = state === 1;
  for (const n of outline) n.folded = state === 0 && n.level === 1;
  update();
  message(STATES[state]);
}

/** Unfolds whatever hides a heading, before jumping to it. */
export function reveal(h) {
  const node = nodeOf.get(h);
  if (!node) return;
  contentsOnly = false;
  for (const o of node.owners) o.folded = false;
  update();
}
