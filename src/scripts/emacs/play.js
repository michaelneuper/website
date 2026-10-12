// Two of Emacs's jokes, as it has them.
//
// M-x butterfly is xkcd 378: real programmers flap a butterfly's wings once, and
// the air currents focus a cosmic ray onto the drive platter to flip the bit
// they want. Emacs asks if you really want to unleash the powers of the
// butterfly, plays "Amazing physics going on..." in a *butterfly* buffer, and
// reports one flipped bit. Here the bit lands in a letter on the page. It's the
// prize for finding the three CTF flags, so ctf.js defines the command.
//
// M-x morse-region and unmorse-region (play/morse.el) turn the region, here the
// text you've selected, into Morse code and back: codes separated by slashes
// within a word, words by their spaces.

import { $, reducedMotion } from "../util.js";
import { message, idle } from "./echo.js";
import { defcommand } from "./commands.js";
import { completingRead } from "./minibuffer.js";
import { setSegment } from "./modeline.js";
import { readable } from "./search.js";
import "../../styles/frame/play.css";

const rand = (n) => Math.floor(Math.random() * n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── the region ────────────────────────────────────────────────────────

// The last text selected on the page. It's kept while the minibuffer takes
// focus to run a command on it, and dropped when the selection goes away
// anywhere else, as a click deactivates the mark in Emacs.
let region = null;
const mini = $(".mini");
document.addEventListener("selectionchange", () => {
  const sel = getSelection();
  if (sel.rangeCount && !sel.isCollapsed) {
    const r = sel.getRangeAt(0);
    if ($("main")?.contains(r.commonAncestorContainer)) region = r.cloneRange();
  } else if (mini.hidden) {
    region = null;
  }
});

// Rewrite the text in a range, a text node at a time, with fn(text, state).
function rewrite(range, fn) {
  const root = range.commonAncestorContainer;
  const nodes = [];
  if (root.nodeType === Node.TEXT_NODE) nodes.push(root);
  else {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (range.intersectsNode(n) && readable(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    for (let n = walk.nextNode(); n; n = walk.nextNode()) nodes.push(n);
  }
  const state = {};
  for (const n of nodes) {
    const from = n === range.startContainer ? range.startOffset : 0;
    const to = n === range.endContainer ? range.endOffset : n.data.length;
    n.data = n.data.slice(0, from) + fn(n.data.slice(from, to), state) + n.data.slice(to);
  }
}

function onRegion(fn) {
  if (!region || !region.startContainer.isConnected) {
    return message("The mark is not set now, so there is no region", "error");
  }
  rewrite(region, fn);
  region = null;
  getSelection().removeAllRanges();
}

// ── morse ─────────────────────────────────────────────────────────────

// ITU Morse, without the slash, which separates the letters
const MORSE = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---",
  k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-",
  u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--", "(": "-.--.", ")": "-.--.-", "&": ".-...",
  ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-", "\"": ".-..-.", "$": "...-..-", "@": ".--.-.",
};
const UNMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

// As morse.el: each code after a slash, except the first in a word.
function toMorse(text, state) {
  let out = "";
  for (const ch of text) {
    const code = MORSE[ch.toLowerCase()];
    if (/\s/.test(ch)) { out += ch; state.sep = ""; }
    else if (code) { out += (state.sep ?? "") + code; state.sep = "/"; }
    else { out += ch; state.sep = ""; }
  }
  return out;
}

// Each run of dots and dashes it knows becomes its letter, and the slash after it goes.
const fromMorse = (text) => text.replace(/([.-]+)\/?/g, (m, code) => UNMORSE[code] ?? m);

defcommand("morse-region", () => onRegion(toMorse), { doc: "Convert all text in a given region to morse code" });
defcommand("unmorse-region", () => onRegion(fromMorse), { doc: "Convert morse coded text in region to ordinary ASCII text" });

// ── butterfly ─────────────────────────────────────────────────────────

const PHYSICS = "Amazing physics going on...";
let flapping = false;

// A letter or digit in view, and the bit to flip: one that leaves it printable
// (and not a backtick, which the serif font lacks).
function target() {
  const top = 60, bottom = innerHeight - 90;
  const nodes = [];
  const walk = document.createTreeWalker($("main") ?? document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      if (!/[a-z0-9]/i.test(n.data) || !readable(n.parentElement)) return NodeFilter.FILTER_REJECT;
      const r = n.parentElement.getBoundingClientRect();
      return r.bottom > top && r.top < bottom ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  for (let n = walk.nextNode(); n; n = walk.nextNode()) nodes.push(n);
  for (let tries = 0; tries < 60 && nodes.length; tries++) {
    const n = nodes[rand(nodes.length)];
    const i = rand(n.data.length);
    if (!/[a-z0-9]/i.test(n.data[i])) continue;
    const r = new Range();
    r.setStart(n, i);
    r.setEnd(n, i + 1);
    const box = r.getBoundingClientRect();
    if (box.top < top || box.bottom > bottom) continue;
    const code = n.data.charCodeAt(i);
    const bits = [0, 1, 2, 3, 4, 5].filter((b) => {
      const v = code ^ (1 << b);
      return v > 0x20 && v < 0x7f && v !== 0x60;
    });
    return { n, i, bit: bits[rand(bits.length)] };
  }
  return null;
}

export async function butterfly() {
  if (flapping) return;
  const answer = await completingRead("Do you really want to unleash the powers of the butterfly? (yes or no) ", ["yes", "no"]);
  if (answer === null) return message("Quit");
  if (answer === "no") {
    message("Well, then go to xkcd.com!");
    window.open("https://xkcd.com/378/", "_blank", "noopener");
    return;
  }
  flapping = true;
  idle();

  // the *butterfly* buffer, with the physics flying into place, as animate-string does
  const buf = $(".ml-buf")?.textContent ?? "";
  const mode = $(".ml-mode")?.textContent ?? "";
  setSegment("buf", "*butterfly*");
  setSegment("mode", "Fundamental");
  const screen = document.createElement("div");
  screen.className = "butterfly";
  screen.setAttribute("role", "status");
  const line = document.createElement("p");
  line.setAttribute("aria-label", PHYSICS);
  for (const ch of PHYSICS) {
    const s = document.createElement("span");
    s.setAttribute("aria-hidden", "true");
    s.textContent = ch;
    if (!reducedMotion.matches) s.style.transform = `translate(${rand(innerWidth) - innerWidth / 2}px, ${rand(innerHeight) - innerHeight / 2}px)`;
    line.append(s);
  }
  screen.append(line);
  document.body.append(screen);
  // the next frame, so the spans start where they were put
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const s of line.children) s.style.transform = "";
  }));

  // Emacs sits for up to five seconds, at random; esc or C-g ends it early
  let quit = false;
  const stop = (e) => {
    if (e.key === "Escape" || (e.ctrlKey && e.key === "g")) quit = true;
  };
  addEventListener("keydown", stop, true);
  const wait = reducedMotion.matches ? 1200 : 1600 + rand(3000);
  for (let t = 0; t < wait && !quit; t += 100) await sleep(100);
  removeEventListener("keydown", stop, true);
  screen.remove();
  setSegment("buf", buf);
  setSegment("mode", mode);
  flapping = false;
  if (quit) return message("Quit");

  const hit = target();
  if (!hit) return message("Successfully flipped one bit!");
  const { n, i, bit } = hit;
  n.data = n.data.slice(0, i) + String.fromCharCode(n.data.charCodeAt(i) ^ (1 << bit)) + n.data.slice(i + 1);
  // show where it landed for a few seconds
  if (typeof CSS !== "undefined" && "highlights" in CSS) {
    const r = new Range();
    r.setStart(n, i);
    r.setEnd(n, i + 1);
    CSS.highlights.set("butterfly", new Highlight(r));
    setTimeout(() => CSS.highlights.delete("butterfly"), 5000);
  }
  message("Successfully flipped one bit!", "ok", 6000);
}

