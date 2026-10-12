// Projects as a linker memory map. Each project's region holds its one-line
// summary as UTF-8, so a region is exactly as long as that text, origins are
// cumulative, and the hexdump shows the region's actual bytes. Projects with a
// data-demo attribute mount a small interactive demo under their write-up.

import { $, $$, hex, reducedMotion, on } from "./util.js";

const GLYPHS = "░▒▓/\\<>+=*#%&@$0123456789ABCDEF";

export function initMemmap() {
  const mm = $(".mm");
  if (!mm) return;
  const bar = $(".mm-bar", mm);
  const detail = $(".mm-detail", mm);
  const narrow = matchMedia("(max-width: 920px)");
  const enc = new TextEncoder();

  let origin = 0;
  const projects = $$(".proj", mm).map((li) => {
    const sum = $(".proj-sum", li).textContent.trim();
    const p = {
      li,
      cat: li.dataset.cat,
      src: li.dataset.src || "",
      demo: li.dataset.demo || "",
      wide: "wide" in li.dataset,
      name: $(".proj-name", li).textContent.trim(),
      sum,
      bytes: enc.encode(sum),
      body: $(".proj-body", li),
      origin,
    };
    origin += p.bytes.length;
    return p;
  });
  const meta = $('[data-mm="meta"]');
  if (meta) meta.textContent = `${projects.length} regions, 0x${hex(origin, 4)} bytes`;

  projects.forEach((p, i) => {
    const h = $(".proj-name", p.li);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "proj-row";
    btn.dataset.cat = p.cat;
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `<span class="o">0x${hex(p.origin, 4)}</span><span class="l">0x${hex(p.bytes.length, 2)}</span><span class="n"></span><span class="y"></span>`;
    const n = $(".n", btn);
    n.textContent = p.name;
    const s = document.createElement("span");
    s.className = "s";
    s.textContent = p.sum;
    n.append(s);
    $(".y", btn).textContent = p.src;
    h.replaceChildren(btn);
    btn.addEventListener("click", () => select(i, true));
    p.btn = btn;

    const seg = document.createElement("div");
    seg.className = "mm-seg";
    seg.dataset.cat = p.cat;
    seg.style.flexGrow = p.bytes.length;
    seg.textContent = p.name;
    seg.title = `${p.name}: 0x${hex(p.origin, 4)}, ${p.bytes.length} bytes`;
    seg.addEventListener("click", () => select(i, true));
    bar.append(seg);
    p.seg = seg;
  });
  mm.classList.add("is-built");

  let current = -1;
  let anim = 0;
  let unmount = null;
  let wideHost = null;

  async function select(i, user = false) {
    const p = projects[i];
    if (user && i === current && narrow.matches) {
      close();
      return;
    }
    current = i;
    projects.forEach((q, j) => {
      q.btn.setAttribute("aria-pressed", String(i === j));
      q.seg.classList.toggle("is-active", i === j);
    });
    unmount?.();
    unmount = null;
    wideHost?.remove();
    wideHost = null;
    detail.dataset.cat = p.cat;

    const dump = document.createElement("pre");
    dump.className = "hex";
    dump.setAttribute("aria-hidden", "true");
    const title = document.createElement("h3");
    title.textContent = p.name;
    const body = p.body.cloneNode(true);
    detail.replaceChildren(dump, title, body);
    place();
    hexdump(dump, p);

    if (p.demo) {
      const host = document.createElement("div");
      host.className = p.wide ? "demo demo-wide" : "demo";
      if (p.wide) wideHost = host;
      placeDemo(host, p);
      try {
        const mod = await import(`./demos/${p.demo}.js`);
        if (current === i && host.isConnected) unmount = mod.mount(host) ?? null;
      } catch (err) {
        console.error(err);
        host.remove();
      }
    }
  }

  function close() {
    unmount?.();
    unmount = null;
    wideHost?.remove();
    wideHost = null;
    projects[current]?.btn.setAttribute("aria-pressed", "false");
    projects[current]?.seg.classList.remove("is-active");
    detail.replaceChildren();
    current = -1;
  }

  // On narrow screens the write-up opens under its row instead of beside the list.
  function place() {
    const p = projects[current];
    if (!p) return;
    if (narrow.matches) p.li.append(detail);
    else $(".mm-cols", mm).append(detail);
    if (wideHost) placeDemo(wideHost, p);
  }

  // Most demos sit under the write-up; a wide one gets the full width under the list.
  function placeDemo(host, p) {
    if (p.wide && !narrow.matches) mm.append(host);
    else detail.append(host);
  }

  // Other parts of the page can open a project by name (the computer commands do).
  on("project", (name) => {
    const i = projects.findIndex((q) => q.name === name);
    if (i >= 0 && i !== current) select(i);
  });
  narrow.addEventListener("change", place);

  function hexdump(pre, p) {
    // 16 bytes a line like hexdump -C when its 78 columns fit, otherwise 8
    const probe = document.createElement("span");
    probe.textContent = "0".repeat(10);
    pre.append(probe);
    const cols = Math.floor(pre.clientWidth / (probe.getBoundingClientRect().width / 10 || 7));
    probe.remove();
    const per = cols >= 78 ? 16 : 8;
    const lines = [];
    for (let off = 0; off < p.bytes.length; off += per) {
      const chunk = [...p.bytes.slice(off, off + per)];
      const hx = chunk.map((b) => hex(b)).concat(Array(per - chunk.length).fill("  "));
      const ascii = chunk.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
      lines.push({
        addr: hex(p.origin + off, 8),
        hex: per === 16 ? `${hx.slice(0, 8).join(" ")}  ${hx.slice(8).join(" ")}` : hx.join(" "),
        ascii: ascii.padEnd(per, " "),
      });
    }
    const render = (reveal) => {
      pre.replaceChildren();
      lines.forEach((ln, li) => {
        const k = reveal - li * 0.08;
        const a = document.createElement("span");
        a.className = "addr";
        a.textContent = ln.addr;
        const asc = document.createElement("span");
        asc.className = "a";
        asc.textContent = `|${scramble(ln.ascii, k)}|`;
        pre.append(a, `  ${scramble(ln.hex, k)}  `, asc, li < lines.length - 1 ? "\n" : "");
      });
    };
    cancelAnimationFrame(anim);
    if (reducedMotion.matches) return render(9);
    const t0 = performance.now();
    const frame = (now) => {
      const k = (now - t0) / 480;
      render(k);
      if (k < 1 + lines.length * 0.08) anim = requestAnimationFrame(frame);
    };
    anim = requestAnimationFrame(frame);
  }

  select(0);
}

// Characters left of the reveal point are final; to the right they flicker.
function scramble(str, k) {
  if (k >= 1) return str;
  const cut = Math.max(0, Math.floor(str.length * k));
  let out = str.slice(0, cut);
  for (let i = cut; i < str.length; i++) {
    const c = str[i];
    out += k < 0 ? " " : c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
  }
  return out;
}
