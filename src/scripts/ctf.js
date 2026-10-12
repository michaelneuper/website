// Three beginner CTF flags hidden around the site. This file keeps only their
// SHA-256 hashes, so reading it shows how flags are checked without giving them away.

import { $ } from "./util.js";
import { defcommand, message, completingRead, setSegment, call } from "./emacs/index.js";

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
  let found = load();

  const paint = () => {
    const n = [...found].filter((h) => HASHES.includes(h)).length;
    if (progress) {
      progress.textContent = n === 3 ? "3 of 3 found. Nicely done." : `${n} of 3 found`;
      progress.classList.toggle("done", n === 3);
    }
    setSegment("flags", n ? `flags ${n}/3` : "");
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
    const n = [...found].filter((x) => HASHES.includes(x)).length;
    message(n === 3 ? "Correct. That’s all three." : `Correct. ${n} of 3 found.`, "ok", 6000);
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
  $('[data-ctf="submit"]')?.addEventListener("click", () => call("submit-flag"));

  // One flag lives in the console.
  console.log(
    "%cPoking around in the console? Good instinct.%c\nThere are three flags on this site. Here is one, base64-encoded:\nZmxhZ3tjb25zb2xlX2xvZ3NfbGVha30=\nSubmit flags with M-x submit-flag.",
    "font: 600 13px monospace",
    "font: 12px monospace",
  );
}
