// M-x, and evil's ex line (:) with :colorscheme, :edit, :help, :q and :w.

import { $ } from "../util.js";
import { THEMES } from "../themes.js";
import { message } from "./echo.js";
import { defcommand, call, listCommands } from "./commands.js";
import { completingRead } from "./minibuffer.js";
import { sections, goto, findSection } from "./buffers.js";
import { setTheme } from "./load-theme.js";

export async function mx() {
  const cands = listCommands().filter((c) => !c.hidden).sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ value: c.name, ann: c.doc, key: c.key }));
  const name = await completingRead("M-x ", cands);
  if (name) call(name);
}
defcommand("execute-extended-command", mx, { hidden: true });

const EX = ["colorscheme", "edit", "help", "quit", "write", "wq"];
export async function ex() {
  const line = await completingRead(":", (q) => {
    const [cmd, arg = ""] = q.trim().split(/\s+/);
    if (/^colo/.test(cmd || "") && q.includes(" ")) return THEMES.filter((t) => t.id.startsWith(arg)).map((t) => ({ value: `colorscheme ${t.id}`, ann: t.desc }));
    if (/^e(dit)?$/.test(cmd || "") && q.includes(" ")) return sections.filter((s) => s.id.startsWith(arg)).map((s) => ({ value: `edit ${s.id}`, ann: s.dataset.file }));
    return EX.filter((c) => c.startsWith(cmd || "")).map((c) => ({ value: c }));
  }, { requireMatch: false });
  if (line) runEx(line);
}

function runEx(line) {
  const [cmd, arg] = line.trim().split(/\s+/);
  if (/^q(uit|a)?!?$/.test(cmd)) call("save-buffers-kill-terminal");
  else if (/^(w|write)$/.test(cmd)) message(`"${$(".ml-buf").textContent}" written`);
  else if (/^(wq|x)!?$/.test(cmd)) message(`"${$(".ml-buf").textContent}" written. Still here, though.`);
  else if (/^colo(r(scheme)?)?$/.test(cmd)) arg ? setTheme(arg) : call("load-theme");
  else if (/^e(dit)?$/.test(cmd)) goto(findSection(arg)?.id ?? "top");
  else if (/^h(elp)?$/.test(cmd)) call("help");
  else message(`E492: Not an editor command: ${line}`, "error");
}
