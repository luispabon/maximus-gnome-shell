# Maximus GNOME Shell Extension

The Maximus GNOME Shell Extension attempts to emulate the [Maximus](https://launchpad.net/maximus) package for the Ubuntu Netbook Remix.

That is, it removes decoration (i.e. the title bar) from maximised windows, saving vertical real estate. For example, Google Chrome does this by default.
Useful for netbooks with small screens.

| With Maximus  | Without Maximus |
|:-----:|:-----:|
| ![Using Maximus](http://cdn.bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads/maximus.png) | ![Without Maximus (title bar shows)](http://cdn.bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads/no-maximus.png) |

NOTE: with the titlebar of a window hidden, you may find it difficult to unmaximise/move a window.
In this case, I recommend either remembering your system's keyboard shortcut for un/maximising a window (e.g. Alt+F10 on Fedora), or use the [Window Options GNOME shell extension](https://bitbucket.org/mathematicalcoffee/window-options-gnome-shell-extension) which adds a drop-down menu to the title bar in the top panel with these options (shameless plug, I wrote that one). You might also like the [Window Buttons extension](https://github.com/biox/Gnome-Shell-Window-Buttons-Extension) which adds the close, minimize, maximize buttons to the top panel.

### Changelog (see `Changelog` file for further details):
v4 (e.g.o), v1.3 (tagged):

* added blacklists/whitelists
* fixed bug where Maximus wouldn't work on windows with non EN-utf8 characters in the title (bug #4)
* made it harder to get stuck in fullscreen mode (particularly thunderbird)
* better behaviour when maximizing from fullscreen to halfscreen.

Written 2012 by mathematical.coffee [mathematical.coffee@gmail.com](mailto:mathematical.coffee@gmail.com?subject=maximus%20question).   
Project webpage: [at  bitbucket](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension).

---
# Configuration

## Half-maximised windows
By default, only fully-maximised windows are undecorated.
If you also want to undecorate half-maximised windows, edit the line in `extension.js` to change this line:

    const undecorateHalfMaximised = false;

to this (change the `false` to `true`):

    const undecorateHalfMaximised = true;

## Blacklists and whitelists
From dev-version 1.3 onwards (v4 on e.g.o), there is support for a window blacklist/whitelist.

If a window is on the blacklist, then all windows *except* those in the blacklist will be affected by Maximus.
If a window is on the whtielist, then *only* the windows in the whitelist will be affected by Maximus.

To set whether the list is a blacklist or whitelist, modify this line at the top of `extension.js`:

    /*** Whitelists/blacklists ***/
    const BLACKLIST = true; // if it's a white list, change this to FALSE

To add apps to the blacklist or whitelist, add them to the `WMLIST` variable in `extension.js`.
You have to add the window's window manager class to the list for it to work.

To see what an application's window manager class is, open up an instance of it.
Then press `Alt + F2` and type `lg`. Go to the 'Windows' tab and note the `wmclass` of the window in question (press Esc to exit).

Add this in to `WMLIST`.

---

# Installation

## The easy way (recommended):
One-click install from [extensions.gnome.org](https://extensions.gnome.org/extension/354/maximus/)!

## From this website:
1. Download the .zip file on the [Downloads page](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads).
2. Open `gnome-tweak-tool`, go to "Shell Extensions", "Install Extension" and select the .zip file.

---

# Branch Info (for developers)

* 'Stable' branch works with GNOME 3.2 and GNOME 3.4. No fancy gsettings or UI for setting options (this extension doesn't have options for the moment).
* 'gnome3.4' branch: GNOME3.4+ with prefs widget.
* 'default' branch: I plan to make this the gnome3.4+ development branch.
* 'set_hide_titlebar' bookmark: an attempt to set the `_GDK_HIDE_TITLEBAR_WHEN_MAXIMIZED` window hint instead of using `_MOTIF_WM_HINTS`.
Works but depends on your window theme (in particular Ubuntu ones do not respect the hint), so abandoned (for now).
