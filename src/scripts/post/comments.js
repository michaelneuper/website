// The comments under a post: GitHub Discussions through giscus, matched by
// path, so the old site's threads still show up. The script only loads once you
// scroll near the comments, and follows M-x load-theme.

import { $, on, themeColors } from "../util.js";
import { DEFAULT_THEME } from "../themes.js";

// The comments use a stylesheet made from the current theme's colours
// (src/pages/giscus/[theme].css.js). giscus loads it from inside its frame on
// giscus.app, and browsers don't let a public site reach a dev server on this
// machine. So in dev the stylesheets come from the deployed site, once it has
// them, and until then giscus keeps its own look.
let themes = location.origin;
const found = !import.meta.env.DEV
  ? Promise.resolve()
  : fetch(`${import.meta.env.SITE}/giscus/${DEFAULT_THEME}.css`, { method: "HEAD" })
      .then((r) => { themes = r.ok ? import.meta.env.SITE : null; })
      .catch(() => { themes = null; });

const giscusTheme = () => {
  const id = document.documentElement.dataset.theme || DEFAULT_THEME;
  if (themes) return `${themes}/giscus/${id}.css`;
  return themeColors().light ? "noborder_light" : "transparent_dark";
};

export function initComments() {
  const box = $(".giscus");
  if (!box) return;
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    await found;
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
