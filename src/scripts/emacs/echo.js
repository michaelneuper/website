// The echo area under the modeline: one line of messages, which go back to the
// idle hint after a while.

import { $, finePointer } from "../util.js";

const echo = $(".echo");

let echoTimer = 0;
const idleText = () => (finePointer.matches ? "Press SPC for commands, or M-x to run one by name." : "");
// quiet: shown but not read out, for the tips, which come round every minute or so
export function message(text, kind = "", ms = 5000, { quiet = false } = {}) {
  echo.setAttribute("aria-live", quiet ? "off" : "polite");
  echo.textContent = text;
  echo.className = kind ? `echo is-${kind}` : "echo";
  clearTimeout(echoTimer);
  if (ms) echoTimer = setTimeout(() => message(idleText(), "", 0), ms);
}

/** Back to the idle hint. */
export const idle = () => message(idleText(), "", 0);
idle();

/** Whether the echo area is showing nothing but the idle hint. */
export const isIdle = () => echo.className === "echo" && echo.textContent === idleText();
