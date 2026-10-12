// Three beginner CTF flags hidden around the site. This file keeps only their
// SHA-256 hashes, so reading it shows how flags are checked without giving them away.
// Finding all three runs M-x zone (src/scripts/zone.js), which the submit
// button then turns into, and the modeline shows root.

import { $ } from "./util.js";
import { defcommand, message, completingRead, setSegment, call } from "./emacs/index.js";
import { zone } from "./zone.js";

//! Not that easy :) These are SHA-256 hashes, so the flags aren't in here.
const HASHES = [
  "7a80f308e7d3c86589ac38394f24154bf36149b8ad833f728c9e0ddeed29693e",
  "b8af26fa58465fa7be727749c616d906054f12928d817dd34d94284943d6f02e",
  "d43266a3ddf2cab859b257fad7ea2f2eceee3726e72f1651305a6d3f14bf064e",
];

const load = () => {
  try { return new Set(JSON.parse(localStorage.getItem("flags") || "[]")); } catch { return new Set(); }
};
const save = (set) => {
  try { localStorage.setItem("flags", JSON.stringify([...set])); } catch { /* private mode */ }
};

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function initCtf() {
  const progress = $(".ctf-progress");
  const button = $('[data-ctf="submit"]');
  let found = load();
  const count = () => [...found].filter((h) => HASHES.includes(h)).length;
  const DONE = "All three flags found. M-x zone is yours now.";

  const paint = () => {
    const n = count();
    const all = n === 3;
    if (progress) {
      progress.textContent = all ? "3 of 3 found" : `${n} of 3 found`;
      progress.classList.toggle("done", all);
    }
    if (button) {
      button.textContent = all ? "M-x zone" : "submit a flag";
      button.classList.toggle("is-done", all);
    }
    setSegment("flags", all ? "# root" : n ? `flags ${n}/3` : "");
    // M-x only lists zone once it has been earned
    defcommand("zone", () => (count() === 3 ? zone() : message("Find all three flags first.")), {
      doc: "Let the text on screen drip apart, then put it back", hidden: !all,
    });
  };
  paint();

  async function submit() {
    const guess = await completingRead("Flag: ", [], { requireMatch: false });
    if (!guess) return;
    if (!crypto.subtle) return message("Checking flags needs a secure context (https or localhost).", "error");
    const h = await sha256(guess.trim());
    if (!HASHES.includes(h)) return message("Not a flag. Keep looking.", "error");
    if (found.has(h)) return message("You already found that one.");
    found.add(h);
    save(found);
    paint();
    const n = count();
    if (n === 3) {
      message("Correct. That’s all three.", "ok", 6000);
      // once the minibuffer has closed, so its text isn't caught mid-way
      setTimeout(() => zone({ done: DONE }), 500);
    } else message(`Correct. ${n} of 3 found.`, "ok", 6000);
  }

  defcommand("submit-flag", submit, { doc: "Check a CTF flag you found on this site", key: "SPC s f" });
  defcommand("copy-gpg-fingerprint", async () => {
    const fp = $(".gpg-fp code")?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(fp);
      message(`Copied ${fp}`, "ok");
    } catch {
      message(fp);
    }
  }, { doc: "Copy my GPG key fingerprint", key: "SPC s g" });
  //! Not that easy :) Your guess is hashed and compared, so there are no flags to find here.
  button?.addEventListener("click", () => call(count() === 3 ? "zone" : "submit-flag"));

  // One flag lives in the console.
  console.log(
    "%cPoking around in the console? Good instinct.%c\nThere are three flags on this site. Here is one, base64-encoded:\nZmxhZ3tjb25zb2xlX2xvZ3NfbGVha30=\nSubmit flags with M-x submit-flag.",
    "font: 600 13px monospace",
    "font: 12px monospace",
  );
}
