// Shared by the home page's posts list, the post pages and the feeds.

import { getCollection } from "astro:content";

/** Published posts, newest first. */
export async function publishedPosts() {
  const posts = await getCollection("posts", (p) => !p.data.draft);
  return posts.sort((a, b) => b.data.date - a.data.date);
}

// Dates are in South African time, as the posts were written.
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" });
const dow = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", weekday: "short" });
/** 2024-11-22 */
export const ymd = (date) => day.format(date);
/** Fri */
export const weekday = (date) => dow.format(date);

/** Words in the Markdown source, about what wc -w says. */
export const wordCount = (body) => body.split(/\s+/).filter(Boolean).length;

/**
 * The opening of a post as plain text, for meta descriptions and the feeds:
 * everything above Hugo's <!--more--> marker, or else the first paragraph.
 */
export function summary(body, max = 220) {
  const blocks = body.trim().split(/\n\s*\n/);
  const head = body.includes("<!--more-->")
    ? body.split("<!--more-->")[0]
    : blocks.find((b) => !/^\s*([#!<>|`-]|\d+\.|\[\^)/.test(b)) ?? "";
  const text = head
    .split("\n")
    .filter((line) => !/^\[\^[^\]]+\]:/.test(line)) // footnote definitions
    .join(" ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links
    .replace(/\[\^[^\]]+\]/g, "") // footnote references
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max)).replace(/[,.;:]$/, "")}…`;
}
