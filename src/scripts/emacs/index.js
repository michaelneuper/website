// The Emacs around every page: doom-modeline, the echo area, a minibuffer with
// vertico-style completion (M-x, evil's :), which-key on the SPC leader, and
// load-theme with live preview. Import from here to add commands or talk to it.

import "./builtins.js";
import "./keys.js";

export { message } from "./echo.js";
export { defcommand, call } from "./commands.js";
export { setSegment } from "./modeline.js";
export { completingRead } from "./minibuffer.js";
export { goto } from "./buffers.js";
export { setTheme } from "./load-theme.js";
