// The Emacs around the page: doom-modeline, the echo area, a minibuffer with
// vertico-style completion (M-x, evil's :), which-key on the SPC leader, and
// load-theme with live preview. Other modules add commands with defcommand().

import { $, $$, emit, isTyping, finePointer, reducedMotion } from "./util.js";
import { THEMES, DEFAULT_THEME } from "./themes.js";

const root = document.documentElement;
const modeline = $(".modeline");
const ml = {
  evil: $(".ml-evil"), buf: $(".ml-buf"), pos: $(".ml-pos"), pct: $(".ml-pct"),
  flags: $(".ml-flags"), misc: $(".ml-misc"), mode: $(".ml-mode"), time: $(".ml-time"),
};
const mini = $(".mini");
const form = $(".mini-prompt");
const input = $("input", form);
const psEl = $(".mini-ps");
const countEl = $(".mini-count");
const list = $(".mini-list");
const echo = $(".echo");
const wk = $(".which-key");
const help = $(".help");
const nav = $(".nav");
const menuKey = $(".menu-key");

// ── echo area ─────────────────────────────────────────────────────────

let echoTimer = 0;
const idleText = () => (finePointer.matches ? "Press SPC for commands, or M-x to run one by name." : "");
export function message(text, kind = "", ms = 5000) {
  echo.textContent = text;
  echo.className = kind ? `echo is-${kind}` : "echo";
  clearTimeout(echoTimer);
  if (ms) echoTimer = setTimeout(() => message(idleText(), "", 0), ms);
}
message(idleText(), "", 0);

// ── modeline ──────────────────────────────────────────────────────────

export function setSegment(name, text) {
  if (ml[name]) ml[name].textContent = text;
}

function evilState() {
  const a = document.activeElement;
  let s = "N";
  if (!mini.hidden || (a && isTyping({ target: a }))) s = "I";
  else if (String(getSelection()).length) s = "V";
  modeline.dataset.evil = s;
  ml.evil.textContent = `<${s}>`;
}
document.addEventListener("focusin", evilState);
document.addEventListener("focusout", () => setTimeout(evilState));
document.addEventListener("selectionchange", evilState);

function onScroll() {
  const max = root.scrollHeight - innerHeight;
  const y = scrollY;
  ml.pct.textContent = y <= 2 ? "Top" : y >= max - 2 ? "Bot" : `${Math.round((y / max) * 100)}%`;
  ml.pos.textContent = `${Math.floor(y / 21) + 1}:0`;
  root.classList.toggle("is-scrolled", y > 24);
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

function clock() {
  const d = new Date();
  ml.time.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
clock();
setInterval(clock, 15000);

// ── sections ──────────────────────────────────────────────────────────

const sections = $$("main > section");
const navLinks = $$(".nav a");
const sectionIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    ml.buf.textContent = e.target.dataset.file;
    ml.mode.textContent = e.target.dataset.mode;
    for (const a of navLinks) a.setAttribute("aria-current", String(a.hash === `#${e.target.id}`));
    emit("section", e.target.id);
  }
}, { rootMargin: "-40% 0px -55% 0px" });
sections.forEach((s) => sectionIO.observe(s));

