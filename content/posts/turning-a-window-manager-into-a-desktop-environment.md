---
title: "The Ultimate Guide to Building Your Own Desktop Environment"
date: 2022-12-11T21:31:27+02:00
tags: ["linux", "rice"]
---

<!-- TODO add notification daemon-->

# Introduction

If you're a Linux user, you're probably familiar with the concept of window managers and desktop environments.
These programs are responsible for managing the appearance and functionality of your desktop, providing the tools and features that you need to interact with your operating system.

But what's the difference between a window manager and a desktop environment? 
And why might someone want to turn a window manager into a desktop environment?

In this blog post, we'll explore these questions and more. 
I'll provide a step-by-step guide on how to turn a window manager into a desktop environment, along with tips and tricks for customizing your window manager and making it more user-friendly.
We'll also discuss the benefits and drawbacks of using a window manager as a desktop environment, and compare popular window managers and desktop environments.

So let's dive in and learn more about the fascinating world of window managers and desktop environments!

# Turning a window manager into a desktop environment

If you want to turn a window manager into a desktop environment, the first thing you need to do is install the necessary components. 
This typically includes the window manager itself, a display manager, and additional utilities and applications.

Let's explore some of these components:

## Window Manager

A window manager is a program that manages the placement and appearance of windows on a computer's desktop.
It is responsible for providing the "frame" around each window, allowing the user to move, resize, and minimize windows. 
A window manager also provides the ability to switch between windows and to tile them on the desktop in various ways.

There are many different window managers available for Linux and other operating systems. 
Some of the most popular ones include the following:

1. **i3**: i3 is a tiling window manager that is designed to be fast and efficient. It is easy to configure and customize, and it provides a number of advanced features for power users.

2. **Openbox**: Openbox is a lightweight and flexible window manager that is easy to customize. It provides a minimalistic interface and a wide range of options for advanced users.

3. **bspwm**: bspwm is a tiling window manager that is based on binary space partitioning. It is lightweight and efficient, and it provides a number of advanced features, such as automatic tiling and support for multiple monitors.

3. **dwm**: dwm is a dynamic window manager that is written in the C programming language. It is fast and lightweight, and it provides a number of advanced features, such as support for multiple monitors and a customizable status bar.

4. **xmonad**: xmonad is a tiling window manager that is written in the Haskell programming language. It is highly configurable and customizable, and it provides a number of advanced features, such as support for multiple workspaces and automatic tiling.

Each window manager has its own unique features and capabilities, and the right one for you will depend on your personal preferences and needs.
Some of the pros and cons of using different window managers are as follows:

- **i3**: i3 is a powerful and customizable window manager that is well-suited for users who want a highly efficient and flexible desktop environment. It has a steep learning curve, but once you master it, you can achieve a high level of productivity. Some of the pros of using i3 are its tiling capabilities, its support for multiple workspaces, and its ability to run on low-end hardware. Some of the cons are its lack of a built-in panel or application launcher, and its reliance on keyboard shortcuts.

- **Openbox**: Openbox is a lightweight and flexible window manager that is easy to customize. It provides a minimalistic interface and a wide range of options for advanced users. Some of the pros of using Openbox are its low resource usage, its support for desktop icons, and its ability to integrate with other desktop environments. Some of the cons are its lack of tiling capabilities, its reliance on external utilities for certain features, and its lack of a built-in system tray.

- **bspwm**: bspwm is a tiling window manager that is based on binary space partitioning. It is lightweight and efficient, and it provides a number of advanced features, such as automatic tiling and support for multiple monitors. Some of the pros of using bspwm are its low resource usage, its advanced tiling capabilities, and its support for multiple monitors. Some of the cons are its lack of a built-in panel or application launcher, and its reliance on external utilities for certain features.

- **dwm**: dwm is a dynamic window manager that is written in the C programming language. It is fast and lightweight, and it provides a number of advanced features, such as support for multiple monitors and a customizable status bar. Some of the pros of using dwm are its low resource usage, its fast performance, and its customizable status bar. Some of the cons are its lack of a built-in panel or application launcher, and its reliance on keyboard shortcuts.

- **xmonad**: xmonad is a tiling window manager that is written in the Haskell programming language. It is highly configurable and customizable, and it provides a number of advanced features, such as support for multiple workspaces and automatic tiling. Some of the pros of using xmonad are its advanced tiling capabilities, its support for multiple workspaces, and its high level of configurability. Some of the cons are its steep learning curve, its lack of a built-in panel or application launcher, and its reliance on external utilities for certain features.

## Display Manager

A display manager is a program that manages the login and display of the desktop environment on a computer. 
It is responsible for providing the login screen, allowing the user to enter their username and password, and then starting the desktop environment and managing its display.

