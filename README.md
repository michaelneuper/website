My personal site built with [Astro](https://astro.build).

## Running it

You need Node 22.12 or newer.

```sh
npm install
npm run dev
```

To check the version Netlify will deploy:

```sh
npm run build      # writes the site to dist/
npm run preview    # serves dist/ at http://localhost:4321
```

## Where things are

| Path                                   | What it is                                                                                                                       |
|----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `src/pages/`                           | the pages: home, `posts/[slug]` for every post, 404, the RSS feeds and the giscus themes                                         |
| `src/layouts/Base.astro`               | the frame every page shares                                                                                                      |
| `src/components/frame/`                | the Emacs around each page: top line, modeline, `*Help*`, and `Buffer`, a section with its winbar                                |
| `src/components/home/`                 | the home page's sections: hero (my name in front of a wall of my C), about, projects, posts, contact, and the coffee             |
| `src/components/post/`                 | a post as an Org buffer: keywords, text, the `*Ilist*` outline, comments                                                         |
| `src/components/missing/`              | the 404 page: its status code in binary, and the `*dungeon*` text adventure                                                      |
| `src/content/posts/`                   | the posts, in Markdown                                                                                                           |
| `src/content/projects/`                | the projects on the wheel, one Markdown file each                                                                                |
| `src/data/wall.js`                     | the C on the wall behind the name, copied into `src/data/wall/` from my repos                                                    |
| `src/scripts/emacs/`                   | M-x, the minibuffer, which-key, the modeline and load-theme                                                                      |
| `src/scripts/home/`, `post/`, `demos/` | what each component and demo does in the browser                                                                                 |
| `src/styles/`                          | the styles, laid out like the components; `themes.css` has the colours                                                           |
| `src/fonts/`                           | JetBrains Mono and Computer Modern, built into `/_astro/` with a hash in each name so browsers can cache them for a year         |
| `public/`                              | files served as they are: favicon, GPG key, `robots.txt`, post videos                                                            |

Each component imports its own styles and starts its own script, so a section's
markup, CSS and JavaScript are named after it in `components/`, `styles/` and `scripts/`.

## Adding a project

Add `src/content/projects/<name>.md`. The front matter has the slug shown on its
card (`name`), the heading (`title`), its place in the list (`order`), colour
(`cat`), one-line `summary`, and optionally a `demo` from
`src/scripts/demos/` with a `demoNote` on how the demo differs from the project;
the text is the write-up. The drawing on its card comes from
`src/components/home/ProjectThumb.astro`, picked by `demo`.

## Writing a post

Add `src/content/posts/<slug>.md`, or `src/content/posts/<slug>/index.md` with its images next to it. It appears at `/posts/<slug>/` and in the posts list on the home page.

```yaml
---
title: "The title"
date: 2026-10-12T15:00:00+02:00
tags: [emacs, linux]   # colours are in src/scripts/tags.js
cat: sw                # colour on the home page: hw, sw, math or sec
toc: true              # show the *Ilist* outline of headings
draft: false           # true keeps it off the site
---
```

Maths goes between `$...$` or `$$...$$` and is rendered with KaTeX when the site is built. Videos and other files a post links to go in `public/posts/<slug>/`. A clip that should play like a GIF is written as `<video loop muted playsinline controls preload="none" width="…" height="…">`, with the video's own size, and plays only while it's on screen.

## Deploying

The site is static: `npm run build` writes it to `dist/`.

- **Cloudflare**: build command `npm run build`, deploy command `npx wrangler deploy`. `wrangler.jsonc` serves `dist/`, and its `name` has to match the Worker's name in the dashboard.
- **Netlify**: `netlify.toml` runs the build and publishes `dist/`.

Both read the response headers from `public/_headers`. The `/giscus/*` and `/_astro/*` headers there let the comments load their theme and fonts, so keep them on any host.

