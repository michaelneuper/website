// The minibuffer: completing-read with vertico-style candidates, used by M-x,
// evil's :, load-theme and anything else that asks for a choice.

import { $ } from "../util.js";
import { message } from "./echo.js";
import { evilState } from "./modeline.js";

const mini = $(".mini");
const form = $(".mini-prompt");
const input = $("input", form);
const psEl = $(".mini-ps");
const countEl = $(".mini-count");
const list = $(".mini-list");

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
