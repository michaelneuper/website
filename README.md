# michaelneuper.com

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

| Path                       | What it is                                                                    |
|----------------------------|-------------------------------------------------------------------------------|
| `src/pages/`               | the pages: home, `posts/[slug]` for every post, 404, the RSS feeds and the giscus themes |
| `src/layouts/Base.astro`   | the frame every page shares                                                   |
| `src/components/frame/`    | the Emacs around each page: top line, modeline, `*Help*`, footer, and `Buffer`, a section with its winbar |
| `src/components/home/`     | the home page's sections: hero, about, projects, posts, contact, and the coffee |
| `src/components/post/`     | a post as an Org buffer: keywords, text, the `*Ilist*` outline, comments      |
| `src/content/posts/`       | the posts, in Markdown                                                        |
| `src/content/projects/`    | the projects in the memory map, one Markdown file each                        |
| `src/data/pins.js`         | the pins on the MN-2026 chip                                                  |
| `src/scripts/emacs/`       | M-x, the minibuffer, which-key, the modeline and load-theme                   |
| `src/scripts/home/`, `post/`, `demos/` | what each component and demo does in the browser                  |
| `src/styles/`              | the styles, laid out like the components; `themes.css` has the colours       |
| `public/`                  | files served as they are: fonts, favicon, GPG key, `robots.txt`, post videos  |

Each component imports its own styles and starts its own script, so a section's
markup, CSS and JavaScript are named after it in `components/`, `styles/` and `scripts/`.

## Adding a project

Add `src/content/projects/<name>.md`. The front matter has its place in the list
(`order`), colour (`cat`), one-line `summary` (its size in the memory map),
and optionally a `demo` from `src/scripts/demos/`; the text is the write-up.

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

Maths goes between `$...$` or `$$...$$` and is rendered with KaTeX when the site is built. Videos and other files a post links to go in `public/posts/<slug>/`.

## Deploying

Netlify builds the site with the settings in `netlify.toml`: it runs `npm run build` and publishes `dist/`.
