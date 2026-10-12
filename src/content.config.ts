import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Posts carried over from the Hugo site, at the same URLs (/posts/<slug>/).
// A post is either <slug>.md or <slug>/index.md with its images beside it.
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // Each tag gets its colour from TAG_COLORS in src/scripts/tags.js.
    tags: z.array(z.string()).default([]),
    // The legend colour on the home page: hw, sw, math or sec.
    cat: z.enum(["hw", "sw", "math", "sec"]).optional(),
    toc: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
