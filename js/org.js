// Renders the posts list as an Org buffer: years as top-level headings, posts
// under them with tags and a property drawer. TAB folds the heading at point,
// S-TAB cycles the whole buffer through OVERVIEW, CONTENTS and SHOW ALL.

import { $, $$ } from "./util.js";
import { message } from "./shell.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function initOrg() {
  const sec = $("#posts");
  const src = sec && $(".posts", sec);
  if (!src) return;

  const posts = $$("li", src).map((li) => {
    const a = $("a", li);
    return { date: li.dataset.date, tags: (li.dataset.tags || "").split(/\s+/).filter(Boolean), cat: li.dataset.cat, title: a.textContent.trim(), href: a.href };
  });
  const years = [...new Set(posts.map((p) => p.date.slice(0, 4)))].sort().reverse();

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  const org = el("div", "org");
  const kw = (k, v, cls = "v") => {
    const p = el("p", "org-kw", `#+${k}: `);
    p.append(el("span", cls, v));
    return p;
  };
  org.append(kw("title", "Posts", "title"), kw("author", "Michael Neuper"), kw("startup", "content"));

  const tree = el("ul", "org-tree");
  tree.setAttribute("role", "tree");
  tree.setAttribute("aria-label", "Posts by year");
  const headings = [];

  for (const y of years) {
    const items = posts.filter((p) => p.date.startsWith(y));
    const li = el("li", "org-h1");
    li.setAttribute("role", "treeitem");
    const h = heading(li, 1);
    h.append(el("span", "", y), el("span", "count", `[${items.length}]`));
    const ell = el("span", "org-ellipsis", "…");
    ell.hidden = true;
    h.append(ell);
    const kids = el("ul", "org-tree");
    kids.setAttribute("role", "group");
    kids.style.margin = "0";
    for (const p of items) {
      const pl = el("li", "org-h2");
      pl.setAttribute("role", "treeitem");
      if (p.cat) pl.dataset.cat = p.cat;
      const ph = heading(pl, 2);
      const a = el("a", "", p.title);
      a.href = p.href;
      a.tabIndex = -1;
      ph.append(a);
      const tags = el("span", "org-tags");
      tags.append(":");
      for (const t of p.tags) tags.append(el("span", "t", t), ":");
      ph.append(tags);
      const pell = el("span", "org-ellipsis", "…");
      ph.append(pell);
      const d = new Date(`${p.date}T12:00:00Z`);
      const drawer = el("div", "org-drawer");
      drawer.innerHTML = `<span class="k">:PROPERTIES:</span>\n<span class="k">:DATE:</span>     <span class="ts">&lt;${p.date} ${DAYS[d.getUTCDay()]}&gt;</span>\n<span class="k">:URL:</span>      <a href="${p.href}" tabindex="-1">${p.href.replace(/^https?:\/\//, "")}</a>\n<span class="k">:END:</span>`;
      drawer.hidden = true;
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

  function heading(li, level) {
    const h = el("div", "org-h");
    h.tabIndex = headings.length === 0 ? 0 : -1;
    const bullet = el("button", "org-bullet", level === 1 ? "◉" : "○");
    bullet.type = "button";
    bullet.tabIndex = -1;
    bullet.setAttribute("aria-label", "Fold or unfold");
    bullet.addEventListener("click", () => { cycle(li); h.focus({ preventScroll: true }); });
    h.append(bullet);
    li.prepend(h);
    headings.push(h);
    return h;
  }

  function cycle(li) {
    li._fold(!li._open());
  }

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
    else if (e.key === "Tab") { e.preventDefault(); cycle(li); }
    else if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); move(i + 1); }
    else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); move(i - 1); }
    else if (e.key === "Enter") {
      const a = h.querySelector("a");
      if (a) a.click();
      else cycle(li);
    }
  });
}
