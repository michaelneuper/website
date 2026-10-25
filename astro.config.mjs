// @ts-check
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import katex from "katex";

// Renders $...$ and $$...$$ in posts with KaTeX at build time, so pages ship
// the maths as HTML and need no script for it.
const renderMath = {
  name: "katex",
  math(node, ctx) {
    ctx.replaceNode(node, { type: "html", value: katex.renderToString(node.value, { displayMode: true, throwOnError: false }) });
  },
  inlineMath(node, ctx) {
    ctx.replaceNode(node, { type: "html", value: katex.renderToString(node.value, { throwOnError: false }) });
  },
};

export default defineConfig({
  site: "https://michaelneuper.com",
  // The default ("jsx") drops line breaks between text and inline elements, which
  // glues words to links. true only removes whitespace that doesn't render.
  compressHTML: true,
  // Each page's CSS goes in its <head> instead of in files of its own, so the
  // first paint doesn't wait for a second round of requests after the HTML.
  build: { inlineStylesheets: "always" },
  // The toolbar would sit on top of the modeline and echo area.
  devToolbar: { enabled: false },
  markdown: {
    processor: satteri({ features: { math: true }, mdastPlugins: [renderMath] }),
    // Code takes its colours from the current Emacs theme (the --astro-code-* variables in src/styles/post/org.css).
    shikiConfig: { theme: "css-variables" },
  },
  // Minifying strips comments, but legal ones (//! or /*!) stay in the scripts,
  // for anyone reading them in the browser's devtools (src/scripts/ctf.js has one).
  vite: { build: { rolldownOptions: { output: { comments: { legal: true } } } } },
  // Pages from the Hugo site that now live on the home page.
  redirects: {
    "/posts": "/#posts",
    "/pages/contact": "/#contact",
  },
});
