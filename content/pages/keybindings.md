---
title: "Key Bindings"
---

This is an archive of the various key bindings/shortcuts that I use across different software/hardware.

## Keyboard

### Window Manager

#### Basic Key Bindings
| **Key Binding**               | **Action**            |
|-------------------------------|-----------------------|
| <kbd>s-RET</kbd>              | spawn terminal        |
| <kbd>s-q</kbd>                | close window          |
| <kbd>s-SPC</kbd>              | show run launcher     |
| <kbd>s-m</kbd>                | toggle monocle layout |
| <kbd>s-{h, j, k, l}</kbd>     | cycle through windows |
| <kbd>s-S-{h, j, k, l}</kbd>   | move window           |
| <kbd>C-M-{h, j, k, l}</kbd>   | increase window size  |
| <kbd>C-S-M-{h, j, k, l}</kbd> | decrease window size  |

#### Window States
| **Key Binding**   | **State**               |
|-------------------|-------------------------|
| <kbd>s-t</kbd>    | tiled                   |
| <kbd>s-t</kbd>    | pseudo tiled            |
| <kbd>s-S-f</kbd>  | floating                |
| <kbd>s-f</kbd>    | fullscreen              |

#### Window Flags
| **Key Binding**  | **Flag** |
|------------------|----------|
| <kbd>s-C-m</kbd> | marked   |
| <kbd>s-C-x</kbd> | locked   |
| <kbd>s-C-y</kbd> | sticky   |
| <kbd>s-C-z</kbd> | private  |

#### Basic Utilities
| **Key Binding**    | **Action**                                 |
|--------------------|--------------------------------------------|
| <kbd>s-x</kbd>     | lock the screen                            |
| <kbd>s-S-x</kbd>   | show powermenu                             |
| <kbd>PRNTSC</kbd>  | screenshot entire screen                   |
| <kbd>s-PRTSC</kbd> | select portion of the screen to screenshot |

#### Basic Programs
| **Key Binding**  | **Program**            |
|------------------|------------------------|
| <kbd>s-w</kbd>   | web browser            |
| <kbd>s-e</kbd>   | terminal file manager  |
| <kbd>s-S-e</kbd> | graphical file manager |
| <kbd>s-d</kbd>   | doom emacs             |
| <kbd>s-c</kbd>   | calculator             |
| <kbd>s-v</kbd>   | vscode                 |

### Key Remaps

I use a program called [keyd](https://github.com/rvaiya/keyd) to remap some of the keys on my keyboard.
Here is my configuration:

``` shell
[ids]
*

[main]
# Make shift key oneshot
shift = oneshot(shift)
# Remap capslock to esc when clicked and the nav profile when holded
capslock = overload(nav, esc)
# Remap esc to capslock
esc = capslock
# Remap right shift to control
rightshift = rightcontrol

[nav:C]
# Remap left control + vim keys to navigation keys
h = left
j = down
k = up
l = right
```

## Mouse

I use the Redragon Perdition 2 MMO mouse.
It has 12 buttons on the side and allows for different profiles. 
I have each profile set to a different game/progam and a colour corresponding to that game/program.

This is what the mouse looks like:

![Redragon Mouse](/images/redragon_mouse.png)

This is my configuration:

|            | **Profiles**            |                              |                             |
|------------|-------------------------|------------------------------|-----------------------------|
| **Button** | **Profile 1 (Default)** | **Profile 2 (Runescape)**    | **Profile 3 (Doom)**        |
| **1**      | <kbd>M-left</kbd>       | <kbd>SPC</kbd>               | <kbd>q</kbd> (*weapon*)     |
| **2**      | <kbd>C</kbd>            | <kbd>S</kbd>                 | <kbd>f</kbd> (*glory kill*) |
| **3**      | <kbd>ESC</kbd>          | <kbd>ESC</kbd> (*inventory*) | <kbd>TAB</kbd>              |
| **4**      | <kbd>C-c</kbd>          | <kbd>F1</kbd> (*combat*)     | <kbd>r</kbd> (*mod*)        |
| **5**      | <kbd>C-v</kbd>          | <kbd>F5</kbd> (*prayer*)     | <kbd>g</kbd> (*chainsaw*)   |
| **6**      | <kbd>C-z</kbd>          | <kbd>F6</kbd> (*spells*)     | <kbd>t</kbd> (*BFG*)        |
| **7**      | <kbd>s-e</kbd>          | <kbd>F2</kbd> (*skills*)     | <kbd>f</kbd> (*pickup*)     |
| **8**      | <kbd>s-b</kbd>          | <kbd>F3</kbd> (*quests*)     | <kbd>c</kbd> (*crouch*)     |
| **9**      | <kbd>M-F4</kbd>         | <kbd>F4</kbd> (*equip*)      | <kbd>ESC</kbd>              |
| **10**     | Decrease DPI            |                              |                             |
| **11**     | Increase DPI            |                              |                             |
| **12**     | Change Profile          |                              |                             |

## Koreader

I use a program called [koreader](https://koreader.rocks/) on my jailbroken Kindle Paperwhite (10th Gen).
This has a lot more features than the default reader program on the kindle including: epub support, sending books over the network, and way more.

These are some of my shortcuts:

|                | **Top Right (_Contents_)** | **Top Left (_Screen_)** | **Bottom Left (_Page_)** |
|----------------|----------------------------|-------------------------|--------------------------|
| **Tap**        | Table of Contents          | Toggle Frontlight       | Go to Previous Location  |
| **Double Tap** | Book Map                   | Toggle Dark Mode        | Bookmark Page            |
| **Hold**       | Page Browser               | Refresh Screen          | Toggle RTL Page Turning  |

## Wacom Tablet
<!-- ![Wacom Tablet](/images/wacom-tablet.jpg) -->
In progress
