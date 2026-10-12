// Othello against a serial Monte Carlo tree search player, rewritten from my C
// version: UCT selection (C = 1), random playouts, and the most-visited move
// at the end of the think time. While it thinks, each candidate move is shaded
// by its share of the search.

import { clamp } from "../util.js";
import "../../styles/demos/othello.css";

const C = 1;
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const BLACK = 1; // you
const WHITE = -1; // the search
const PASS = -1;
const name = (i) => "abcdefgh"[i % 8] + (Math.floor(i / 8) + 1);
const num = new Intl.NumberFormat(); // in the reader's locale

function flips(b, i, p) {
  if (b[i]) return [];
  const out = [];
  const r0 = Math.floor(i / 8);
  const c0 = i % 8;
  for (const [dr, dc] of DIRS) {
    const run = [];
    let r = r0 + dr;
    let c = c0 + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === -p) {
      run.push(r * 8 + c);
      r += dr;
      c += dc;
    }
    if (run.length && r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === p) out.push(...run);
  }
  return out;
}

function moves(b, p) {
  const out = [];
  for (let i = 0; i < 64; i++) if (!b[i] && flips(b, i, p).length) out.push(i);
  return out;
}

function play(b, i, p) {
  if (i === PASS) return;
  for (const f of flips(b, i, p)) b[f] = p;
  b[i] = p;
}

function score(b) {
  let n = 0;
  for (const v of b) n += v;
  return n; // > 0 black ahead
}

// One random game to the end; returns the winner (BLACK, WHITE or 0).
function playout(board, toPlay) {
  const b = board.slice();
  let p = toPlay;
  let passes = 0;
  while (passes < 2) {
    const ms = moves(b, p);
    if (ms.length) {
      play(b, ms[(Math.random() * ms.length) | 0], p);
      passes = 0;
    } else passes++;
    p = -p;
  }
  return Math.sign(score(b));
}

function node(parent, move, board, toPlay) {
  let untried = moves(board, toPlay);
  if (!untried.length && moves(board, -toPlay).length) untried = [PASS];
  return { parent, move, board, toPlay, untried, children: [], wins: 0, visits: 0 };
}

function iterate(root) {
  let n = root;
  // select
  while (!n.untried.length && n.children.length) {
    const logN = Math.log(n.visits);
    let best = null;
    let bestU = -Infinity;
    for (const ch of n.children) {
      const u = ch.wins / ch.visits + C * Math.sqrt(logN / ch.visits);
      if (u > bestU) { bestU = u; best = ch; }
    }
    n = best;
  }
  // expand
  if (n.untried.length) {
    const k = (Math.random() * n.untried.length) | 0;
    const m = n.untried.splice(k, 1)[0];
    const b = n.board.slice();
    play(b, m, n.toPlay);
    const ch = node(n, m, b, -n.toPlay);
    n.children.push(ch);
    n = ch;
  }
  // simulate and back-propagate: wins count for whoever moved into the node
  const winner = playout(n.board, n.toPlay);
  for (let x = n; x; x = x.parent) {
    x.visits++;
    const mover = -x.toPlay;
    if (winner === mover) x.wins += 1;
    else if (winner === 0) x.wins += 0.5;
  }
}

