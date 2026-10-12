// evil's motions, for reading: j and k scroll a few lines, d and u half a
// screen, gg goes to the top and G to the bottom. C-d and C-u work too on a
// Mac; elsewhere the browser keeps them (bookmark, view source).

import { reducedMotion } from "../util.js";
import { message, idle } from "./echo.js";

const LINE = 64; // px for j and k, about three lines of body text
const mac = /mac|iphone|ipad/i.test(navigator.userAgentData?.platform ?? navigator.platform);

let gAt = 0; // when g was pressed, for gg

// Handles e if it's a motion and returns true, so keys.js can stop there.
export function motion(e) {
  // held down, a key repeats faster than a smooth scroll finishes
  const behavior = reducedMotion.matches || e.repeat ? "instant" : "smooth";
  const by = (dy) => scrollBy({ top: dy, behavior });
  const half = innerHeight / 2;

  if (e.ctrlKey && !e.altKey && !e.metaKey) {
    if (!mac || (e.key !== "d" && e.key !== "u")) return false;
    e.preventDefault();
    by(e.key === "d" ? half : -half);
    return true;
  }
  if (e.ctrlKey || e.altKey || e.metaKey) return false;

  const was = gAt;
  gAt = 0;
  switch (e.key) {
    case "j": by(LINE); break;
    case "k": by(-LINE); break;
    case "d": by(half); break;
    case "u": by(-half); break;
    case "G": scrollTo({ top: document.documentElement.scrollHeight, behavior }); break;
    case "g":
      if (performance.now() - was < 800) {
        scrollTo({ top: 0, behavior });
        idle();
      } else {
        gAt = performance.now();
        message("g-", "", 800);
      }
      break;
    default:
      return false;
  }
  e.preventDefault();
  return true;
}
