// The commands every page has: help, quit, restart and the coffee link.

import { $ } from "../util.js";
import { message } from "./echo.js";
import { defcommand } from "./commands.js";

const help = $(".help");

defcommand("help", () => { if (!help.open) help.showModal(); }, { doc: "Show keys and commands", key: "SPC h h" });
defcommand("save-buffers-kill-terminal", () => message("This is a website: close it with C-w. Glad you stayed, though."), { doc: "Quit Emacs", key: "SPC q q" });
defcommand("restart-emacs", () => location.reload(), { doc: "Restart Emacs (reloads the page)", key: "SPC q r" });
defcommand("buy-me-a-coffee", () => {
  window.open("https://buymeacoffee.com/michaelneuper", "_blank", "noopener");
  message("Opened buymeacoffee.com/michaelneuper");
}, { doc: "Open my Buy Me a Coffee page", key: "SPC b" });
defcommand("keyboard-quit", () => message("Quit"), { hidden: true });
help.addEventListener("keydown", (e) => { if (e.key === "q") help.close(); });
