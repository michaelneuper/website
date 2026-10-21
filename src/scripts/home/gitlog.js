// Experience as one-line git log --graph output, the "git lg" way:
//   <date> - (refs) <subject> <author>
// with the date standing in for the hash and the company as the author.
//
// The rows are plain text in src/components/home/About.astro, so they read
// fine without JavaScript.
// This colours the graph by branch (data-lanes), colours the date, refs and
// author, and turns subjects that have a .gl-desc into buttons that expand it.
// Lanes: m main, u undergrad, t teaching-assistant, b bbd-software, i mwr-internship.
//
// When the log is wider than its box (on a phone), it wraps the way a narrow
// terminal would: at word boundaries, with each wrapped line starting with the
// commit's lane pipes and a short hanging indent.

import { $, $$ } from "../util.js";

const LANE_CLASS = { m: "lm", u: "lu", t: "lt", b: "lb", i: "li" };
const ROW = /^([|*/\\ ]*?)(\d{4}-\d{2}(?:-\d{2})?) - (?:\(([^)]*)\) ?)?(.*?)(?: ?<([^>]*)>)?$/;
const HANG = 2;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// The graph characters, coloured by lane and hidden from screen readers.
// `tip` makes the commit's * bold.
function graph(text, lanes = "", tip = false) {
  const g = el("span", "gl-graph");
  g.setAttribute("aria-hidden", "true");
  [...text].forEach((ch, i) => {
    const lane = LANE_CLASS[(lanes[i] || " ").trim()];
    if (ch === "*" && tip) g.append(el("span", "gl-tip", ch));
    else g.append(lane && ch.trim() ? el("span", lane, ch) : ch);
  });
  return g;
}

// The HEAD commit is dated with the month the page is viewed in.
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parse(div) {
  const descEl = $(".gl-desc", div);
  const body = descEl ? descEl.textContent.replace(/^\n+|\s+$/g, "").split("\n") : null;
  descEl?.remove();
  const text = div.textContent.replace(/\s+$/, "");
  const m = ROW.exec(text);
  const row = {
    graph: m ? m[1] : text, lanes: div.dataset.lanes, cont: div.dataset.cont ?? "", contLanes: div.dataset.contLanes,
    tip: "tip" in div.dataset, branch: div.dataset.branch,
  };
  if (!m) return row;
  return {
    ...row,
    date: "today" in div.dataset ? today() : m[2],
    refs: m[3] ? m[3].split(/,\s*/).map((r) => (r.startsWith("HEAD -> ") ? { head: true, name: r.slice(8) } : { name: r })) : [],
    subject: m[4],
    author: m[5],
    body,
  };
}

const refsText = (refs) => `(${refs.map((r) => (r.head ? "HEAD -> " : "") + r.name).join(", ")})`;

// A commit line as words, so it can be wrapped. Each word knows how to draw itself.
function words(row) {
  const w = [{ text: row.date, cls: `gl-date ${LANE_CLASS[row.branch] ?? ""}` }, { text: "-" }];
  if (row.refs.length) w.push({ text: refsText(row.refs), refs: row.refs });
  if (row.subject) for (const s of row.subject.split(" ")) w.push({ text: s, subj: true });
  if (row.author) w.push({ text: `<${row.author}>`, cls: "gl-author" }); // kept on one line
  return w;
}

// Greedy word wrap. Returns lines of words; a word longer than the width gets a line to itself.
function wrap(list, width, hang) {
  const lines = [[]];
  let used = 0;
  for (const w of list) {
    const line = lines[lines.length - 1];
    const need = (line.length ? 1 : 0) + w.text.length;
    if (line.length && used + need > width) {
      lines.push([w]);
      used = hang + w.text.length;
    } else {
      line.push(w);
      used += need;
    }
  }
  return lines;
}

// Re-flow a description to a width, keeping "- " bullets with a hanging indent.
function reflow(body, width) {
  const blocks = [];
  for (const line of body) {
    if (line.startsWith("- ") || !blocks.length || !line.startsWith("  ")) blocks.push(line.trim());
    else blocks[blocks.length - 1] += ` ${line.trim()}`;
  }
  // plain paragraphs that were hard-wrapped become one block again
  const merged = [];
  for (const b of blocks) {
    if (merged.length && !b.startsWith("- ") && !merged[merged.length - 1].startsWith("- ")) merged[merged.length - 1] += ` ${b}`;
    else merged.push(b);
  }
  const out = [];
  for (const b of merged) {
    const bullet = b.startsWith("- ");
    const lines = wrap(b.split(" ").map((text) => ({ text })), width, bullet ? 2 : 0);
    lines.forEach((l, i) => out.push((i && bullet ? "  " : "") + l.map((w) => w.text).join(" ")));
  }
  return out;
}

