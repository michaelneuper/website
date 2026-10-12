// evil's / the way Doom does it with consult-line: the minibuffer lists every
// place the page matches what you type, the page jumps to each as you move
// through the list, and Enter stays there (esc goes back to where you were).
// Afterwards n and N step through the matches and esc clears them. Matches are
// painted with the CSS Custom Highlight API, so the page's markup is left alone.

import { $, reducedMotion } from "../util.js";
import { message } from "./echo.js";
import { defcommand } from "./commands.js";
import { completingRead } from "./minibuffer.js";
import "../../styles/frame/search.css";

const painted = typeof CSS !== "undefined" && "highlights" in CSS;
const MAX = 300; // matches listed; more than this and the query wants narrowing

let matches = []; // Ranges, in page order
let query = "";
let at = -1;

// Text the reader can see: not hidden, folded away or for screen readers only.
// play.js uses it too, for the region and for butterfly.
export function readable(el) {
  if (el.closest("script, style, [aria-hidden='true'], .sr-only, canvas")) return false;
  return el.checkVisibility ? el.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true }) : el.offsetParent !== null;
}

function collect(q) {
  const found = [];
  if (!q) return found;
  // smartcase, as evil does: case matters only once the query has a capital
  const fold = !/[A-Z]/.test(q);
  const needle = fold ? q.toLowerCase() : q;
  const walk = document.createTreeWalker($("main") ?? document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.data.trim() && readable(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  for (let n = walk.nextNode(); n && found.length < MAX; n = walk.nextNode()) {
    const hay = fold ? n.data.toLowerCase() : n.data;
    for (let i = hay.indexOf(needle); i >= 0 && found.length < MAX; i = hay.indexOf(needle, i + needle.length)) {
      const r = new Range();
      r.setStart(n, i);
      r.setEnd(n, i + needle.length);
      found.push(r);
    }
  }
  return found;
}

function paint() {
  if (!painted) return;
  if (matches.length) CSS.highlights.set("search", new Highlight(...matches));
  else CSS.highlights.delete("search");
  if (at >= 0 && matches[at]) CSS.highlights.set("search-current", new Highlight(matches[at]));
  else CSS.highlights.delete("search-current");
}

// Bring match i to the middle of the screen, unless it's already in view.
function show(i, behavior) {
  at = i;
  paint();
  const r = matches[i].getBoundingClientRect();
  const top = 60, bottom = innerHeight - 90; // clear of the top line and the modeline
  if (r.top < top || r.bottom > bottom) scrollTo({ top: scrollY + r.top - innerHeight / 2, behavior });
}

// The line around a match, as the minibuffer lists it.
function context(r) {
  const text = r.startContainer.data;
  const from = Math.max(0, r.startOffset - 32);
  const to = Math.min(text.length, r.endOffset + 48);
  return `${from > 0 ? "…" : ""}${text.slice(from, to).replace(/\s+/g, " ").trim()}${to < text.length ? "…" : ""}`;
}

export async function search() {
  const start = scrollY;
  let listed = { q: null, items: [] };
  const candidates = (q) => {
    if (q !== listed.q) {
      query = q;
      matches = collect(q);
      at = -1;
      paint();
      // numbered, so each is its own candidate even when two lines read the same
      listed = { q, items: matches.map((r, i) => ({ value: `${i + 1}: ${context(r)}`, ann: r.startContainer.parentElement.closest("[data-file]")?.dataset.file ?? "" })) };
    }
    return listed.items;
  };
  const pick = await completingRead("/", candidates, {
    onPreview: (v) => show(parseInt(v, 10) - 1, "instant"),
  });
  if (!pick) {
    clearSearch();
    scrollTo({ top: start, behavior: "instant" });
    return;
  }
  show(parseInt(pick, 10) - 1, reducedMotion.matches ? "instant" : "smooth");
  report();
}

const report = (note = "") => message(`/${query}  [${at + 1}/${matches.length}]${note ? `  ${note}` : ""}`, "", 4000);

export const searchActive = () => matches.length > 0;

// n and N: the next or previous match, wrapping round the page as vim does.
export function searchNext(dir) {
  // the page may have changed under the matches (another project, a fold)
  if (!matches[0]?.startContainer.isConnected || matches.some((r) => !r.startContainer.isConnected)) {
    matches = collect(query);
    at = Math.min(at, matches.length - 1);
    if (!matches.length) {
      paint();
      return message(`E486: Pattern not found: ${query}`, "error");
    }
  }
  let i = at + dir;
  let note = "";
  if (i >= matches.length) { i = 0; note = "search hit BOTTOM, continuing at TOP"; }
  else if (i < 0) { i = matches.length - 1; note = "search hit TOP, continuing at BOTTOM"; }
  show(i, reducedMotion.matches ? "instant" : "smooth");
  report(note);
}

// esc, like :nohlsearch
export function clearSearch() {
  matches = [];
  at = -1;
  paint();
}

defcommand("consult-line", search, { doc: "Search this page", key: "/" });