export function mount(host) {
  host.innerHTML = `
    <div class="demo-bar">
      <button type="button" class="btn" data-k="new">new game</button>
      <label class="sim-field" style="margin:0"><span>think time</span>
        <select data-k="time">
          <option value="250">0.25&nbsp;s</option>
          <option value="600" selected>0.6&nbsp;s</option>
          <option value="1000">1&nbsp;s</option>
        </select>
      </label>
      <span class="dim" data-k="score"></span>
    </div>
    <div class="oth" role="grid" aria-label="Othello board, you play black"></div>
    <p class="cap"><span data-k="status" aria-live="polite"></span> <span class="oth-count" data-k="count"></span></p>`;
  const grid = host.querySelector(".oth");
  // Only moves, passes and the end of the game are announced; the running count
  // of the search sits beside the live region, not in it.
  const status = host.querySelector('[data-k="status"]');
  const countEl = host.querySelector('[data-k="count"]');
  const scoreEl = host.querySelector('[data-k="score"]');
  const timeSel = host.querySelector('[data-k="time"]');

  // A grid of rows of cells with a single tab stop, which the arrow keys move.
  const cells = [];
  for (let r = 0; r < 8; r++) {
    const row = document.createElement("div");
    row.className = "oth-row";
    row.setAttribute("role", "row");
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement("div");
      cell.className = "oth-cell";
      cell.setAttribute("role", "gridcell");
      cell.tabIndex = -1;
      cell.dataset.i = r * 8 + c;
      cell.innerHTML = '<span class="heat" aria-hidden="true"></span><span class="disc" aria-hidden="true"></span>';
      row.append(cell);
      cells.push(cell);
    }
    grid.append(row);
  }
  let focused = 0;
  function rove(i, focus = false) {
    cells[focused].tabIndex = -1;
    focused = i;
    cells[i].tabIndex = 0;
    if (focus) cells[i].focus();
  }

  let board;
  let turn;
  let last = -1;
  let thinking = false;
  let alive = true;
  let heat = null;
  let game = 0; // so a search can tell a new game has started under it

  function reset() {
    game++;
    thinking = false;
    board = new Int8Array(64);
    board[27] = board[36] = WHITE;
    board[28] = board[35] = BLACK;
    turn = BLACK;
    last = -1;
    heat = null;
    countEl.textContent = "";
    status.textContent = "Your move: you play black. Legal moves are dotted.";
    paint();
  }

  function paint() {
    const legal = turn === BLACK && !thinking ? new Set(moves(board, BLACK)) : new Set();
    let b = 0;
    let w = 0;
    cells.forEach((cell, i) => {
      const v = board[i];
      if (v === BLACK) b++;
      if (v === WHITE) w++;
      cell.querySelector(".disc").className = `disc${v === BLACK ? " b" : v === WHITE ? " w" : ""}`;
      cell.classList.toggle("legal", legal.has(i));
      cell.classList.toggle("last", i === last);
      const h = heat?.get(i);
      const hs = cell.querySelector(".heat");
      hs.textContent = h ? `${Math.round(h * 100)}` : "";
      hs.style.setProperty("--hp", h ? `${Math.round(35 + h * 60)}%` : "0%");
      const label = `${name(i)}, ${v === BLACK ? "black" : v === WHITE ? "white" : legal.has(i) ? "empty, legal move" : "empty"}${i === last ? ", last move" : ""}`;
      // paint runs every few milliseconds during a search; leave unchanged labels be
      if (cell.getAttribute("aria-label") !== label) cell.setAttribute("aria-label", label);
    });
    scoreEl.textContent = `black ${b}, white ${w}`;
  }

  function over() {
    if (moves(board, BLACK).length || moves(board, WHITE).length) return false;
    const s = score(board);
    status.textContent = s > 0 ? "Game over: you win." : s < 0 ? "Game over: the search wins." : "Game over: a draw.";
    turn = 0;
    paint();
    return true;
  }

  async function think() {
    const g = game;
    thinking = true;
    paint();
    const root = node(null, null, board.slice(), WHITE);
    const budget = +timeSel.value;
    const t0 = performance.now();
    while (performance.now() - t0 < budget) {
      const slice = performance.now() + 14;
      while (performance.now() < slice) iterate(root);
      const total = root.visits || 1;
      heat = new Map(root.children.filter((c) => c.move !== PASS).map((c) => [c.move, c.visits / total]));
      countEl.textContent = `Searching: ${num.format(root.visits)} random games so far.`;
      paint();
      await new Promise((r) => setTimeout(r, 0));
      if (!alive || g !== game) return;
    }
    let best = root.children[0];
    for (const c of root.children) if (c.visits > best.visits) best = c;
    play(board, best.move, WHITE);
    last = best.move;
    heat?.delete(best.move);
    thinking = false;
    turn = BLACK;
    countEl.textContent = "";
    const pct = Math.round((best.wins / best.visits) * 100);
    let msg = `White played ${name(best.move)} after ${num.format(root.visits)} random games, expecting to win ${pct}% of them.`;
    paint();
    if (over()) return;
    if (!moves(board, BLACK).length) {
      msg += " You have no legal move, so you pass.";
      turn = WHITE;
      setTimeout(() => alive && g === game && think(), 700);
    }
    status.textContent = msg;
    heat = null;
    setTimeout(() => alive && !thinking && paint(), 1200);
  }

  function playAt(i) {
    if (turn !== BLACK || thinking || !flips(board, i, BLACK).length) return;
    play(board, i, BLACK);
    last = i;
    heat = null;
    paint();
    if (over()) return;
    if (moves(board, WHITE).length) {
      turn = WHITE;
      status.textContent = `You played ${name(i)}.`;
      think();
    } else {
      status.textContent = `You played ${name(i)}. White has no legal move and passes. Your move again.`;
      paint();
    }
  }

  grid.addEventListener("click", (e) => {
    const cell = e.target.closest(".oth-cell");
    if (cell) playAt(+cell.dataset.i);
  });
  grid.addEventListener("focusin", (e) => {
    const cell = e.target.closest(".oth-cell");
    if (cell) rove(+cell.dataset.i);
  });
  grid.addEventListener("keydown", (e) => {
    if (e.altKey || e.metaKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      playAt(focused);
      return;
    }
    const r = Math.floor(focused / 8);
    const c = focused % 8;
    const to = {
      ArrowLeft: [r, c - 1], ArrowRight: [r, c + 1], ArrowUp: [r - 1, c], ArrowDown: [r + 1, c],
      Home: e.ctrlKey ? [0, 0] : [r, 0], End: e.ctrlKey ? [7, 7] : [r, 7],
    }[e.key];
    if (!to) return;
    e.preventDefault();
    rove(clamp(to[0], 0, 7) * 8 + clamp(to[1], 0, 7), true);
  });
  // a new game also abandons a search in progress
  host.querySelector('[data-k="new"]').addEventListener("click", reset);

  reset();
  rove(moves(board, BLACK)[0]);
  return () => { alive = false; };
}
