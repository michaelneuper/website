// The projects wheel. The cards sit on a ring and turn along it: the picked one
// at the ring's outermost point, upright and framed, the others tilted along
// the arc and fading towards the far side. Drag the wheel, scroll it sideways,
// or use the arrow keys on a card; scrolling up and down over it scrolls the
// page, so it never traps the reader. The card that stops at the pointer opens
// in the detail, with its demo, and goes in the address (#projects/<slug>), so
// a link can open a project.
//
// On wide screens the wheel stands in the left margin, bulging towards the
// content; on narrower ones it lies across the top of the section, so the
// project gets the whole column.

import { $, $$, on, onFrame, reducedMotion, clamp } from "../util.js";

const GAP = 18; // px between neighbouring cards along the arc
const STUB = 14; // px from a card to the spine
const HINT = 28; // px kept clear under the wheel for the hint

export function initProjects() {
  const root = $(".pj");
  if (!root) return;
  const wheel = $(".pj-wheel", root);
  const list = $(".pj-cards", root);
  const cards = $$(".pj-card", root);
  const items = $$(".proj", root);
  const detail = $(".pj-detail", root);
  const spine = $(".pj-spine", root);
  const meta = $('[data-pj="meta"]');
  const hint = $(".pj-hint", root);
  const across = matchMedia("(max-width: 1399px)");
  const n = cards.length;
  if (!n) return;

  const pointer = document.createElement("span");
  pointer.className = "pj-pointer";
  pointer.setAttribute("aria-hidden", "true");
  wheel.append(pointer);
  root.classList.add("is-built");

  // Positions count cards round the ring and keep counting past a full turn,
  // so the wheel always turns the short way; a card's index is the position mod n.
  let pos = 0; // where the wheel is while it turns
  let target = 0; // where it is turning to
  let shown = -1; // the card in the detail
  let geo = null;
  let stop = null;
  let settle = 0;
  let unmount = null;

  // A demo is built the first time the section comes within a screen of view,
  // not on load: the 8-bit computer alone is some 500 elements, and building it
  // held up a page that opens on the name. Anything that asks for a project
  // (the computer's commands) builds it at once.
  let wakeDemos;
  const demosNear = new Promise((resolve) => { wakeDemos = resolve; });
  const near = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    near.disconnect();
    wakeDemos();
  }, { rootMargin: "100% 0px" });
  near.observe(root);

  const mod = (k) => ((k % n) + n) % n;
  // how far card i is from position p, the short way round: -n/2 to n/2
  const offset = (i, p) => mod(i - p + n / 2) - n / 2;

  // ── the ring ─────────────────────────────────────────────────────────

  function layout() {
    const W = wheel.clientWidth, H = wheel.clientHeight;
    const cw = cards[0].offsetWidth, ch = cards[0].offsetHeight;
    if (!W || !H || !cw) return;
    // the cards' layer starts out in the margin; positions here are from the wheel's own left edge
    const ox = list.offsetLeft;
    const flat = across.matches;
    list.setAttribute("aria-orientation", flat ? "horizontal" : "vertical");
    hint.innerHTML = flat ? "drag or <kbd>←</kbd> <kbd>→</kbd>" : "drag or <kbd>↑</kbd> <kbd>↓</kbd>";
    if (flat) {
      // centre below the wheel; the picked card at the top of the arc
      const R = Math.max(W * 1.15, 560);
      geo = { flat, R, a: (cw + GAP) / R, x: W / 2, y: ch / 2 + 16, cw, ch, ox };
      pointer.style.transform = `translate(${W / 2 - 5}px, 3px)`;
    } else {
      // centre off to the left; the picked card at the arc's right-hand point
      const h = H - HINT;
      const R = Math.max(h * 0.8, 380);
      geo = { flat, R, a: (ch + GAP) / R, x: W - cw / 2 - 16, y: h / 2, cw, ch, ox };
      pointer.style.transform = `translate(${W - 11}px, ${h / 2 - 5}px)`;
    }
    drawSpine(W, H);
    render();
  }

  // a circle inside the cards' one, which every card's stub reaches
  function drawSpine(W, H) {
    const { flat, R, x, y, cw, ch } = geo;
    const r = R - (flat ? ch : cw) / 2 - STUB;
    const ox = flat ? x : x - R, oy = flat ? y + R : y;
    const A = 1.25;
    const at = (t) => (flat ? [ox + r * Math.sin(t), oy - r * Math.cos(t)] : [ox + r * Math.cos(t), oy + r * Math.sin(t)]);
    const [x0, y0] = at(-A), [x1, y1] = at(A);
    spine.setAttribute("viewBox", `${geo.ox} 0 ${W - geo.ox} ${H}`);
    spine.firstElementChild.setAttribute("d", `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`);
  }

  function render() {
    if (!geo) return;
    const { flat, R, a, x, y, cw, ch, ox } = geo;
    const far = n / 2;
    cards.forEach((card, i) => {
      const d = offset(i, pos);
      const t = d * a;
      const cx = flat ? x + R * Math.sin(t) : x - R * (1 - Math.cos(t));
      const cy = flat ? y + R * (1 - Math.cos(t)) : y + R * Math.sin(t);
      const k = Math.abs(d);
      card.style.transform = `translate(${(cx - ox - cw / 2).toFixed(1)}px, ${(cy - ch / 2).toFixed(1)}px) rotate(${t.toFixed(4)}rad) scale(${(1 - k * 0.07).toFixed(3)})`;
      // gone by the far side of the ring, where a card crosses from one end to the other
      card.style.opacity = Math.max(0, 1 - (k / far) ** 3).toFixed(3);
      card.style.zIndex = String(10 - Math.round(k));
    });
  }

  // ── turning ──────────────────────────────────────────────────────────

  // quiet: leave the address alone, for the project the page opens on
  function go(p, { now = false, focus = false, quiet = false } = {}) {
    target = Math.round(p);
    const i = mod(target);
    cards.forEach((c, j) => {
      c.setAttribute("aria-selected", String(j === i));
      c.tabIndex = j === i ? 0 : -1;
    });
    if (focus) cards[i].focus({ preventScroll: true });
    turn();
    // the detail and the address follow once the wheel stops, so spinning past
    // cards doesn't start their demos
    clearTimeout(settle);
    const open = () => {
      show(i);
      if (!quiet) link(i);
    };
    if (now || reducedMotion.matches) open();
    else settle = setTimeout(open, 260);
  }

  // turn to card i, the short way round
  const goTo = (i, opts) => go(target + offset(i, target), opts);

  function turn() {
    if (reducedMotion.matches || !geo) {
      pos = target;
      render();
      return;
    }
    if (stop) return;
    stop = onFrame((t, dt) => {
      if (drag?.moved) return;
      pos += (target - pos) * (1 - Math.exp(-dt * 13));
      if (Math.abs(target - pos) < 0.002) {
        pos = target;
        stop();
        stop = null;
      }
      render();
    });
  }

  // Sideways scrolling turns the wheel one card per notch, or per 60px of
  // trackpad. Scrolling up and down is left to the page, even over the wheel.
  let acc = 0;
  let lock = 0;
  wheel.addEventListener("wheel", (e) => {
    if (!geo || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    const now = performance.now();
    if (now < lock) return;
    const delta = e.deltaX;
    acc += e.deltaMode === 1 ? delta * 32 : e.deltaMode === 2 ? delta * 400 : delta;
    if (Math.abs(acc) >= 60) {
      go(target + Math.sign(acc));
      acc = 0;
      lock = now + 150;
    }
  }, { passive: false });

  // dragging
  let drag = null;
  let dragged = false; // the click that ends a drag doesn't pick the card under it
  wheel.addEventListener("pointerdown", (e) => {
    if (!geo || e.button !== 0) return;
    // a finger wanders further than a mouse during a tap, so it has to move
    // further before the tap becomes a drag and stops being a click
    const slop = e.pointerType === "mouse" ? 6 : 14;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: pos, moved: false, v: 0, at: performance.now(), slop };
  });
  wheel.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const along = geo.flat ? e.clientX - drag.x : e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.abs(along) < drag.slop) return;
      drag.moved = true;
      wheel.setPointerCapture(e.pointerId);
      wheel.classList.add("is-dragging");
    }
    const p = drag.from - along / (geo.a * geo.R);
    const now = performance.now();
    drag.v = (p - pos) / Math.max(8, now - drag.at);
    drag.at = now;
    pos = p;
    render();
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.moved) return; // a click, which the card handles
    wheel.classList.remove("is-dragging");
    dragged = true;
    setTimeout(() => { dragged = false; });
    // a cancelled drag (the browser took a finger's swipe to scroll the page) turns back
    if (e.type === "pointercancel") turn();
    else go(pos + clamp(d.v * 140, -2, 2));
  };
  wheel.addEventListener("pointerup", release);
  wheel.addEventListener("pointercancel", release);

  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      if (!dragged) goTo(i);
    });
    card.addEventListener("keydown", (e) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (step) go(target + step, { focus: true });
      else if (e.key === "Home") goTo(0, { focus: true });
      else if (e.key === "End") goTo(n - 1, { focus: true });
      else return;
      e.preventDefault();
    });
  });

  // ── the detail ───────────────────────────────────────────────────────

  async function show(i) {
    if (i === shown) return;
    shown = i;
    unmount?.();
    unmount = null;
    const li = items[i];
    detail.dataset.cat = li.dataset.cat;
    detail.setAttribute("aria-labelledby", cards[i].id);
    // The title and facts, the write-up, then the demo. With room, the demo
    // stands beside the other two; without, it comes after the write-up, so
    // the project is explained before it is tried. The card already
    // shows the category and the slug, and the write-up says what the summary
    // says, so those stay in the list for when there's no wheel.
    const head = document.createElement("div");
    head.className = "pj-head";
    head.append($(".proj-name", li).cloneNode(true), $(".proj-facts", li).cloneNode(true));
    const row = document.createElement("div");
    row.className = "pj-row";
    row.append(head, $(".proj-body", li).cloneNode(true));
    detail.replaceChildren(row);
    if (meta) meta.textContent = `${i + 1}/${n}`;
    if (!reducedMotion.matches) {
      detail.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
    }
    const demo = li.dataset.demo;
    if (!demo) return;
    // The demo is a stand-in written for the page, so it opens in a buffer of
    // its own, *demo*, with a note on how it differs from the project.
    const box = document.createElement("div");
    box.className = "pj-demo";
    box.innerHTML = '<p class="pj-demo-head"><span>*demo*</span><span class="rule" aria-hidden="true"></span></p>';
    if (li.dataset.demoNote) {
      const note = document.createElement("p");
      note.className = "pj-demo-note";
      note.textContent = li.dataset.demoNote;
      box.append(note);
    }
    const host = document.createElement("div");
    host.className = "demo";
    box.append(host);
    row.append(box);
    try {
      await demosNear;
      const { mount } = await import(`../demos/${demo}.js`);
      if (shown === i && host.isConnected) unmount = mount(host) ?? null;
    } catch (err) {
      console.error(err);
      box.remove();
    }
  }

  // Other parts of the page can open a project by its slug (the computer commands do).
  on("project", (name) => {
    const i = items.findIndex((li) => li.dataset.name === name);
    if (i < 0) return;
    wakeDemos();
    goTo(i, { now: true });
  });

  // ── the address ──────────────────────────────────────────────────────

  // The picked project goes in the address, so it can be linked to. It
  // replaces the entry rather than adding one, so switching projects doesn't
  // fill the history.
  function link(i) {
    const hash = `#projects/${items[i].dataset.name}`;
    if (location.hash === hash) return;
    try {
      history.replaceState(null, "", hash);
    } catch {
      // browsers refuse it when it's called too often; the next pick tries again
    }
  }

  // the project an address like #projects/<slug> links to, or -1
  const linked = () => items.findIndex((li) => location.hash === `#projects/${li.dataset.name}`);

  // A link to a project brings the section into view on its header line, as
  // the menu does. On load the browser has no element with that id to jump
  // to, and the sections above are still building (the fonts, the git log)
  // and push it down, so it's held there until the page settles or the reader
  // starts scrolling, as src/scripts/emacs/buffers.js does for #projects.
  const section = root.closest("section");
  const bar = $(".winbar", section) ?? section;
  function reveal(landing) {
    if (!landing) {
      bar.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      return;
    }
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

  addEventListener("hashchange", () => {
    const i = linked();
    if (i < 0) return;
    goTo(i, { now: true });
    reveal(false);
  });

  new ResizeObserver(layout).observe(wheel);
  across.addEventListener("change", layout);
  // The page opens on the linked project, already turned to it, or on the
  // first; either way the address stays as it is.
  const start = linked();
  pos = Math.max(start, 0);
  layout();
  go(pos, { now: true, quiet: true });
  if (start >= 0) reveal(true);
}
