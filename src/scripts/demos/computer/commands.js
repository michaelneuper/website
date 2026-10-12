// M-x commands for the 8-bit computer (c, n and r with focus in its demo, or on
// nothing while it's on screen, or SPC c from anywhere). They open the 8-bit
// project first if its demo isn't showing.

import { reducedMotion, emit } from "../../util.js";
import { defcommand, completingRead } from "../../emacs/index.js";
import { PROGRAMS } from "./machine.js";
import { currentBoard } from "./board.js";

// The 8-bit project's demo, opened and scrolled to if it isn't on the page yet.
export async function showComputer() {
  if (!currentBoard()) {
    emit("project", "8-bit-computer");
    for (let i = 0; i < 90 && !currentBoard(); i++) await new Promise((r) => requestAnimationFrame(r));
  }
  const current = currentBoard();
  current?.board.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
  return current;
}

const withComputer = (fn) => async () => {
  const c = currentBoard() ?? (await showComputer());
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
