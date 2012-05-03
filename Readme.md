# maximus GNOME Shell Extension

Description of what the extension does.

Screenshot of the extension.

Written 2012 by mathematical.coffee [mathematical.coffee@gmail.com](mailto:mathematical.coffee@gmail.com?subject=maximus%20question).
Project webpage: [at  bitbucket](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension).

---

# Installation

The easy way (recommended):

1. Download the .zip file on the [Downloads page](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/downloads).
2. Open `gnome-tweak-tool`, go to "Shell Extensions", "Install Extension" and select the .zip file.

Alternatively (developers?):

1. Checkout the repository: `hg clone https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension`
2. Update to the `3.2` or `3.4` branch (the `default` branch is **NOT** guaranteed to work!).
3. Copy the folder `maximus@mathematical.coffee.gmail.com` to `.local/share/gnome-shell/extensions`.
4. If on GNOME 3.2, use `dconf-editor` and modify the key `/org/gnome/shell/enabled-extensions` to include `'maximus@mathematical.coffee.gmail.com'`. 
If on GNOME 3.4, then just do `gnome-shell-extension-tool -e maximus@mathematical.coffee.gmail.com`.

All together now:

    hg clone https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension
    cd maximus-gnome-shell-extension
    # Use 'hg branches' to see what branches are available. They are GNOME versions it is compatible with.
    hg up 3.2 
    cp -r maximus@mathematical.coffee.gmail.com ~/.local/share/gnome-shell/extensions
    # if you have GNOME 3.4:
    gnome-shell-extension-tool -e maximus@mathematical.coffee.gmail.com
    # if you have GNOME 3.2:
    dconf read '/org/gnome/shell/enabled-extensions' | sed -r -e 's#\[(.+)\]#dconf write "/org/gnome/shell/enabled-extensions" [\1, '\'maximus@mathematical.coffee.gmail.com\'']#' | /bin/sh

---

# Branch Info (for developers)

* Branch 3.2 is compatible with GNOME 3.2 *and* GNOME 3.4, but doesn't have any fancy gsettings or UI for setting options: edit `extension.js` directly.
It is supposed to be stable.
* Branch 3.4 is meant to be for GNOME 3.4 witha fancy gsettings interface that ties in with `gnome-shell-extension-prefs`.
It is supposed to be stable.
* Default branch is not guaranteed to be stable at *any* commit.
