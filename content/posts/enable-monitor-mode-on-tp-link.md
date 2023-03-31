---
title: "Enable Monitor Mode on TP-Link TL-WN722N"
date: 2022-12-16T13:07:05+02:00
categories: ['Tutorials']
tags: ['hacking', 'wifi']
draft: false
---

#  TP-Link TL-WN722N _v1 vs v2/v3_

The TP-Link TL-WN722N is a wireless network interface controller (NIC) that allows a computer to connect to a wireless network.
There are three versions of this NIC: v1, v2, and v3. While all three versions are similar in many ways, there are some notable differences between them.

One of the main differences between the TP-Link TL-WN722N v1 and v2/v3 is the chipset they use. 
- The v1 version uses a `Atheros AR9271` chipset
- The v2/v3 versions use a `Realtek RTL8188EUS` chipset

The Atheros chip supports monitor mode and packet injection out of the box, but the Realtek chip requires changing the drivers.

# Enabling Monitor Mode

## v1

Run the following command:
``` shell
sudo airmon-ng start wlan0
```

That's it, you should see that your card is in monitor mode when running the following:
``` shell
sudo iwconfig | grep "Mode"
```

## v2/v3

### Upgrade your system

On Debian-based systems (like Kali):
``` shell
sudo apt update && apt upgrade
```

On Arch-based systems (like Blackarch):
``` shell
sudo pacman -Syu
```

Then reboot:
``` shell
sudo reboot
```

### Install headers

Debian-based:
``` shell
sudo apt install linux-headers-$(uname -r)
```

Arch-based:
``` shell
sudo pacman -S install linux-headers-$(uname -r)
```

### Change the kernel module

Remove the previous driver module:
``` shell 
sudo rmmod r8188eu.ko
```

Blacklist the old module:
``` shell
sudo echo "blacklist r8188eu" > "/etc/modprobe.d/realtek.conf"
```

Clone the new driver:
``` shell
git clone https://github.com/aircrack-ng/rtl8188eus
```

Install the new driver module:
``` shell
cd rtl8188eus
```
``` shell
make
```
``` shell
sudo make install
```

Enable the new module:
``` shell
sudo modprobe 8188eu
```

Reboot:
``` shell
sudo reboot
```

### Enable monitor mode

Kill all airmon-ng processes:
``` shell
sudo airmon-ng check kill
```

Set adapter to monitor mode:
``` shell
sudo iwconfig wlan0 mode monitor
```

Bring the interface up:
``` shell
sudo ifconfig wlan0 up
```

Test to see if packet injection works:
``` shell
sudo aireplay-ng --test wlan0
```
