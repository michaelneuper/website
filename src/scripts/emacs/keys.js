// The keys: SPC opens which-key on the leader map, M-x (Alt+x) and : open the
// minibuffer, ? opens *Help* and C-g quits. Keys typed into a field are left alone.

import { $, isTyping } from "../util.js";
import { message, idle } from "./echo.js";
import { call, hasCommand } from "./commands.js";
import { mx, ex } from "./mx.js";
import { toggleMenu, menuOpen } from "./menu.js";

const wk = $(".which-key");
const help = $(".help");
const mini = $(".mini");

const KEYMAP = [
  { key: "SPC", desc: "find file", cmd: "find-file" },
  { key: ":", desc: "M-x", cmd: "execute-extended-command" },
  { key: "c", desc: "+computer", map: [
    { key: "c", desc: "run or pause", cmd: "computer-run" },
    { key: "n", desc: "step one cycle", cmd: "computer-step" },
    { key: "r", desc: "reset", cmd: "computer-reset" },
    { key: "l", desc: "load program", cmd: "computer-load-program" },
  ] },
  { key: "a", desc: "about", cmd: "goto-about" },
  { key: "p", desc: "projects", cmd: "goto-projects" },
  { key: "n", desc: "posts", cmd: "goto-posts" },
  { key: "m", desc: "mail me", cmd: "goto-contact" },
  { key: "i", desc: "imenu", cmd: "imenu" },
  { key: "r", desc: "refill coffee", cmd: "coffee-refill" },
  { key: "b", desc: "buy me a coffee", cmd: "buy-me-a-coffee" },
  { key: "h", desc: "+help", map: [
    { key: "t", desc: "load-theme", cmd: "load-theme" },
    { key: "h", desc: "keys and commands", cmd: "help" },
  ] },
  { key: "s", desc: "+security", map: [
    { key: "f", desc: "submit-flag", cmd: "submit-flag" },
    { key: "g", desc: "copy GPG fingerprint", cmd: "copy-gpg-fingerprint" },
  ] },
  { key: "q", desc: "+quit", map: [
    { key: "q", desc: "quit", cmd: "save-buffers-kill-terminal" },
    { key: "r", desc: "restart", cmd: "restart-emacs" },
  ] },
];

let leader = null; // { map, prefix }
let wkTimer = 0;

// Only the bindings whose command this page defines (posts have no computer).
const bound = (map) => map.filter((b) => (b.map ? bound(b.map).length : hasCommand(b.cmd)));

function startLeader() {
  leader = { map: bound(KEYMAP), prefix: "SPC" };
  message("SPC-", "", 0);
  clearTimeout(wkTimer);
  wkTimer = setTimeout(showWhichKey, 300);
}

function showWhichKey() {
  if (!leader) return;
  const title = document.createElement("p");
  title.className = "wk-title";
  title.textContent = `${leader.prefix}-`;
  wk.replaceChildren(title, ...leader.map.map((b) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "wk-item";
    item.style.cssText = "border:0;background:none;padding:0;text-align:left;font:inherit;color:inherit";
    item.innerHTML = `<span class="wk-key"></span><span class="wk-arrow">→</span><span class="wk-desc${b.map ? " group" : ""}"></span>`;
    item.children[0].textContent = b.key;
    item.children[2].textContent = b.desc;
    item.addEventListener("mousedown", (e) => e.preventDefault());
    item.addEventListener("click", () => press(b.key));
    return item;
  }));
  wk.hidden = false;
}

function endLeader(text = null) {
  leader = null;
  clearTimeout(wkTimer);
  wk.hidden = true;
  if (text !== null) message(text, text.endsWith("undefined") ? "error" : "", 3000);
  else idle();
}

function press(key) {
  const b = leader.map.find((x) => x.key === key);
  if (!b) return endLeader(`${leader.prefix} ${key} is undefined`);
  if (b.map) {
    leader = { map: bound(b.map), prefix: `${leader.prefix} ${key}` };
    message(`${leader.prefix}-`, "", 0);
    showWhichKey();
    return;
  }
  endLeader();
  call(b.cmd);
}

// ── keys ──────────────────────────────────────────────────────────────

addEventListener("keydown", (e) => {
  if (help.open) return;
  if (leader) {
    if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape" || (e.ctrlKey && e.key === "g")) endLeader("Quit");
    else press(e.key === " " ? "SPC" : e.key);
    return;
  }
  if (!mini.hidden || isTyping(e)) return;

  if (e.altKey && e.code === "KeyX" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    mx();
  } else if (e.ctrlKey && e.key === "g") {
    e.preventDefault();
    call("keyboard-quit");
  } else if (e.metaKey || e.ctrlKey || e.altKey) {
    // leave browser shortcuts alone
  } else if (e.key === " " && !e.target.closest?.("button, a, select, summary, [tabindex]")) {
    e.preventDefault();
    startLeader();
  } else if (e.key === ":") {
    e.preventDefault();
    ex();
  } else if (e.key === "?") {
    e.preventDefault();
    call("help");
  } else if (e.key === "Escape" && menuOpen()) {
    toggleMenu(false);
  }
}, true);
