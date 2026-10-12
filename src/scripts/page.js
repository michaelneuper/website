// Pages other than the home page get the same Emacs (modeline, M-x, themes,
// which-key), plus, on posts: imenu over the headings, the *Ilist* window
// following along, and the giscus comments the old site had.

import { $, $$, on, themeColors, reducedMotion } from "./util.js";
import { defcommand, completingRead } from "./shell.js";
import { initCtf } from "./ctf.js";

// SPC a, p, n and m still go to the home page's sections.
for (const id of ["top", "about", "projects", "posts", "contact"]) {
  defcommand(`goto-${id}`, () => location.assign(`/#${id}`), { hidden: true });
}

try { initCtf(); } catch (err) { console.error(err); }

// ── imenu ─────────────────────────────────────────────────────────────

const heads = $$(".post-body :is(h2, h3)[id]:not(.sr-only)");
if (heads.length) {
  defcommand("imenu", async () => {
    const text = (h) => h.textContent.trim();
    const pick = await completingRead("imenu: ", heads.map((h) => ({ value: text(h), ann: h.tagName === "H3" ? "subsection" : "" })));
    const h = heads.find((x) => text(x) === pick);
    if (!h) return;
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
}

// ── comments ──────────────────────────────────────────────────────────
// Threads are GitHub Discussions matched by path, so the old site's comments
// still show up. The script only loads once you scroll near the comments.

const GISCUS_THEMES = {
  "doom-gruvbox": "gruvbox_dark",
  "doom-gruvbox-light": "gruvbox_light",
  catppuccin: "catppuccin_mocha",
};
const giscusTheme = () => GISCUS_THEMES[document.documentElement.dataset.theme]
  ?? (themeColors().light ? "noborder_light" : "transparent_dark");

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
