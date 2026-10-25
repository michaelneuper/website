// M-x commands for the 8-bit computer (c, n and r with focus in its demo, or on
// nothing while it's on screen, or SPC c from anywhere). They open the 8-bit
// project first if its demo isn't showing.
//
// This module loads with the page, and the board (board.js) only when the
// project is first shown, so the state that outlives a mounted board is kept
// here: which board is on the page, and the coffee overclock.

import { reducedMotion, emit, on } from "../../util.js";
import { defcommand, completingRead, message, setSegment } from "../../emacs/index.js";
import { PROGRAMS } from "./machine.js";

let current = null;
const waiting = [];
let boost = 1;
let boostTimer = 0;

/** The board on the page, if one is mounted. */
export const currentBoard = () => current;

/** board.js calls this with a board's api when it mounts, and null when it goes. */
export function setCurrentBoard(api) {
  current = api;
  if (api) waiting.splice(0).forEach((resolve) => resolve());
}

/** How many times faster the clock runs, while a coffee is in effect. */
export const clockBoost = () => boost;

// The 8-bit project's demo, opened and scrolled to if it isn't on the page yet.
// Its code may still have to load, so this waits up to 5 seconds for it.
export async function showComputer() {
  if (!current) {
    const mounted = new Promise((resolve) => {
      waiting.push(resolve);
      setTimeout(resolve, 5000);
    });
    emit("project", "8-bit-computer");
    await mounted;
  }
  current?.board.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
  return current;
}

const withComputer = (fn) => async () => {
  const c = current ?? (await showComputer());
  if (c) fn(c);
};
defcommand("computer-run", withComputer((c) => c.run()), { doc: "Run or pause the 8-bit computer", key: "c" });
defcommand("computer-step", withComputer((c) => c.step()), { doc: "Advance the clock by one cycle", key: "n" });
defcommand("computer-reset", withComputer((c) => c.reset()), { doc: "Reset the computer (RAM is kept)", key: "r" });
defcommand("computer-load-program", async () => {
  const key = await completingRead("Load program: ", Object.entries(PROGRAMS).map(([k, p]) => ({ value: k, ann: p.title })));
  if (!key) return;
  const c = await showComputer();
  c?.load(key);
  c?.run(true);
}, { doc: "Load one of the example programs into RAM", key: "SPC c l" });

// M-x coffee-refill: four times the clock for a while.
on("caffeine", ({ factor, seconds }) => {
  boost = factor;
  if (current) {
    if (current.halted()) current.reset();
    if (!current.running()) current.run(true);
  }
  let left = seconds;
  clearInterval(boostTimer);
  setSegment("misc", `${factor}× clock ${left}s`);
  boostTimer = setInterval(() => {
    left--;
    if (left > 0) return setSegment("misc", `${factor}× clock ${left}s`);
    clearInterval(boostTimer);
    boost = 1;
    setSegment("misc", "");
    message("The caffeine wore off. The clock is back to normal.");
  }, 1000);
});
