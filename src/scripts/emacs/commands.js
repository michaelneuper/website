// Commands, as M-x knows them. Other modules add theirs with defcommand().

import { message } from "./echo.js";

const commands = new Map();
export function defcommand(name, run, { doc = "", key = "", hidden = false } = {}) {
  commands.set(name, { name, run, doc, key, hidden });
}
export function call(name, ...args) {
  const c = commands.get(name);
  if (!c) return message(`Symbol’s function definition is void: ${name}`, "error");
  return c.run(...args);
}

export const hasCommand = (name) => commands.has(name);
export const listCommands = () => [...commands.values()];
