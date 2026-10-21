---
title: "Turn Your Window Manager Into a Desktop Environment"
date: 2022-12-11T21:31:27+02:00
tags: [linux]
cat: sw
draft: false
---

<!-- TODO add notification daemon-->

A desktop environment like GNOME, KDE Plasma or Xfce is a set of programs that come together: a window manager, a panel, a login screen, a settings app, a file manager, and the background services that let them talk to each other.
A window manager on its own only places and draws windows.
Everything else is up to you.

That means more setting up, but you choose every part, and the result is usually lighter and faster than a full desktop.
Most of the parts are small programs you start when you log in, so it's less work than it sounds.

## The window manager

The window manager decides where windows go and lets you move, resize, close and switch between them.
Tiling window managers arrange windows so they fill the screen without overlapping.
Stacking (or floating) ones let windows overlap, the way a desktop environment does.

These are some of the popular ones:

- i3 is a manual tiling window manager: you choose where the next window goes, and any group of windows can be switched to tabs or a stack.
  It's configured in a plain text file, comes with its own bar, and has very good documentation, which makes it a common first choice.
- bspwm tiles windows automatically, splitting the screen in two each time a window opens.
  It doesn't handle the keyboard at all: a separate program, sxhkd, runs your keybindings, and bspwm's own config is a shell script.
- dwm, from suckless, is small and fast.
  You configure it by editing its C source (`config.h`) and recompiling, and it has a built-in bar that shows your tags, the layout and a line of status text you set yourself.
- xmonad is written in Haskell and configured in Haskell too.
  That makes it very flexible, as long as you're happy to learn a bit of the language.
- Openbox is a stacking window manager, the one LXDE is built on.
  It has right-click menus and themes and is configured with XML files.
  It has no panel, so it's often paired with tint2.

If you've never used a tiling window manager, start with i3.
If you'd rather keep overlapping windows, try Openbox.

## Starting your session

A display manager is the login screen that starts your session once you sign in.
LightDM, GDM (GNOME's) and SDDM (KDE Plasma's) are the common ones, and any of them can start a window manager instead of a desktop environment.

You can also do without one: log in on the console and run `startx`, which runs your `~/.xinitrc`.
For i3 that file can be a single line:

```shell
exec i3
```

The programs in the rest of this post have to be started with your session too.
Put them in `~/.xinitrc` before the `exec` line, or in your window manager's own autostart, like an `exec` line in i3's config or `bspwmrc` for bspwm.

## Compositor

On X, window managers don't composite: there's no transparency, no shadows or fading, and some programs tear while they redraw.
A compositor adds all of that, and none of the window managers above has one built in.

picom is the usual choice.
It started as a fork of compton, which is no longer maintained.
xcompmgr is a much simpler one.
Start it with your session:

```shell
picom &
```

On an old or slow machine you can leave the compositor out.

## The other pieces

### Wallpaper

nitrogen is a small program with a window: open it and pick an image.
To set the same image again when you log in, run:

```shell
nitrogen --restore
```

feh is an image viewer that can also set the wallpaper from the command line:

```shell
feh --bg-fill /path/to/image.jpg
```

feh saves the command it used to `~/.fehbg`, so run that file when you log in.

### Bar

A bar shows your workspaces and whatever status you want next to them: the time, the battery, the volume, the network.

- i3 comes with i3bar, which reads its status line from i3status or i3blocks.
- dwm has its own bar, and dwmblocks fills in its status text in small blocks that each update on their own.
- xmobar is the bar most xmonad setups use.
- polybar works with any window manager and has ready-made modules for i3 and bspwm workspaces.
- lemonbar is the minimal option: a bar that shows whatever text you pipe into it.

### Application launcher

Without a start menu, you open programs with a launcher.
dmenu, also from suckless, lists the programs that match as you type and runs the one you pick; i3's default config uses it.
rofi does the same with more options, and can also switch between windows and run commands.
albert is a launcher with plugins, closer to Spotlight on a Mac.

### System tray

Some programs put an icon in the system tray, like nm-applet for NetworkManager or a volume or Bluetooth applet.
polybar and i3bar can show a tray.
If your bar can't, stalonetray or trayer gives you one on its own.

### Polkit

Polkit decides whether a program you run as yourself may do something that needs root, like mounting a drive or changing network settings, and asks for your password when it needs to.
The asking is done by an authentication agent, which every desktop environment starts for you and a window manager doesn't.
Without one, the password prompt never appears and the action fails.

Start an agent with your session, for example GNOME's:

```shell
/usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1 &
```

The path depends on your distribution, and [the Arch wiki's page on polkit](https://wiki.archlinux.org/title/Polkit) lists the agents you can use.

## Customizing it

Everything about a window manager is in its configuration.
i3 has its own plain text format, bspwm uses a shell script (and sxhkd's file for the keys), Openbox uses XML, awesome uses Lua, and dwm and xmonad are configured in their own source code.

The things you'll probably change first:

- colors, fonts, borders and the gaps between windows
- keybindings, like a key to open a terminal or lock the screen
- where new windows go, which get focus, and which programs float instead of tiling
- what starts when you log in

Each window manager's documentation covers its options, and the Arch wiki has a page on each of the ones above.

## Window manager or desktop environment?

A window manager uses less memory and CPU than a desktop environment, starts faster, and does only what you configure it to do.
You can also mix programs from different desktops, like Xfce's file manager, Thunar, with nothing else from Xfce.

What you give up is the integration.
Nothing comes set up for you: the settings app, mounting USB drives when you plug them in, the network applet and the password prompts are all things you add yourself, and you notice a missing one the first time you need it.
Getting it all working takes a while, and you'll keep adjusting it long after.

If you like knowing what every program on your machine is for, a window manager is a good fit.
If you'd rather everything worked straight after installing, stay with a desktop environment.
