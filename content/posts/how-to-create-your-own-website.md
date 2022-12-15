---
title: "How to Create Your Own Static Website in Under an Hour"
date: 2022-12-03T19:39:46+02:00
tags: ['website']
draft: false
---

Setting up your own static website can be a great way to showcase your personal brand, portfolio, or business online. 
In this post, we'll walk through the process of setting up a static website using Hugo as the static site generator and Netlify as the hosting service.

# Building the site

First, let's talk about what a static website is and why it's a good choice for many people. 
A static website is a website that is built using only HTML, CSS, and JavaScript files. 
These files are served to the user's web browser as-is, without the need for any server-side processing. 
This makes static websites fast, secure, and easy to maintain.

Hugo is a popular open-source static site generator that makes it easy to create and manage a static website. 
It has a simple, easy-to-use interface and comes with a wide range of customizable templates and themes.

To get started with Hugo, you'll need to download and install Hugo on your computer.

1. Once you have Hugo installed, you can create a new website by running the following command in your terminal:
    ``` shell
    hugo new site SITE-NAME
    ```
    This will create a new Hugo project in the current directory.

2. Next, install git and initialize the directory as a git repository: 
    ``` shell
    git init
    ```
    Initializing the directory as a git repository is a useful way to keep track of changes and it will also be needed later when we upload our site to GitHub.

3. Download a theme for you website from https://themes.gohugo.io/. A hugo theme is a template that defines the look and feel of your site. Add a theme to your site by running the following command in the root directory of your site:
    ``` shell
    git submodule add https://github.com/THEME_NAME/ themes/
    ```
    This will create a folder in the `/themes/` directory where your theme is stored.

3. Open the `config.toml` file and edit according to your theme.

4. Create content for your website by using the `hugo new` command. e.g.
    ``` shell
    hugo new posts/my-first-post.md
    ```
    This will create a markdown file under the `/content/posts/` directory where you can edit your content. Hugo uses Markdown files for content, which makes it easy to write and format your content using a simple, readable syntax.

5. Run the following command in the directory of your site:
    ``` shell
    hugo server
    ```
    Hugo will build a local version of your site that you can view by going to `http://localhost:1313/` inside your browser. Hugo will also automatically show any changes you make to the site, no need to rerun the command or refresh the page.

# Hosting your site

