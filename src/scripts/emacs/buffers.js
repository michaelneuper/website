// Every <section> in <main> is a buffer: scrolling to one puts its file name
// and major mode in the modeline and marks its link in the top line. goto()
// jumps to one, and find-file picks one by name.

import { $, $$, emit, reducedMotion } from "../util.js";
import { message } from "./echo.js";
import { defcommand } from "./commands.js";
import { setSegment } from "./modeline.js";
import { completingRead } from "./minibuffer.js";

export const sections = $$("main > section");
const navLinks = $$(".nav a");
const sectionIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    setSegment("buf", e.target.dataset.file);
    setSegment("mode", e.target.dataset.mode);
    for (const a of navLinks) a.setAttribute("aria-current", String(a.hash === `#${e.target.id}`));
    emit("section", e.target.id);
  }
}, { rootMargin: "-40% 0px -55% 0px" });
sections.forEach((s) => sectionIO.observe(s));

export function goto(id, quiet = false) {
  const s = document.getElementById(id);
  if (!s) return;
  // Scroll to the section's header line rather than the padding above it.
  ($(".winbar", s) ?? s).scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", id === "top" ? location.pathname : `#${id}`);
  if (!quiet) message(`"${s.dataset.file}"`);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const id = a.hash.slice(1);
  if (!sections.some((s) => s.id === id)) return;
  e.preventDefault();
  goto(id, true);
});

// A link from another page (/#posts) lands on the section's header line. The
// browser jumps there before the sections above it have finished building (the
// fonts, the git log, the projects wheel and demo), and they push it down, so
// keep it in place until the page settles or the reader starts scrolling.
const landing = location.hash && sections.find((s) => `#${s.id}` === location.hash);
if (landing && landing.id !== "top") {
  const bar = $(".winbar", landing) ?? landing;
  const ro = new ResizeObserver(() => bar.scrollIntoView({ behavior: "instant", block: "start" }));
  const inputs = ["wheel", "touchstart", "keydown", "pointerdown"];
  const stop = () => {
    ro.disconnect();
    for (const t of inputs) removeEventListener(t, stop, true);
  };
  for (const t of inputs) addEventListener(t, stop, { capture: true, passive: true });
  ro.observe(document.body);
  setTimeout(stop, 3000);
}

export function findSection(word = "") {
  const w = word.toLowerCase();
  return sections.find((s) => s.id === w || s.dataset.file === w) || sections.find((s) => s.id.startsWith(w) || s.dataset.file.startsWith(w));
}

defcommand("find-file", async () => {
  const id = await completingRead("Find file: ", sections.map((s) => ({ value: s.dataset.file, ann: s.querySelector("h1, h2")?.textContent ?? "" })));
  const s = id && sections.find((x) => x.dataset.file === id);
  if (s) goto(s.id);
}, { doc: "Jump to a section by its file name", key: "SPC ." });

for (const s of sections) {
  defcommand(`goto-${s.id}`, () => goto(s.id), { hidden: true });
}

// The home page's sections, which the SPC keys jump to: on other pages those
// keys go back to the home page instead.
for (const id of ["top", "about", "projects", "posts", "contact"]) {
  if (!sections.some((s) => s.id === id)) defcommand(`goto-${id}`, () => location.assign(`/#${id}`), { hidden: true });
}
