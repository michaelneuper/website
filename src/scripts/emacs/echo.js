// The echo area under the modeline: one line of messages, which go back to the
// idle hint after a while.

import { $, finePointer } from "../util.js";

const echo = $(".echo");

let echoTimer = 0;
const idleText = () => (finePointer.matches ? "Press SPC for commands, or M-x to run one by name." : "");
export function message(text, kind = "", ms = 5000) {
  echo.textContent = text;
  echo.className = kind ? `echo is-${kind}` : "echo";
  clearTimeout(echoTimer);
  if (ms) echoTimer = setTimeout(() => message(idleText(), "", 0), ms);
}

/** Back to the idle hint. */
export const idle = () => message(idleText(), "", 0);
idle();
