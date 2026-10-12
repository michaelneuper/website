import { fontsReady } from "./util.js";
import "./shell.js";
import "./computer.js"; // registers the computer commands; the 8-bit project mounts it
import { initDecode } from "./decode.js";
import { initDatasheet } from "./datasheet.js";
import { initGitlog } from "./gitlog.js";
import { initMemmap } from "./memmap.js";
import { initOrg } from "./org.js";
import { initContact } from "./contact.js";
import { initCtf } from "./ctf.js";
import { initCoffee } from "./coffee.js";

function safely(fn) {
  try { fn(); } catch (err) { console.error(err); }
}

initDecode().catch((err) => { console.error(err); document.documentElement.classList.remove("boot"); });
safely(initDatasheet);
safely(initGitlog);
safely(initOrg);
safely(initContact);
safely(initCtf);
safely(initCoffee);

// The hexdump measures character widths, so wait for the mono font.
await fontsReady();
safely(initMemmap);
