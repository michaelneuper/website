// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // The default ("jsx") drops line breaks between text and inline elements, which
  // glues words to links. true only removes whitespace that doesn't render.
  compressHTML: true,
  // The toolbar would sit on top of the modeline and echo area.
  devToolbar: { enabled: false },
});
