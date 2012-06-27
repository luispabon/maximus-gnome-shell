# Maximus GNOME Shell Extension

The Maximus GNOME Shell Extension attempts to emulate the [Maximus](https://launchpad.net/maximus) package for the Ubuntu Netbook Remix.

That is, it removes decoration (i.e. the title bar) from maximised windows, saving vertical real estate. For example, Google Chrome does this by default.
Useful for netbooks with small screens.

| With Maximus  | Without Maximus |
|:-----:|:-----:|
| ![Using Maximus](http://cdn.bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads/maximus.png) | ![Without Maximus (title bar shows)](http://cdn.bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads/no-maximus.png) |

NOTE: with the titlebar of a window hidden, you may find it difficult to unmaximise/move a window.
In this case, I recommend either remembering your system's keyboard shortcut for un/maximising a window (e.g. Alt+F10 on Fedora), or use the [Window Options GNOME shell extension](https://bitbucket.org/mathematicalcoffee/window-options-gnome-shell-extension) which adds a drop-down menu to the title bar in the top panel with these options (shameless plug, I wrote that one).

Written 2012 by mathematical.coffee [mathematical.coffee@gmail.com](mailto:mathematical.coffee@gmail.com?subject=maximus%20question).   
Project webpage: [at  bitbucket](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension).

---
# Configuration

By default, only fully-maximised windows are undecorated.
If you also want to undecorate half-maximised windows, edit the line in `extension.js` to change this line:

    const undecorateHalfMaximised = false;

to this (change the `false` to `true`):

    const undecorateHalfMaximised = true;

---

# Installation

## **[NEW!]** The easy way (recommended):
One-click install from [extensions.gnome.org](https://extensions.gnome.org/extension/354/maximus/)!

## From this website:
1. Download the .zip file on the [Downloads page](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads).
2. Open `gnome-tweak-tool`, go to "Shell Extensions", "Install Extension" and select the .zip file.

## Alternatively (developers?):

1. Checkout the repository: `hg clone https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension`
2. Update to the `stable` branch (the `default` branch is **NOT** guaranteed to work!).
3. Copy the folder `maximus@mathematical.coffee.gmail.com` to `.local/share/gnome-shell/extensions`.
4. If on GNOME 3.2, use `dconf-editor` and modify the key `/org/gnome/shell/enabled-extensions` to include `'maximus@mathematical.coffee.gmail.com'`. 
If on GNOME 3.4, then just do `gnome-shell-extension-tool -e maximus@mathematical.coffee.gmail.com`.

All together now:

    hg clone https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension
    cd maximus-gnome-shell-extension
    hg up stable
    cp -r maximus@mathematical.coffee.gmail.com ~/.local/share/gnome-shell/extensions
    # if you have GNOME 3.4:
    gnome-shell-extension-tool -e maximus@mathematical.coffee.gmail.com
    # if you have GNOME 3.2:
    dconf read '/org/gnome/shell/enabled-extensions' | sed -r -e 's#\[(.+)\]#dconf write "/org/gnome/shell/enabled-extensions" "[\1, '\'maximus@mathematical.coffee.gmail.com\'']"#' | /bin/sh

---

# Branch Info (for developers)

* 'Stable' branch works with GNOME 3.2 and GNOME 3.4. No fancy gsettings or UI for setting options (this extension doesn't have options for the moment).
* 'Default' branch - where development happens. It is *not* guaranteed to be stable at *any* commit.
