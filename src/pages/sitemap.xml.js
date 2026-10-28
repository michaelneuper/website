// The sitemap for search engines: the home page and every published post. The
// Hugo site had one at /sitemap.xml, so Search Console may already know this
// address. Drafts stay out, as they do everywhere else.

import { publishedPosts } from "../lib/posts.js";

export async function GET({ site }) {
  const posts = await publishedPosts();
  const urls = ["/", ...posts.map((p) => `/posts/${p.id}/`)].map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
