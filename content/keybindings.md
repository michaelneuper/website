---
title: "Key Bindings"
date: 2022-12-12T22:15:03+02:00
categories: []
tags: []
---

This is an archive of the various key bindings/shortcuts that I use across different software/hardware.

# Keyboard

## Window Manager

### Basic Key Bindings
| **Key Binding**                   | **Action**            |
|-----------------------------------|-----------------------|
| super + enter                     | spawm terminal        |
| super + q                         | close window          |
| super + space                     | show run launcher     |
| super + m                         | toggle monocle layout |
| super + {h, j, k, l}              | cycle through windows |
| super + shift + {h, j, k, l}      | move window           |
| ctrl + alt + {h, j, k, l}         | increase window size  |
| ctrl + shift + alt + {h, j, k, l} | decrease window size  |

### Window States
| **Key Binding**   | **State**    |
|-------------------|--------------|
| super + t         | tiled        |
| super + shift + t | pseudo tiled |
| super + f         | floating     |
| super + shift + f | fullscreen   |

### Window Flags
| **Key Binding**  | **Flag** |
|------------------|----------|
| super + ctrl + m | marked   |
| super + ctrl + x | locked   |
| super + ctrl + y | sticky   |
| super + ctrl + z | private  |

### Basic Utilities
| Key Binding       | Action                                     |
|-------------------|--------------------------------------------|
| super + x         | lock the screen                            |
| super + shift + x | show powermenu                             |
| prtsc             | screenshot entire screen                   |
| super + prtsc     | select portion of the screen to screenshot |

### Basic Programs
| **Key Binding**   | **Program**            |
|-------------------|------------------------|
| super + w         | web browser            |
| super + e         | terminal file manager  |
| super + shift + e | graphical file manager |
| super + d         | doom emacs             |
| super + c         | calculator             |
| super + v         | vscode                 |

## Key Remaps

I use a program called [keyd](https://github.com/rvaiya/keyd) to remap some of the keys on my keyboard.
Here is my configuration:

```toml
[ids]
*

[main]
# Remap modifiers to oneshot keys
shift = oneshot(shift)
capslock = overload(nav, esc)
esc = capslock
rightshift = rightcontrol

[nav:C]
# Remap leftcontrol to vim keys
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

| **Profiles** |                       |                         |                    |
|--------------|-----------------------|-------------------------|--------------------|
| **Button**   |**Profile 1 (Default)**|**Profile 2 (Runescape)**|**Profile 3 (Doom)**|
| **1**         | alt + leftarrow      | space                   | q (*weapon*)       |
| **2**         | ctrl                 | shift                   | f (*glory kill*)   |
| **3**         | esc                  | esc (*inventory*)       | tab                |
| **4**         | ctl + c              | F1 (*combat*)           | r (*mod*)          |
| **5**         | ctrl + v             | F5 (*prayer*)           | g (*chainsaw*)     |
| **6**         | ctrl + z             | F6 (*spells*)           | t (*BFG*)          |
| **7**         | super + e            | F2 (*skills*)           | f (*pickup*)       |
| **8**         | super + b            | F3 (*quests*)           | c (*crouch*)       |
| **9**         | alt + F4             | F4 (*equip*)            | esc                |
| **10**        | Decrease DPI                                                        |
| **11**        | Increase DPI                                                        |
| **12**        | Change Profile                                                      |

# Wacom Tablet

# Koreader