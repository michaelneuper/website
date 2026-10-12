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

| Path                           | What it is                                                                   |
|--------------------------------|------------------------------------------------------------------------------|
| `src/pages/index.astro`        | the home page                                                                |
| `src/pages/posts/[slug].astro` | the page every post uses                                                     |
| `src/layouts/Base.astro`       | head, top line, modeline and `*Help*`, shared by all pages                   |
| `src/content/posts/`           | the posts, in Markdown                                                       |
| `src/scripts/`                 | the JavaScript: `main.js` for the home page, `page.js` for the others        |
| `src/styles/style.css`         | all the styles, including the themes                                         |
| `public/`                      | files served as they are: fonts, favicon, GPG key, `robots.txt`, post videos |

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
