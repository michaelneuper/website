---
name: 8-bit-computer
title: "8-bit breadboard computer"
order: 1
cat: hw
demo: computer
demoNote: "A JavaScript simulation of the board, with the build’s instructions and microcode. Click a bit in RAM to change the program, or the display for signed numbers."
summary: "Ben Eater's 8-bit breadboard computer, built chip by chip."
stack: "74HC logic, EEPROMs, breadboards, a lot of jumper wire"
links:
  - text: "Ben Eater’s series"
    href: "https://eater.net/8bit"
---

My most recent finished project: a programmable computer on breadboards, built from 74-series logic chips by following Ben Eater’s video series. It is a set of modules that share one 8-bit bus: a program counter, 16 bytes of RAM, an instruction register, A and B registers feeding an adder that also subtracts, and an output register that drives a 7-segment display.

Every instruction takes five clock steps, and the first two fetch it from RAM. At each step, microcode stored in EEPROMs sets sixteen control lines that decide which module puts a value on the bus and which ones read it. Carry and zero flags give it conditional jumps, enough for loops like counting up and down or computing Fibonacci numbers.