export function goto(id, quiet = false) {
  const s = document.getElementById(id);
  if (!s) return;
  // Sections snap to their header line, so scroll to that rather than the padding above it.
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

// ── commands ──────────────────────────────────────────────────────────

const commands = new Map();
export function defcommand(name, run, { doc = "", key = "", hidden = false } = {}) {
  commands.set(name, { name, run, doc, key, hidden });
}
export function call(name, ...args) {
  const c = commands.get(name);
  if (!c) return message(`Symbol’s function definition is void: ${name}`, "error");
  return c.run(...args);
}

// ── minibuffer: completing-read ───────────────────────────────────────

let pending = null;

// Resolves to the chosen string, or null if cancelled. `candidates` is an array of
// { value, ann, key } (or strings), or a function of the input returning one.
export function completingRead(prompt, candidates, opts = {}) {
  const { initial = "", requireMatch = true, select = null, onPreview = null } = opts;
  if (pending) pending.finish(null);
  const returnFocus = document.activeElement;

  return new Promise((resolve) => {
    let items = [];
    let sel = 0;
    const norm = (c) => (typeof c === "string" ? { value: c } : c);

    const render = () => {
      const q = input.value.trim().toLowerCase();
      const all = (typeof candidates === "function" ? candidates(input.value) : candidates).map(norm);
      const terms = q.split(/\s+/).filter(Boolean);
      items = typeof candidates === "function" ? all : all.filter((c) => terms.every((t) => c.value.toLowerCase().includes(t)));
      // candidates that start with what you typed come first
      if (terms.length && typeof candidates !== "function") {
        const starts = (c) => c.value.toLowerCase().startsWith(terms[0]);
        items = [...items.filter(starts), ...items.filter((c) => !starts(c))];
      }
      sel = Math.min(sel, Math.max(0, items.length - 1));
      countEl.textContent = items.length ? `${sel + 1}/${items.length}` : "0/0";
      list.replaceChildren(...items.map((c, i) => {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(i === sel));
        li.id = `mini-opt-${i}`;
        const cand = document.createElement("span");
        cand.className = "cand";
        cand.append(...highlight(c.value, terms));
        li.append(cand);
        if (c.ann) {
          const a = document.createElement("span");
          a.className = "ann";
          a.textContent = c.ann;
          li.append(a);
        }
        if (c.key) {
          const k = document.createElement("span");
          k.className = "key";
          k.textContent = c.key;
          li.append(k);
        }
        li.addEventListener("mousedown", (e) => e.preventDefault());
        li.addEventListener("click", () => { sel = i; accept(); });
        return li;
      }));
      input.setAttribute("aria-activedescendant", items.length ? `mini-opt-${sel}` : "");
      list.children[sel]?.scrollIntoView({ block: "nearest" });
    };

    const move = (d) => {
      if (!items.length) return;
      sel = (sel + d + items.length) % items.length;
      render();
      onPreview?.(items[sel].value);
    };

    const accept = () => {
      const raw = input.value.trim();
      const hit = items[sel]?.value;
      if (hit !== undefined && (requireMatch || typeof candidates !== "function" || raw === "")) finish(hit);
      else if (!requireMatch) finish(raw || hit || null);
      else if (hit !== undefined) finish(hit);
      else message("[No match]", "error", 1500);
    };

    const onKey = (e) => {
      const ctrl = e.ctrlKey && !e.metaKey;
      if (e.key === "ArrowDown" || (ctrl && e.key === "n")) { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp" || (ctrl && e.key === "p")) { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); accept(); }
      else if (e.key === "Escape" || (ctrl && e.key === "g")) { e.preventDefault(); finish(null); }
      else if (e.key === "Tab") {
        e.preventDefault();
        if (items[sel]) {
          input.value = items[sel].value;
          render();
        }
      }
    };
    const onInput = () => {
      sel = 0;
      render();
      if (items.length) onPreview?.(items[0].value);
    };
    const onBlur = () => setTimeout(() => { if (pending?.finish === finish && document.activeElement !== input) finish(null); }, 0);
    const onSubmit = (e) => e.preventDefault();

    function finish(value) {
      if (pending?.finish !== finish) return;
      pending = null;
      input.removeEventListener("keydown", onKey);
      input.removeEventListener("input", onInput);
      input.removeEventListener("blur", onBlur);
      form.removeEventListener("submit", onSubmit);
      mini.hidden = true;
      list.replaceChildren();
      if (returnFocus && returnFocus !== input && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
      else input.blur();
      evilState();
      resolve(value);
    }

    pending = { finish };
    psEl.textContent = prompt;
    input.value = initial;
    mini.hidden = false;
    input.addEventListener("keydown", onKey);
    input.addEventListener("input", onInput);
    input.addEventListener("blur", onBlur);
    form.addEventListener("submit", onSubmit);
    if (select) {
      const all = (typeof candidates === "function" ? candidates("") : candidates).map(norm);
      sel = Math.max(0, all.findIndex((c) => c.value === select));
    }
    render();
    input.focus({ preventScroll: true });
    evilState();
  });
}

function highlight(text, terms) {
  if (!terms.length) return [text];
  const lower = text.toLowerCase();
  const marks = new Array(text.length).fill(false);
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i >= 0) for (let k = i; k < i + t.length; k++) marks[k] = true;
  }
  const out = [];
  let buf = "";
  let on = false;
  for (let i = 0; i <= text.length; i++) {
    const m = i < text.length && marks[i];
    if (i === text.length || m !== on) {
      if (buf) {
        if (on) {
          const mk = document.createElement("mark");
          mk.textContent = buf;
          out.push(mk);
        } else out.push(buf);
      }
      buf = "";
      on = m;
    }
    if (i < text.length) buf += text[i];
  }
  return out;
}

// ── M-x and evil ex ───────────────────────────────────────────────────

async function mx() {
  const cands = [...commands.values()].filter((c) => !c.hidden).sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ value: c.name, ann: c.doc, key: c.key }));
  const name = await completingRead("M-x ", cands);
  if (name) call(name);
}
defcommand("execute-extended-command", mx, { hidden: true });

const EX = ["colorscheme", "edit", "help", "quit", "write", "wq"];
async function ex() {
  const line = await completingRead(":", (q) => {
    const [cmd, arg = ""] = q.trim().split(/\s+/);
    if (/^colo/.test(cmd || "") && q.includes(" ")) return THEMES.filter((t) => t.id.startsWith(arg)).map((t) => ({ value: `colorscheme ${t.id}`, ann: t.desc }));
    if (/^e(dit)?$/.test(cmd || "") && q.includes(" ")) return sections.filter((s) => s.id.startsWith(arg)).map((s) => ({ value: `edit ${s.id}`, ann: s.dataset.file }));
    return EX.filter((c) => c.startsWith(cmd || "")).map((c) => ({ value: c }));
  }, { requireMatch: false });
  if (line) runEx(line);
}

