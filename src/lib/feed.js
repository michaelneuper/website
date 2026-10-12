// The RSS feed. The Hugo site served it at /index.xml and /posts/index.xml,
// so both of those URLs still return it for anyone subscribed.

import rss from "@astrojs/rss";
import { publishedPosts, summary } from "./posts.js";

export async function GET(context) {
  const posts = await publishedPosts();
  return rss({
    title: "Michael Neuper",
    description: "Posts by Michael Neuper on Emacs, Linux, maths and security.",
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      link: `/posts/${p.id}/`,
      description: summary(p.body ?? ""),
    })),
  });
}
