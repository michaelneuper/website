// The MN-2026 chip's pins on the landing section, in pin order: 1–8 run down the
// left side and 9–16 back up the right. cat is the legend colour (hw, sw, math
// or sec, or none). "M-x some-command" in a description becomes a button.

export const PINS = [
  { name: "VCC", type: "power", text: "Supply input: coffee. Top it up with M-x coffee-refill." },
  { name: "C", type: "I/O", cat: "sw", text: "Most of what I write, from a compiler to terminal toys like a spinning cube and the Game of Life." },
  { name: "ASM", type: "I/O", cat: "sw", text: "Assembly, starting with the 8-bit computer’s eleven instructions." },
  { name: "JVM", type: "output", cat: "sw", text: "The target of my compiler, so I read javap output for fun." },
  { name: "LINUX", type: "I/O", cat: "sw", text: "Daily driver. Dotfiles on GitHub, and posts on packaging formats and turning a window manager into a desktop." },
  { name: "TTL", type: "I/O", cat: "hw", text: "74-series logic. The 8-bit computer is dozens of these chips on breadboards." },
  { name: "SEC", type: "input", cat: "sec", text: "Security: a consulting internship, a web application assessment, and the habit of asking how things break." },
  { name: "GND", type: "power", text: "Return path. Sleep, when the config is finished (it is never finished)." },
  { name: "RST", type: "input", text: "Active low. Asserted by a walk without a laptop." },
  { name: "TA", type: "output", cat: "hw", text: "Teaching assistant for introductory computer science and computer architecture." },
  { name: "TEX", type: "output", cat: "math", text: "Notes, templates and maths typeset in LaTeX, usually from Emacs." },
  { name: "ORG", type: "I/O", cat: "sw", text: "Org mode and org-roam for notes, literate configs, and replacing Jupyter." },
  { name: "EMACS", type: "I/O", cat: "sw", text: "Doom Emacs, with a literate config of over a thousand lines. Location: ~/.config/emacs/." },
  { name: "MATH", type: "input", cat: "math", text: "Project Euler, discrete maths, and modelling things in Python." },
  { name: "CAN", type: "I/O", text: "CAN bus, the network inside every car. Cars are my one interest that isn’t a computer, mostly." },
  { name: "NC", type: "no connect", text: "Reserved for the next obsession." },
];
