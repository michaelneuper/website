// Pages other than the home page get the same Emacs (modeline, M-x, themes,
// which-key), plus, on posts: Org folding, imenu over the headings, the
// *Ilist* window following along, and the giscus comments the old site had.

import { $, $$, on, themeColors, reducedMotion } from "./util.js";
import { defcommand, completingRead, message } from "./shell.js";
import { initCtf } from "./ctf.js";
import { DEFAULT_THEME } from "./themes.js";

// SPC a, p, n and m still go to the home page's sections.
for (const id of ["top", "about", "projects", "posts", "contact"]) {
  defcommand(`goto-${id}`, () => location.assign(`/#${id}`), { hidden: true });
}

try { initCtf(); } catch (err) { console.error(err); }

const body = $(".post-body");
const heads = $$(".post-body :is(h2, h3)[id]:not(.sr-only)");
const titles = new Map(heads.map((h) => [h, h.textContent.trim()]));

// ── folding, like Org ─────────────────────────────────────────────────
// Each heading owns what follows it, up to the next heading at its level or
// above. Clicking its stars folds that away. With the stars focused, TAB does
// the same and S-TAB cycles the whole buffer (overview, contents, show all),
// as in the posts list on the home page. Folding toggles a class rather than
// moving anything, so the videos keep playing.

const outline = []; // { h, level, folded, owners, stars, ell, hasContent }
const owned = []; // [element, owners] for everything under a heading
const nodeOf = new Map();
let contentsOnly = false;

if (body) {
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

// Unfold whatever hides a heading, before jumping to it.
function reveal(h) {
  const node = nodeOf.get(h);
  if (!node) return;
  contentsOnly = false;
  for (const o of node.owners) o.folded = false;
  update();
}

if (outline.length) {
  defcommand("org-shifttab", cycle, { doc: "Cycle the whole post: overview, contents, show all" });
  // S-TAB with nothing focused cycles too, like in the home page's Org buffer.
  addEventListener("keydown", (e) => {
    if (e.key === "Tab" && e.shiftKey && document.activeElement === document.body) {
      e.preventDefault();
      cycle();
    }
  });
}

// ── imenu ─────────────────────────────────────────────────────────────

if (heads.length) {
  defcommand("imenu", async () => {
    const pick = await completingRead("imenu: ", heads.map((h) => ({ value: titles.get(h), ann: h.tagName === "H3" ? "subsection" : "" })));
    const h = heads.find((x) => titles.get(x) === pick);
    if (!h) return;
    reveal(h);
    h.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${h.id}`);
  }, { doc: "Jump to a heading in this post", key: "SPC i" });
}

// The *Ilist* window marks the heading you're reading: the last one above a
// line 30% down the screen. A long list scrolls to keep that entry in view.
const toc = $(".post-toc");
const tocLinks = toc ? $$("a", toc) : [];
if (tocLinks.length) {
  let raf = 0;
  const mark = () => {
    raf = 0;
    const line = innerHeight * 0.3;
    let cur = null;
    for (const h of heads) {
      if (h.offsetParent === null) continue; // folded away
      if (h.getBoundingClientRect().top > line) break;
      cur = h;
    }
    for (const a of tocLinks) {
      const on = !!cur && a.hash === `#${cur.id}`;
      if (on && a.getAttribute("aria-current") !== "true" && toc.scrollHeight > toc.clientHeight) {
        const y = a.offsetTop - toc.scrollTop;
        if (y < 40 || y > toc.clientHeight - 40) toc.scrollTop = a.offsetTop - toc.clientHeight / 2;
      }
      a.setAttribute("aria-current", String(on));
    }
  };
  addEventListener("scroll", () => { raf ||= requestAnimationFrame(mark); }, { passive: true });
  mark();
  for (const a of tocLinks) {
    a.addEventListener("click", () => reveal(document.getElementById(decodeURIComponent(a.hash.slice(1)))));
  }
}

// ── comments ──────────────────────────────────────────────────────────
// Threads are GitHub Discussions matched by path, so the old site's comments
// still show up. The script only loads once you scroll near the comments.

// The comments use a stylesheet made from the current theme's colours
// (src/pages/giscus/[theme].css.js). giscus fetches it from its own origin,
// which only the deployed site allows, so the dev server uses a built-in look.
const giscusTheme = () => {
  const id = document.documentElement.dataset.theme || DEFAULT_THEME;
  if (!import.meta.env.DEV) return `${location.origin}/giscus/${id}.css`;
  return themeColors().light ? "noborder_light" : "transparent_dark";
};

const box = $(".giscus");
if (box) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    Object.assign(s.dataset, {
      repo: "michaelneuper/website",
      repoId: "R_kgDOIjPNaQ",
      category: "General",
      categoryId: "DIC_kwDOIjPNac4CaklA",
      mapping: "pathname",
      strict: "0",
      reactionsEnabled: "1",
      emitMetadata: "0",
      inputPosition: "top",
      theme: giscusTheme(),
      lang: "en",
      loading: "lazy",
    });
    box.append(s);
  }, { rootMargin: "600px" });
  io.observe(box);

  on("theme", () => {
    $("iframe.giscus-frame", box)?.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusTheme() } } }, "https://giscus.app");
  });
}