Some common examples of display managers include LightDM, GDM, and SDDM. 
LightDM is a cross-platform display manager that is lightweight and customizable. 
GDM is the default display manager on the GNOME desktop environment, and it provides a user-friendly login screen and a range of options for advanced users. 
SDDM is the default display manager on the KDE desktop environment, and it provides a modern and attractive login screen.

When you install a desktop environment on your computer, it typically includes a default display manager. 
However, you can also choose to install and use a different display manager if you prefer. 
For example, if you are using the Xfce desktop environment, you could choose to use LightDM instead of the default XDM display manager.

## Compositor

A compositor is a program that is responsible for combining the outputs of multiple applications and displaying them on the screen.
It is typically used to provide advanced graphical effects, such as transparency, animations, and 3D transformations.

On Linux, a compositor is typically used in conjunction with a window manager to provide a desktop environment. 
The window manager is responsible for managing the placement and appearance of windows on the desktop, while the compositor provides the graphical effects. 
Some window managers, such as xmonad and i3, include a built-in compositor, while others, such as Openbox, dwm and bspwm, require the use of an external compositor.

There are many compositors available for Linux, and the right one for you will depend on your personal preferences and needs. 
Some popular compositors include compton, picom, and xcompmgr. Compton is a feature-rich compositor that provides a wide range of options and effects, picom is a lightweight and efficient compositor, and xcompmgr is a simple compositor that provides basic graphical effects.

To choose a compositor, you can consider the following factors:

1. **Features**: Different compositors provide different sets of features and capabilities. Consider which features are most important to you, and choose a compositor that provides them.

2. **Performance**: Compositors can have a significant impact on the performance of your desktop environment. If you are using a low-end computer or you have a lot of applications running, you may want to choose a lightweight compositor that uses fewer resources.

3. **Compatibility**: Some compositors are compatible with only certain window managers or desktop environments. If you are using a specific window manager or desktop environment, make sure the compositor you choose is compatible with it.

## Additional Utilities

### Wallpaper Setter

You can use a program such as nitrogen or feh to set your wallpaper.
Nitrogen and feh are two popular programs that allow you to browse and select an image to use as your wallpaper, and then set it as the background for your desktop.

To use nitrogen or feh to set your wallpaper, follow these steps:

1. Install nitrogen or feh on your system. You can use your package manager to install the program, or you can download and compile the source code from the program's website.

2. Run nitrogen or feh. This will open a window that allows you to browse and select an image to use as your wallpaper.

3. Browse to the location of the image you want to use as your wallpaper, and select it.

4. Once you have selected the image, click on the "Set as wallpaper" button (in nitrogen) or the "Apply" button (in feh) to set the image as your wallpaper.

5. The selected image will now be displayed as your wallpaper.

6. Add a line to your startup script to set the wallpaper. 
If you're using nitrogen add: 
```shell
nitrogen --restore
```
If you're using feh add:
```shell
feh --bg-scale /path/to/image.jpg
```

### Bar

A bar on Linux is a program that displays information on the desktop, such as the current time and date, the system load, and the status of various system services. 
A bar is typically used in conjunction with a window manager or desktop environment, and it provides a convenient way to access important information without needing to open a separate application.

There are many bars available for Linux, and the right one for you will depend on your personal preferences and the desktop environment you are using. 
Some popular bars include polybar, lemonbar, i3bar, xmobar, and dwmblocks. 
These bars are designed to be used with specific desktop environments or window managers, and they provide a range of features and customization options.

For example, polybar and lemonbar are general-purpose bars that can be used with any desktop environment or window manager. 
They provide a wide range of features, such as support for multiple monitors and custom colors and fonts, and they are highly customizable. 
i3bar is the default bar for the i3 window manager, and it provides a minimalistic interface and support for displaying information from i3 modules. 
xmobar is the default bar for the xmonad window manager, and it provides a customizable interface and support for displaying information from xmonad plugins. 
dwmblocks is the default bar for the dwm window manager, and it provides a minimalist interface and support for displaying information from dwm status commands.

To choose a bar, you can consider the following factors:

1. **Compatibility**: Some bars are designed to be used with specific desktop environments or window managers. If you are using a specific desktop environment or window manager, make sure the bar you choose is compatible with it.

2. **Features**: Different bars provide different sets of features and capabilities. Consider which features are most important to you, and choose a bar that provides them.

3. **Customization**: Some bars are highly customizable, allowing you to change the appearance and behaviour of the bar to suit your preferences. If you want a bar that you can tailor to your specific needs, choose a bar that provides a high degree of customization. Polybar is a popular choice.

### Application Launcher

An application launcher is a program that allows you to quickly search for and launch applications on your Linux system. 
An application launcher typically provides a search bar or a menu that allows you to enter the name of the application you want to launch, and it displays a list of matching applications that you can select from.

Some popular application launchers include rofi, dmenu, and albert. 

1. **Rofi** is a flexible and customizable application launcher that allows you to search for and launch applications, as well as perform a range of other actions, such as opening a terminal or running a command. 

