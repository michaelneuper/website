// A one-room text adventure on the 404 page, after M-x dunnet, which also
// starts at a dead end. Take the shovel and dig, and posts come up out of the
// dirt, the ones most like the address that was asked for first. East goes home.

import { $, $$ } from "../util.js";
import { defcommand } from "../emacs/index.js";

const POINTS = 10; // per post dug up

const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);

// How much a post looks like the requested path: shared words count double,
// and words that start the same (org/org-roam, linux/linuxes) count once.
function likeness(path, post) {
  const want = words(decodeURIComponent(path));
  let score = 0;
  for (const w of words(`${post.slug} ${post.title}`)) {
    if (want.includes(w)) score += 2;
    else if (want.some((x) => x.length > 2 && w.length > 2 && (x.startsWith(w) || w.startsWith(x)))) score += 1;
  }
  return score;
}

export function initDungeon() {
  const root = $(".dun");
  if (!root) return;
  const log = $(".dun-log", root);
  const input = $(".dun-prompt input", root);
  const posts = JSON.parse($(".dun-posts", root).textContent);
  // the posts most like the address that brought you here first, then the newest
  const buried = posts.map((p, i) => ({ ...p, i, score: likeness(location.pathname, p) }))
    .sort((a, b) => b.score - a.score || a.i - b.i);

  let shovelHere = true;
  let carrying = false;
  let found = 0;
  const history = [];
  let back = 0;

  const say = (...parts) => {
    const p = document.createElement("p");
    p.append(...parts);
    log.append(p);
    log.scrollTop = log.scrollHeight;
    return p;
  };
  const link = (text, href) => Object.assign(document.createElement("a"), { textContent: text, href });

  function look() {
    say(Object.assign(document.createElement("strong"), { textContent: "Dead end" }));
    say("You are at a dead end of a URL. The path goes back east, toward the home page. Old links lie half buried in the dirt.");
    if (shovelHere) say("There is a shovel here.");
  }

  const DIRECTIONS = /^(n|s|w|ne|nw|se|sw|u|d|north|south|west|northeast|northwest|southeast|southwest|up|down)$/;

  function run(line) {
    const [verb = "", ...rest] = line.trim().toLowerCase().split(/\s+/);
    const obj = rest.filter((w) => w !== "the").join(" ");
    if (!verb) return;
    if (verb === "go" && obj) return run(obj);

    if (verb === "look" || verb === "l") look();
    else if (verb === "e" || verb === "east") {
      say("You follow the path east, back to the home page.");
      setTimeout(() => location.assign("/"), 700);
    } else if (DIRECTIONS.test(verb)) say("You can't go that way.");
    else if (verb === "take" || verb === "get") {
      if (obj !== "shovel") say(obj ? "I don't see that here." : "Take what?");
      else if (carrying) say("You already have that.");
      else { shovelHere = false; carrying = true; say("Taken."); }
    } else if (verb === "drop") {
      if (obj !== "shovel" || !carrying) say("You don't have that.");
      else { shovelHere = true; carrying = false; say("Dropped."); }
    } else if (verb === "i" || verb === "inventory") {
      say(carrying ? "You currently have: a shovel." : "You don't have anything.");
    } else if (verb === "dig") {
      if (!carrying) say("You have nothing with which to dig.");
      else if (found >= buried.length) say("Digging here reveals nothing.");
      else {
        const post = buried[found++];
        say("Digging here reveals a post: ", link(post.title, post.href));
      }
    } else if (verb === "score") {
      say(`You have scored ${found * POINTS} out of a possible ${buried.length * POINTS} points.`);
    } else if (verb === "help" || verb === "?") {
      say("Try look, take shovel, dig, inventory, score, or a direction such as east.");
    } else if (verb === "quit" || verb === "q") {
      say("There is no quitting a dead end, but the path east leads home.");
    } else say("I don't understand that.");
  }

  function enter(line) {
    say(Object.assign(document.createElement("span"), { className: "dun-echo", textContent: `>${line}` }));
    if (line.trim()) history.push(line);
    back = history.length;
    run(line);
  }

  $(".dun-prompt", root).addEventListener("submit", (e) => {
    e.preventDefault();
    enter(input.value);
    input.value = "";
  });
  input.addEventListener("keydown", (e) => {
    // M-p and M-n in comint; the arrows do it here
    if (e.key === "ArrowUp" && back > 0) { e.preventDefault(); input.value = history[--back]; }
    else if (e.key === "ArrowDown" && back < history.length) { e.preventDefault(); back++; input.value = history[back] ?? ""; }
  });
  for (const b of $$("[data-cmd]", root)) b.addEventListener("click", () => enter(b.dataset.cmd));

  defcommand("dunnet", () => {
    root.scrollIntoView({ block: "center" });
    input.focus({ preventScroll: true });
  }, { doc: "Play the text adventure at this dead end" });

  look();
}
