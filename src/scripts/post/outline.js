// The *Ilist* window beside a post marks the heading you're reading: the last
// one above a line 30% down the screen. A long list scrolls to keep that entry
// in view, and following a link opens the heading if it's folded.

import { $, $$ } from "../util.js";
import { headings, reveal } from "./folding.js";

export function initOutline() {
  const toc = $(".post-toc");
  const tocLinks = toc ? $$("a", toc) : [];
  if (!tocLinks.length) return;
  const heads = headings();
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