export function initGitlog() {
  const host = $(".gitlog");
  if (!host) return;
  const rows = $$(":scope > .gl-line", host).map(parse);
  const open = new Set();
  let lastCols = 0;

  function measureCols() {
    const probe = el("span", "", "0".repeat(20));
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
    host.append(probe);
    const ch = probe.getBoundingClientRect().width / 20 || 7;
    probe.remove();
    const cs = getComputedStyle(host);
    const inner = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return Math.max(24, Math.floor(inner / ch));
  }

  function render(focusRow = -1) {
    const cols = measureCols();
    lastCols = cols;
    const lineLen = (r) => r.graph.length + words(r).reduce((n, w, i) => n + (i ? 1 : 0) + w.text.length, 0);
    const wide = rows.every((r) => !r.date || lineLen(r) <= cols);
    const pipesOnly = (r) => r && !r.date && /^[| ]+$/.test(r.graph);
    const frag = document.createDocumentFragment();

    rows.forEach((row, n) => {
      if (!row.date) {
        const line = el("div", "gl-line");
        line.append(graph(row.graph, row.lanes));
        frag.append(line);
        return;
      }

      const isOpen = open.has(n);
      const lines = wrap(words(row), cols - row.graph.length, HANG);
      let subjSeen = false;
      lines.forEach((ws, li) => {
        const line = el("div", "gl-line");
        line.append(li ? graph(row.cont, row.contLanes) : graph(row.graph, row.lanes, row.tip));
        if (li) line.append(" ".repeat(HANG));
        // consecutive subject words on a line become one button (or span) so the underline is unbroken
        for (let k = 0; k < ws.length; k++) {
          if (k) line.append(" ");
          const w = ws[k];
          if (w.subj) {
            let text = w.text;
            while (ws[k + 1]?.subj) text += ` ${ws[++k].text}`;
            if (row.body) {
              const b = el("button", "gl-subj", text);
              b.type = "button";
              b.dataset.row = n;
              b.setAttribute("aria-expanded", String(isOpen));
              if (subjSeen) b.tabIndex = -1; // one tab stop per commit, even when its subject wraps
              line.append(b);
            } else {
              line.append(el("span", "gl-text", text));
            }
            subjSeen = true;
          } else if (w.refs) {
            const refs = el("span", "gl-refs");
            refs.append("(");
            w.refs.forEach((r, i) => {
              if (i) refs.append(", ");
              if (r.head) refs.append(el("span", "gl-head", "HEAD -> "));
              refs.append(el("span", "gl-branch", r.name));
            });
            refs.append(")");
            line.append(refs);
          } else {
            line.append(w.cls ? el("span", w.cls, w.text) : w.text);
          }
        }
        frag.append(line);
      });

      if (row.body && isOpen) {
        const refsLen = row.refs.length ? refsText(row.refs).length + 1 : 0;
        // under the subject when there's room; otherwise a little deeper than wrapped lines
        const indent = wide ? row.date.length + 3 + refsLen : HANG + 2;
        const text = wide ? row.body : reflow(row.body, cols - row.cont.length - indent);
        const tail = pipesOnly(rows[n + 1]) ? [] : [""];
        for (const t of [...text, ...tail]) {
          const b = el("div", "gl-line gl-body");
          b.append(graph(row.cont, row.contLanes), t ? " ".repeat(indent) + t : "");
          frag.append(b);
        }
      }
    });

    host.replaceChildren(frag);
    host.classList.add("is-built");
    if (focusRow >= 0) host.querySelector(`.gl-subj[data-row="${focusRow}"]`)?.focus({ preventScroll: true });
  }

  host.addEventListener("click", (e) => {
    const b = e.target.closest(".gl-subj");
    if (!b) return;
    const n = +b.dataset.row;
    if (open.has(n)) open.delete(n);
    else open.add(n);
    render(n);
  });

  render();
  new ResizeObserver(() => {
    if (measureCols() !== lastCols) render();
  }).observe(host);
}
