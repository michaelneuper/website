---
title: "How to Create Your Own Static Website"
date: 2022-12-03T19:39:46+02:00
categories: ['Tutorials']
tags: []
draft: false
---

Setting up your own static website can be a great way to showcase your personal brand, portfolio, or business online. 
In this post, we'll walk through the process of setting up a static website using Hugo as the static site generator and Netlify as the hosting service.

## Building The Site

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

## Hosting Your Site

Hosting a static website refers to the process of making a website accessible to the internet by storing its files on a web server. 
A static website is one that contains static content, meaning that the content does not change unless manually updated by the website owner. 
This is in contrast to a dynamic website, which generates content on the fly using server-side programming languages such as PHP or ASP.NET.

To host a static website, you need to sign up for a web hosting service that provides the necessary storage space and bandwidth to host your website. 
There are many web hosting providers available, each offering different plans and pricing options. S
ome of the most popular options include *shared hosting*, *VPS hosting*, and *dedicated hosting*.

One solution for hosting a static website is to use a platform like Netlify. 
Netlify is a cloud-based service that allows you to easily deploy and host static websites for free. 
It provides a simple interface for uploading your website files, and automatically takes care of the necessary tasks such as setting up DNS records and configuring a CDN to ensure fast loading times for your website.

In addition to hosting your static website for free, Netlify also offers a range of advanced features such as continuous deployment, split testing, and form handling. 
This makes it a great option for teams and individuals looking to quickly and easily host and manage their static websites.

To host a Hugo site on Netlify, you need to follow these steps:

1. Create a new repository on GitHub with the name of your site

2. On you local machine, navigate to the root directory of you Hugo site and run the following commands to create a new repository and push it to GitHub:

    ``` shell
    ## Add all files in the Hugo site to the Git repository
    $ git add .

    ## Commit the changes to the repository
    $ git commit -m "Initial commit of Hugo site"

    ## Add the GitHub repository as a remote to your local Git repository
    $ git remote add origin <GitHub repository URL>

    ## Push the Hugo site to the GitHub repository
    $ git push -u origin master
    ```

3. Once your Hugo site has been pushed to GitHub, you can connect your GitHub account to Netlify by signing in to Netlify and following the instructions on the Netlify website.

4. Once your GitHub account is connected to Netlify, you can set up Netlify to deploy your Hugo site by clicking the "New site from Git" button and selecting your Hugo site's repository from the list of available repositories.

5. In the next step, you need to configure the build settings for your Hugo site. This includes specifying the version of Hugo to use, the command to build your site, and the directory where the built site should be stored.

6. After configuring the build settings, you can click the "Deploy site" button to deploy your Hugo site to Netlify. Netlify will automatically build your site using Hugo and make it available at a unique URL. For now, you can access your site by visiting the URL provided by Netlify, but in the next section we will setup a custom domain.

That's it! Your Hugo site is now hosted on Netlify and available to the world.

## Getting a Custom Domain (Not Free)

Setting up a custom domain for your website involves purchasing a domain name and configuring it to point to your website's files on the web server. 
A domain name is the unique address that users can type in their web browser to access your website, such as www.google.com.

Purchasing a domain name typically costs money, as domain names are registered on a yearly basis and need to be renewed periodically to maintain ownership. 
The exact cost of a domain name can vary depending on the domain registrar and the specific top-level domain (TLD) you choose (e.g. .com, .net, .org, etc.).

There are many domain registrars available where you can purchase a domain name, such as GoDaddy, Namecheap, and Google Domains. 
When choosing a domain registrar, it's important to consider factors such as pricing, customer support, and additional services offered (such as privacy protection and email hosting).

Since we're already hosting a site on Netlify we can just purchase the domain from them. 
One advantage of purchasing a domain name from Netlify is that it makes the process of setting up your custom domain easier. 
Netlify provides a simple interface for purchasing and configuring your domain, and automatically sets up the necessary DNS records to point your domain to your website on Netlify's servers. A
dditionally, Netlify offers free SSL certificates for custom domains, which helps to secure your website and improve its ranking on search engines.


In conclusion, building your own website is a rewarding and empowering experience that allows you to share your ideas, passions, and creations with the world. 
By using a static site generator like Hugo, you can quickly and easily create a professional-looking website without needing to write any complex code.
Overall, building and hosting your own website is a great way to share your creativity and ideas with the world, and can be a fun and rewarding experience.
