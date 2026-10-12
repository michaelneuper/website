// Renders the posts section as an Org buffer: keywords, a paragraph, years as
// "*" headings and posts as "**" headings with tags and a property drawer.
// TAB folds the heading at point; S-TAB cycles OVERVIEW, CONTENTS and SHOW ALL.

import { $, $$ } from "../util.js";
import { message } from "../emacs/index.js";
import { TAG_COLORS } from "../tags.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function initPosts() {
  const sec = $("#posts");
  const src = sec && $(".posts", sec);
  if (!src) return;
  const intro = $(".org-p", sec);

  const posts = $$("li", src).map((li) => {
    const a = $("a", li);
    return { date: li.dataset.date, tags: (li.dataset.tags || "").split(/\s+/).filter(Boolean), title: a.textContent.trim(), href: a.href };
  });
  const years = [...new Set(posts.map((p) => p.date.slice(0, 4)))].sort().reverse();

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  const org = el("div", "org");
  const kw = (key, value, cls) => {
    const p = el("p", "org-kw");
    const k = el("span", "org-key", `#+${key}: `);
    p.append(k, el("span", cls, value));
    return p;
  };
  org.append(kw("title", "Posts", "org-title"), kw("author", "Michael Neuper", "v"), kw("startup", "content", "v"));
  if (intro) org.append(intro);

  const tree = el("ul", "org-tree");
  tree.setAttribute("role", "tree");
  tree.setAttribute("aria-label", "Posts by year");
  const headings = [];

  function heading(li, level) {
    const h = el("div", "org-h");
    h.tabIndex = headings.length === 0 ? 0 : -1;
    const stars = el("button", "org-stars", "*".repeat(level));
    stars.type = "button";
    stars.tabIndex = -1;
    stars.setAttribute("aria-label", "Fold or unfold");
    stars.addEventListener("click", () => { li._fold(!li._open()); h.focus({ preventScroll: true }); });
    h.append(stars);
    li.prepend(h);
    headings.push(h);
    return h;
  }

  for (const y of years) {
    const items = posts.filter((p) => p.date.startsWith(y));
    const li = el("li", "org-h1");
    li.setAttribute("role", "treeitem");
    const h = heading(li, 1);
    h.append(el("span", "org-text", y), el("span", "count", `[${items.length}]`));
    const ell = el("span", "org-ellipsis", "...");
    h.append(ell);

    const kids = el("ul", "org-tree");
    kids.setAttribute("role", "group");
    for (const p of items) {
      const pl = el("li", "org-h2");
      pl.setAttribute("role", "treeitem");
      const ph = heading(pl, 2);
      const a = el("a", "org-text", p.title);
      a.href = p.href;
      a.tabIndex = -1;
      ph.append(a);
      if (p.tags.length) {
        const tags = el("span", "org-tags");
        tags.append(":");
        for (const t of p.tags) {
          const tg = el("span", "t", t);
          tg.style.setProperty("--tag", TAG_COLORS[t] ?? "var(--dim)");
          tags.append(tg, ":");
        }
        ph.append(tags);
      }
      const pell = el("span", "org-ellipsis", "...");
      ph.append(pell);

      const d = new Date(`${p.date}T12:00:00Z`);
      const drawer = el("div", "org-drawer");
      drawer.innerHTML = `<span class="k">:PROPERTIES:</span>\n<span class="k">:DATE:</span>     <span class="ts">&lt;${p.date} ${DAYS[d.getUTCDay()]}&gt;</span>\n<span class="k">:URL:</span>      <a href="${p.href}" tabindex="-1">${p.href.replace(/^https?:\/\//, "")}</a>\n<span class="k">:END:</span>`;
      pl.append(drawer);
      pl._fold = (open) => {
        drawer.hidden = !open;
        pell.hidden = open;
        pl.setAttribute("aria-expanded", String(open));
      };
      pl._open = () => !drawer.hidden;
      pl._fold(false);
      kids.append(pl);
    }
    li.append(kids);
    li._fold = (open) => {
      kids.hidden = !open;
      ell.hidden = open;
      li.setAttribute("aria-expanded", String(open));
    };
    li._open = () => !kids.hidden;
    li._fold(true);
    tree.append(li);
  }
  org.append(tree);
  src.replaceWith(org);

  const meta = $('[data-org="meta"]', sec);
  if (meta) meta.textContent = `${posts.length} posts`;

  // Global visibility cycling, like S-TAB in Org.
  const STATES = ["OVERVIEW", "CONTENTS", "SHOW ALL"];
  let global = 1;
  function globalCycle() {
    global = (global + 1) % 3;
    for (const y of $$(".org-h1", tree)) {
      y._fold(global > 0);
      for (const p of $$(".org-h2", y)) p._fold(global === 2);
    }
    message(STATES[global]);
  }

  const visible = () => headings.filter((h) => h.offsetParent !== null);
  tree.addEventListener("keydown", (e) => {
    const h = e.target.closest(".org-h");
    if (!h) return;
    const li = h.parentElement;
    const vis = visible();
    const i = vis.indexOf(h);
    const move = (j) => {
      const t = vis[Math.max(0, Math.min(vis.length - 1, j))];
      for (const x of headings) x.tabIndex = -1;
      t.tabIndex = 0;
      t.focus();
    };
    if (e.key === "Tab" && e.shiftKey) { e.preventDefault(); globalCycle(); }
    else if (e.key === "Tab") { e.preventDefault(); li._fold(!li._open()); }
    else if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); move(i + 1); }
    else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); move(i - 1); }
    else if (e.key === "Enter") {
      const a = h.querySelector("a");
      if (a) a.click();
      else li._fold(!li._open());
    }
  });
}