function runEx(line) {
  const [cmd, arg] = line.trim().split(/\s+/);
  if (/^q(uit|a)?!?$/.test(cmd)) call("save-buffers-kill-terminal");
  else if (/^(w|write)$/.test(cmd)) message(`"${ml.buf.textContent}" written`);
  else if (/^(wq|x)!?$/.test(cmd)) message(`"${ml.buf.textContent}" written. Still here, though.`);
  else if (/^colo(r(scheme)?)?$/.test(cmd)) arg ? setTheme(arg) : call("load-theme");
  else if (/^e(dit)?$/.test(cmd)) goto(findSection(arg)?.id ?? "top");
  else if (/^h(elp)?$/.test(cmd)) call("help");
  else message(`E492: Not an editor command: ${line}`, "error");
}

function findSection(word = "") {
  const w = word.toLowerCase();
  return sections.find((s) => s.id === w || s.dataset.file === w) || sections.find((s) => s.id.startsWith(w) || s.dataset.file.startsWith(w));
}

// ── themes ────────────────────────────────────────────────────────────

const currentTheme = () => root.dataset.theme || DEFAULT_THEME;
function applyTheme(id) {
  if (root.dataset.theme === id) return;
  root.dataset.theme = id;
  emit("theme", id);
}
export function setTheme(id) {
  if (!THEMES.some((t) => t.id === id)) return message(`Unable to find theme file for ‘${id}’`, "error");
  applyTheme(id);
  try { localStorage.setItem("theme", id); } catch { /* private mode */ }
  message(`Loaded theme ${id}`);
}

async function loadTheme() {
  const saved = currentTheme();
  const id = await completingRead("Load custom theme: ", THEMES.map((t) => ({ value: t.id, ann: t.desc })), {
    select: saved,
    onPreview: applyTheme,
  });
  if (id) setTheme(id);
  else applyTheme(saved);
}
defcommand("load-theme", loadTheme, { doc: "Load a theme, previewing each one", key: "SPC h t" });
$(".theme-key").addEventListener("click", loadTheme);

// ── a few more commands ───────────────────────────────────────────────

defcommand("find-file", async () => {
  const id = await completingRead("Find file: ", sections.map((s) => ({ value: s.dataset.file, ann: s.querySelector("h1, h2")?.textContent ?? "" })));
  const s = id && sections.find((x) => x.dataset.file === id);
  if (s) goto(s.id);
}, { doc: "Jump to a section by its file name", key: "SPC ." });

for (const s of sections) {
  defcommand(`goto-${s.id}`, () => goto(s.id), { hidden: true });
}

defcommand("help", () => { if (!help.open) help.showModal(); }, { doc: "Show keys and commands", key: "SPC h h" });
defcommand("save-buffers-kill-terminal", () => message("This is a website: close it with C-w. Glad you stayed, though."), { doc: "Quit Emacs", key: "SPC q q" });
defcommand("restart-emacs", () => location.reload(), { doc: "Restart Emacs (reloads the page)", key: "SPC q r" });
defcommand("buy-me-a-coffee", () => {
  window.open("https://buymeacoffee.com/michaelneuper", "_blank", "noopener");
  message("Opened buymeacoffee.com/michaelneuper");
}, { doc: "Open my Buy Me a Coffee page", key: "SPC b" });
defcommand("keyboard-quit", () => message("Quit"), { hidden: true });
help.addEventListener("keydown", (e) => { if (e.key === "q") help.close(); });

// ── which-key on the SPC leader ───────────────────────────────────────

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
const bound = (map) => map.filter((b) => (b.map ? bound(b.map).length : commands.has(b.cmd)));

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
  else message(idleText(), "", 0);
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
  } else if (e.key === "Escape" && nav.classList.contains("is-open")) {
    toggleMenu(false);
  }
}, true);

// ── mobile menu ───────────────────────────────────────────────────────

function toggleMenu(open = !nav.classList.contains("is-open")) {
  nav.classList.toggle("is-open", open);
  menuKey.setAttribute("aria-expanded", String(open));
}
menuKey.addEventListener("click", () => toggleMenu());
nav.addEventListener("click", (e) => { if (e.target.closest("a")) toggleMenu(false); });
document.addEventListener("click", (e) => {
  if (nav.classList.contains("is-open") && !e.target.closest(".nav, .menu-key")) toggleMenu(false);
});

// ── copy buttons: <button data-copy="selector"> ───────────────────────

document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-copy]");
  if (!b) return;
  const src = document.querySelector(b.dataset.copy);
  if (!src) return;
  const label = b.textContent;
  try {
    await navigator.clipboard.writeText(src.textContent.trim());
    b.textContent = "copied";
    message(`Copied: ${src.textContent.trim()}`, "ok", 3000);
  } catch {
    const r = document.createRange();
    r.selectNodeContents(src);
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    b.textContent = "selected";
  }
  setTimeout(() => { b.textContent = label; }, 2000);
});
