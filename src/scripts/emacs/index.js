// The Emacs around every page: doom-modeline, the echo area, a minibuffer with
// vertico-style completion (M-x, evil's :), which-key on the SPC leader,
// load-theme with live preview, a couple of Emacs's jokes (play.js) and the odd
// tip (tips.js). Import from here to add commands or talk to it.

import "./builtins.js";
import "./keys.js";
import "./play.js";
import "./tips.js";

export { message } from "./echo.js";
export { defcommand, call } from "./commands.js";
export { setSegment } from "./modeline.js";
export { completingRead } from "./minibuffer.js";
export { goto } from "./buffers.js";
export { setTheme } from "./load-theme.js";
