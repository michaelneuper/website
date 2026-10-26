// A tip in the echo area every now and then, each giving away one of the
// site's easter eggs. One comes only while the echo area is idle and the reader
// isn't in the middle of something, and only on screens with a keyboard and a
// mouse: most of the eggs need keys, and that's where the echo area has room for
// a line. Tips aren't repeated until all of them have been shown (remembered in
// localStorage), only ones for things on the page come up, and screen readers
// aren't sent one a minute.

import { $, finePointer } from "../util.js";
import { message, isIdle } from "./echo.js";
import { hasCommand, listCommands } from "./commands.js";

const FIRST = 10_000; // ms before the first tip
const EVERY = 30_000; // ms between tips
const SHOW = 9000; // ms a tip stays up
const QUIET = 5000; // ms since the last key or click before one may interrupt

const cmd = (name) => () => hasCommand(name);
const unlocked = () => listCommands().some((c) => c.name === "butterfly" && !c.hidden);

const TIPS = [
  { id: "search", text: "/ searches this page, and n and N step through the matches." },
  { id: "motions", text: "j and k scroll, and gg and G go to the top and bottom, as in evil." },
  { id: "themes", text: "SPC h t tries the 12 themes with a live preview; :colorscheme picks one by name." },
  { id: "help", text: "? lists every key and command on this page." },
  { id: "quit", text: "Try :q, or SPC q q." },
  { id: "morse", text: "Select some text, then M-x morse-region turns it into Morse code.", when: cmd("morse-region") },
  { id: "find-file", text: "SPC . jumps to a section by its file name.", when: () => document.querySelectorAll("main > section[data-file]").length > 1 },
  { id: "404", text: "Mistype an address: the 404 page is a text adventure.", when: () => !hasCommand("dunnet") },
  { id: "dunnet", text: "Look around this room. Something might be buried here.", when: cmd("dunnet") },
  { id: "ctf", text: "Three CTF flags are hidden on this site; M-x submit-flag checks one.", when: () => hasCommand("submit-flag") && !unlocked() },
  { id: "prize", text: "Find all three CTF flags and M-x learns a new command.", when: () => hasCommand("submit-flag") && !unlocked() },
  { id: "butterfly", text: "M-x butterfly: real programmers use butterflies.", when: unlocked },
  // the home page
  { id: "coffee", text: "SPC r refills the coffee, which overclocks the 8-bit computer for 30 seconds.", when: cmd("coffee-refill") },
  // a post
  { id: "post-fold", text: "TAB on a heading folds it, and S-TAB cycles the whole post, as in Org mode.", when: cmd("org-shifttab") },
  { id: "imenu", text: "SPC i lists this post's headings to jump to.", when: cmd("imenu") },
];

const load = () => {
  try { return new Set(JSON.parse(localStorage.getItem("tips-seen") || "[]")); } catch { return new Set(); }
};
const save = (seen) => {
  try { localStorage.setItem("tips-seen", JSON.stringify([...seen])); } catch { /* private mode */ }
};

let lastInput = 0;
for (const t of ["keydown", "pointerdown"]) addEventListener(t, () => { lastInput = performance.now(); }, { capture: true, passive: true });

// Whether a tip may come up now: the echo area free, nothing open, nobody typing.
const calm = () =>
  !document.hidden &&
  finePointer.matches &&
  isIdle() &&
  $(".mini")?.hidden &&
  $(".which-key")?.hidden &&
  !$(".help")?.open &&
  !$(".butterfly") &&
  performance.now() - lastInput > QUIET;

// About how many characters the echo area holds: 12px JetBrains Mono is 7.2px a character.
const room = () => Math.floor(($(".echo")?.clientWidth ?? 0) / 7.3) - 2;

function pick() {
  const fits = room();
  const here = TIPS.filter((t) => (!t.when || t.when()) && `Tip: ${t.text}`.length <= fits);
  if (!here.length) return null;
  const seen = load();
  let fresh = here.filter((t) => !seen.has(t.id));
  // all of them shown: start round again, with what's here
  if (!fresh.length) {
    for (const t of here) seen.delete(t.id);
    fresh = here;
  }
  const tip = fresh[Math.floor(Math.random() * fresh.length)];
  seen.add(tip.id);
  save(seen);
  return tip;
}

function tick() {
  // not now: try again shortly, so tips still come about when they're due
  if (!calm()) return setTimeout(tick, 5000);
  const tip = pick();
  if (tip) message(`Tip: ${tip.text}`, "tip", SHOW, { quiet: true });
  setTimeout(tick, EVERY);
}
setTimeout(tick, FIRST);
