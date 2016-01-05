# Maximus GNOME Shell Extension

The Maximus GNOME Shell Extension attempts to emulate the [Maximus](https://launchpad.net/maximus) package for the Ubuntu Netbook Remix.

That is, it removes decoration (i.e. the title bar) from maximised windows, saving vertical real estate. For example, Google Chrome does this by default.
Useful for netbooks with small screens.

| With Maximus  | Without Maximus |
|:-----:|:-----:|
| ![Using Maximus](http://cdn.bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads/maximus.png) | ![Without Maximus (title bar shows)](http://cdn.bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads/no-maximus.png) |

NOTE: with the titlebar of a window hidden, you may find it difficult to unmaximise/move a window.
In this case, I recommend either remembering your system's keyboard shortcut for un/maximising a window (e.g. Alt+F10 on Fedora), or use the [Window Options GNOME shell extension](https://bitbucket.org/mathematicalcoffee/window-options-gnome-shell-extension) which adds a drop-down menu to the title bar in the top panel with these options (shameless plug, I wrote that one). You might also like the [Window Buttons extension](https://github.com/biox/Gnome-Shell-Window-Buttons-Extension) which adds the close, minimize, maximize buttons to the top panel.

### Known issues

* When restarting gnome-shell with a Qt app maximized (e.g. Texmaker), it will no longer redecorate on unmaximize. Only occurs *after restarting* gnome-shell, not when disabling/re-enabling. Not something I can reliably fix as I cannot detect whether a window is from a Qt app from the extension (and even then I cannot detect whether it was intended to be undecorated or not).
* You cannot maximize and instantly unmaximize Qt apps (e.g. with keybindings); the unmaximize won't work until you wait a tiny bit (milliseconds) after the maximize.
  Qt apps seem to take a while to regain focus after being un/redecorated.

### Changelog (see `Changelog` file for further details):

* v12 (e.g.o), v2.4 (tagged):
 + This version is only compatible with Gnome 3.18.
* v11 (e.g.o), v2.3 (tagged):
 + Imported to new Github repo due to original being unmaintained.
 + Make compatible up to Gnome 3.16.
 + When dragging to unmaximize, the window does not redecorate until it is dropped. Prevents "breaking" the drag (#7).
* v10 (e.g.o), v2.2 (tagged):
 + changed the default method to hide the titlebar to hopefully be more stable, if the user is not using the Ambiance or Radiance themes (the old `set_hide_titlebar` bookmark)
 + much code cleaning
 + various misc. fixes.
* v4 (e.g.o), v1.3 (tagged):
 + added blacklists/whitelists
 + fixed bug where Maximus wouldn't work on windows with non EN-utf8 characters in the title (bug #4)
 + made it harder to get stuck in fullscreen mode (particularly thunderbird)
 + better behaviour when maximizing from fullscreen to halfscreen.

Written 2012 by mathematical.coffee [mathematical.coffee@gmail.com](mailto:mathematical.coffee@gmail.com?subject=maximus%20question).
Project webpage: [at  bitbucket](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension).

---
# Configuration

On GNOME 3.4+: use the prefs widget. On GNOME 3.2, modify `extension.js`:

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

To add apps to the blacklist or whitelist, add them to the `APP_LIST` variable in `extension.js`.
You have to add the window's application name (like 'thunderbird.desktop') for it to work.

To see what an application's window manager class is, open up an instance of it.
Then press `Alt + F2` and type `lg`. Go to the 'Windows' tab and note the `app` of the window in question (press Esc to exit).

Add this in to `APP_LIST`.

---

# Installation

## The easy way (recommended):
One-click install from [extensions.gnome.org](https://extensions.gnome.org/extension/354/maximus/)!

## From this website:
1. Download the .zip file on the [Downloads page](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads).
2. Open `gnome-tweak-tool`, go to "Shell Extensions", "Install Extension" and select the .zip file.

## From the repository:

If using GNOME 3.4, 3.6, or 3.8, use the `gnome3.4` branch.
Otherwise (GNOME 3.2), use the `stable` branch.

```
hg clone ssh://hg@bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension
hg up gnome3.4 # or `stable` if on GNOME 3.2
cd maximus-gnome-shell-extension
make # <-- VERY IMPORTANT
cp -r maximus@mathematical.coffee.gmail.com ~/.local/share/gnome-shell/extensions
# enable maximus if you haven't already:
gnome-shell-extension-tool -e maximus@mathematical.coffee.gmail.com
```

Now restart gnome-shell.

---

# Branch Info (for developers)

* 'stable' branch works with GNOME 3.2+. No fancy prefs widget.
* 'gnome3.4' branch: GNOME3.4+ with prefs widget.
* 'default' branch: the gnome3.4+ development branch (has prefs.js). i.e. dev branch for 'gnome3.4'.
* 'polyglot-dev' branch: the gnome3.2+ development branch (same as above but no prefs.js). i.e. dev branch for 'stable'.
