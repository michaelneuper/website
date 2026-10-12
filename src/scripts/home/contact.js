// The page only shows "michael [at] michaelneuper.com"; the address is put
// together here so a scraper reading the HTML never sees it whole.

import { $ } from "../util.js";
import { message } from "../emacs/index.js";

export function initContact() {
  const sec = $("#contact");
  if (!sec) return;
  const mail = $(".mail", sec);
  const address = `${mail.dataset.user}@${mail.dataset.host}`;
  const arm = () => { mail.href = `mailto:${address}`; };
  for (const ev of ["pointerenter", "focus", "touchstart"]) mail.addEventListener(ev, arm, { passive: true });
  mail.addEventListener("click", arm);

  const copy = $('[data-email="copy"]', sec);
  copy?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(address);
      copy.textContent = "copied";
      message(`Copied ${address}`, "ok", 3000);
    } catch {
      message(address, "", 8000);
      copy.textContent = "shown below";
    }
    setTimeout(() => { copy.textContent = "copy address"; }, 2000);
  });

  // <button data-copy="selector"> copies that element's text (the GPG import command)
  for (const b of sec.querySelectorAll("[data-copy]")) {
    const label = b.textContent;
    b.addEventListener("click", async () => {
      const src = $(b.dataset.copy, sec);
      if (!src) return;
      const text = src.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        b.textContent = "copied";
        message(`Copied: ${text}`, "ok", 3000);
      } catch {
        // no clipboard access: select it, so the reader can copy it themselves
        const r = document.createRange();
        r.selectNodeContents(src);
        getSelection().removeAllRanges();
        getSelection().addRange(r);
        b.textContent = "selected";
      }
      setTimeout(() => { b.textContent = label; }, 2000);
    });
  }
}
