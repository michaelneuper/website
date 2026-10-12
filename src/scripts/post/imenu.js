// M-x imenu (SPC i): jump to a heading in the post by name.

import { reducedMotion } from "../util.js";
import { defcommand, completingRead } from "../emacs/index.js";
import { headings, titleOf, reveal } from "./folding.js";

export function initImenu() {
  const heads = headings();
  if (!heads.length) return;
  defcommand("imenu", async () => {
    const pick = await completingRead("imenu: ", heads.map((h) => ({ value: titleOf(h), ann: h.tagName === "H3" ? "subsection" : "" })));
    const h = heads.find((x) => titleOf(x) === pick);
    if (!h) return;
    reveal(h);
    h.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${h.id}`);
  }, { doc: "Jump to a heading in this post", key: "SPC i" });
}