3. **Dmenu** is a simple and lightweight application launcher that provides a minimalistic interface and support for fuzzy search.

4. **Albert** is a fast and efficient application launcher that uses a customizable keyboard shortcut to launch applications and perform other actions.

### System Tray

A system tray (also known as a notification area) is a part of the graphical user interface (GUI) on Linux (and other operating systems) that displays icons for system and application notifications. 
The system tray is typically located at the bottom or side of the screen, and it provides a convenient way for applications to display important information and notifications without disrupting the user's work.

For example, the system tray might display an icon for a network manager application, which shows the current network status and allows the user to manage their network connections. 
It might also display an icon for a battery manager application, which shows the current battery level and allows the user to manage their power settings.

### Polkit

Polkit (formerly known as PolicyKit) is a framework for defining and managing administrative policies on Linux. 
It provides a mechanism for controlling access to system-wide privileges, and it allows users to perform privileged tasks without needing to log in as the root user.

Polkit consists of a number of components, including a daemon (polkitd), a command-line tool (polkit), and a library (libpolkit). 
The polkit daemon runs in the background and listens for requests from applications that need to perform privileged tasks. 
The polkit command-line tool allows administrators to manage and configure polkit policies.
The libpolkit library provides a convenient interface for developers to integrate polkit into their applications.

See [the arch wiki](https://wiki.archlinux.org/title/Polkit) for more information.

# Customizing your window manager

Most window managers on Linux allow for customization to some extent. 
Customizing your window manager can allow you to tailor the appearance and behaviour of your desktop environment to suit your preferences and needs.

To customize your window manager, you will need to edit the window manager's configuration files. 
These files are typically written in a scripting language, such as Lua or Shell, and they control the various aspects of the window manager's behaviour and appearance.

Here are some examples of the types of things you can customize in your window manager:

- **Appearance**: You can customize the appearance of your window manager by changing the colors, fonts, and other visual elements. For example, you might change the color of the window borders, the font used for window titles, or the size of gaps between windows.

- **Keybindings**: You can customize the keybindings of your window manager to define which keys perform which actions. For example, you might bind the "Alt + Tab" keys to switch between windows, or the "Super + L" keys to lock the screen.

- **Behaviour**: You can customize the behaviour of your window manager to control how windows are managed and displayed. For example, you might change the default layout of windows on the screen, or the way windows are focused when they are opened.

- **Autostart**: You can customize the autostart of your window manager to define which applications are automatically launched when you log in. For example, you might specify that your web browser, email client, and music player are automatically started when you log in.

To customize your window manager, you will need to edit the appropriate configuration files and specify the desired changes. 
The exact steps for doing this will depend on the specific window manager you are using. 
You can find instructions for customizing your window manager in the documentation or online forums for your window manager.

# Benefits and drawbacks

There are both benefits and drawbacks to using a window manager instead of a full desktop environment on Linux.

As said before, a window manager is a program that provides the basic functions for managing windows on the desktop, such as opening, closing, minimizing, and maximizing windows. 
A full desktop environment, on the other hand, is a complete graphical user interface (GUI) that includes not only a window manager, but also a range of other applications and utilities, such as a taskbar, a system tray, a file manager, and a desktop background.

Here are some of the benefits of using a window manager instead of a full desktop environment on Linux:

- **Lightweight**: Window managers are typically much lighter and more efficient than full desktop environments. This means they use fewer system resources, such as memory and CPU, and they can run on lower-powered hardware.

- **Customizable**: Window managers are typically highly customizable, allowing users to tailor the appearance and behavior of their desktop environment to their preferences. This is because window managers typically have simple, modular architectures, with configuration files that are easy to edit and modify.

- **Flexible**: Window managers are typically more flexible than full desktop environments, allowing users to mix and match different applications and utilities from different desktop environments. For example, a user might use the window manager from one desktop environment, but the file manager from another.
Here are some of the drawbacks of using a window manager instead of a full desktop environment on Linux:

- **Less user-friendly**: Window managers are typically less user-friendly than full desktop environments, because they do not include many of the applications and utilities that users expect in a GUI. This can make it more difficult for new users to get started with a window manager, and it can limit the functionality of the desktop environment.

- **Less integrated**: Window managers are typically less integrated than full desktop environments, because they do not include many of the applications and utilities that are designed to work together. This can lead to a less cohesive and consistent user experience, and it can make it more difficult to perform certain tasks.

- **More complex**: Window managers are typically more complex than full desktop environments, because they require the user to manually configure and manage many of the components of the desktop environment. This can be a challenge for inexperienced users, and it can require more time and effort to set up and maintain a window manager.

Overall, whether to use a window manager or a full desktop environment on Linux depends on your personal preferences and needs. 
Some users may prefer the lightweight, customizable, and flexible nature of window managers, while others may prefer the user-friendly, integrated, and simple nature of full desktop environments.
