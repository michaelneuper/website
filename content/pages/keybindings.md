---
title: "Key Bindings"
---

This is an archive of the various key bindings/shortcuts that I use across different software/hardware.

# Keyboard

## Window Manager

### Basic Key Bindings
| **Key Binding**                              | **Action**            |
|-----------------------------------|----------------------------------|
| <kbd>super + enter</kbd>                     | spawm terminal        |
| <kbd>super + q</kbd>                         | close window          |
| <kbd>super + space</kbd>                     | show run launcher     |
| <kbd>super + m</kbd>                         | toggle monocle layout |
| <kbd>super + {h, j, k, l}</kbd>              | cycle through windows |
| <kbd>super + shift + {h, j, k, l}</kbd>      | move window           |
| <kbd>ctrl + alt + {h, j, k, l}</kbd>         | increase window size  |
| <kbd>ctrl + shift + alt + {h, j, k, l}</kbd> | decrease window size  |

### Window States
| **Key Binding**   | **State**               |
|-------------------|-------------------------|
| <kbd>super + t</kbd>         | tiled        |
| <kbd>super + shift + t</kbd> | pseudo tiled |
| <kbd>super + f</kbd>         | floating     |
| <kbd>super + shift + f</kbd> | fullscreen   |

### Window Flags
| **Key Binding**  | **Flag**            |
|------------------|---------------------|
| <kbd>super + ctrl + m</kbd> | marked   |
| <kbd>super + ctrl + x</kbd> | locked   |
| <kbd>super + ctrl + y</kbd> | sticky   |
| <kbd>super + ctrl + z</kbd> | private  |

### Basic Utilities
| **Key Binding**   | **Action**                                            |
|-------------------|-------------------------------------------------------|
| <kbd>super + x</kbd>         | lock the screen                            |
| <kbd>super + shift + x</kbd> | show powermenu                             |
| <kbd>prtsc</kbd>             | screenshot entire screen                   |
| <kbd>super + prtsc</kbd>     | select portion of the screen to screenshot |

### Basic Programs
| **Key Binding**   | **Program**                       |
|-------------------|-----------------------------------|
| <kbd>super + w</kbd>         | web browser            |
| <kbd>super + e</kbd>         | terminal file manager  |
| <kbd>super + shift + e</kbd> | graphical file manager |
| <kbd>super + d</kbd>         | doom emacs             |
| <kbd>super + c</kbd>         | calculator             |
| <kbd>super + v</kbd>         | vscode                 |

## Key Remaps

I use a program called [keyd](https://github.com/rvaiya/keyd) to remap some of the keys on my keyboard.
Here is my configuration:

```toml
[ids]
*

[main]
# Make shift key oneshot
shift = oneshot(shift)
# Remap capslock to esc when clicked and the nav profile when holded
capslock = overload(nav, esc)
# Remap esc to capslock
esc = capslock
# Remap right shift to ctrl
rightshift = rightcontrol

[nav:C]
# Remap left control + vim keys to navigation keys
h = left
j = down
k = up
l = right
```

# Mouse

I use the Redragon Perdition 2 MMO mouse.
It has 12 buttons on the side and allows for different profiles. 
I have each profile set to a different game/progam and a colour corresponding to that game/program.

This is what the mouse looks like:
![Redragon Mouse](/images/redragon_mouse.png)

This is my configuration:

|              | **Profiles**                                                                            |
|--------------|----------------------------|------------------------------|-----------------------------|
| **Button**   |**Profile 1 (Default)**     |**Profile 2 (Runescape)**     |**Profile 3 (Doom)**         |
| **1**        | <kbd>alt + leftarrow</kbd> | <kbd>space</kbd>             | <kbd>q</kbd> (*weapon*)     |
| **2**        | <kbd>ctrl</kbd>            | <kbd>shift</kbd>             | <kbd>f</kbd> (*glory kill*) |
| **3**        | <kbd>esc</kbd>             | <kbd>esc</kbd> (*inventory*) | <kbd>tab</kbd>              |
| **4**        | <kbd>ctl + c</kbd>         | <kbd>F1</kbd> (*combat*)     | <kbd>r</kbd> (*mod*)        |
| **5**        | <kbd>ctrl + v</kbd>        | <kbd>F5</kbd> (*prayer*)     | <kbd>g</kbd> (*chainsaw*)   |
| **6**        | <kbd>ctrl + z</kbd>        | <kbd>F6</kbd> (*spells*)     | <kbd>t</kbd> (*BFG*)        |
| **7**        | <kbd>super + e</kbd>       | <kbd>F2</kbd> (*skills*)     | <kbd>f</kbd> (*pickup*)     |
| **8**        | <kbd>super + b</kbd>       | <kbd>F3</kbd> (*quests*)     | <kbd>c</kbd> (*crouch*)     |
| **9**        | <kbd>alt + F4</kbd>        | <kbd>F4</kbd> (*equip*)      | <kbd>esc</kbd>              |
| **10**       | Decrease DPI                                                                            |
| **11**       | Increase DPI                                                                            |
| **12**       | Change Profile                                                                          |

# Koreader

I use a program called [koreader](https://koreader.rocks/) on my jailbroken Kindle Paperwhite (10th Gen).
This has a lot more features than the default reader program on the kindle including: epub support, sending books over the network, and way more.

These are some of my shortcuts:

|                | **Top Right (_Contents_)** | **Top Left (_Screen_)** | **Bottom Left (_Page_)** |
|----------------|----------------------------|-------------------------|--------------------------|
| **Tap**        | Table of Contents          | Toggle Frontlight       | Go to Previous Location  |
| **Double Tap** | Book Map                   | Toggle Dark Mode        | Bookmark Page            |
| **Hold**       | Page Browser               | Refresh Screen          | Toggle RTL Page Turning  |

# Wacom Tablet
<!-- ![Wacom Tablet](/images/wacom-tablet.jpg) -->
In progress
