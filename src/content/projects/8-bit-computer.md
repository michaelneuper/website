---
name: 8-bit-computer
order: 1
cat: hw
src: built
demo: computer
wide: true
summary: "Ben Eater's 8-bit breadboard computer, built chip by chip."
stack: "74HC logic, EEPROMs, breadboards, a lot of jumper wire"
links:
  - text: "Ben Eater’s series"
    href: "https://eater.net/8bit"
---

My most recent finished project: a programmable computer on breadboards, built from 74-series logic chips following Ben Eater’s video series. It has 16 bytes of RAM, an 8-bit bus, and microcode in EEPROMs that drives sixteen control lines.

The simulation below runs the same instruction set and microcode, so you can step through a program one control word at a time.
