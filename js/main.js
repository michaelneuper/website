import { fontsReady } from "./util.js";
import "./shell.js";
import { initComputer } from "./computer.js";
import { initDatasheet } from "./datasheet.js";
import { initMemmap } from "./memmap.js";
import { initOrg } from "./org.js";
import { initUart } from "./uart.js";
import { initCtf } from "./ctf.js";
import { initCoffee } from "./coffee.js";

function safely(fn) {
  try { fn(); } catch (err) { console.error(err); }
}

safely(initComputer);
safely(initDatasheet);
safely(initOrg);
safely(initUart);
safely(initCtf);
safely(initCoffee);

// The hexdump measures character widths, so wait for the mono font.
await fontsReady();
safely(initMemmap);
