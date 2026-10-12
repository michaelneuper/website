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

// Projects in the memory map on the home page, one file each, listed by order.
// Each one's region holds its summary as UTF-8, so the summary sets its size.
const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/projects" }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    cat: z.enum(["hw", "sw", "math", "sec"]),
    // Shown in the source column: built, private, a repo...
    src: z.string(),
    summary: z.string(),
    // computer, scheduler, bytecode, othello or rbudp (src/scripts/demos/<demo>.js)
    demo: z.string().optional(),
    // The demo gets the full width under the list.
    wide: z.boolean().default(false),
    stack: z.string().optional(),
    links: z.array(z.object({ text: z.string(), href: z.string() })).default([]),
    // A line in place of links, like "Source private (coursework)".
    note: z.string().optional(),
  }),
});

export const collections = { posts, projects };
