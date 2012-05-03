// Sample extension code, makes clicking on the panel show a message
const Mainloop = imports.mainloop;
const St = imports.gi.St;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const Main = imports.ui.main;

/* We don't automatically maximize all windows. 
 * Might build it in in the future if people really want it.
 * If you automatically maximize all windows, you need to have an exclude list
 * as in maximus-app.c
 */

/* This is how to remove decoration from maximised windows in gnome-shell:
 * http://www.webupd8.org/2011/05/how-to-remove-maximized-windows.html 
 *
 * Ideally (?) we'd listen to window state-changed events, and when the window 
 *  is maximised remove the frame, otherwise restore it.
 *
 * This thread from the mailing list says you can't destroy a window's frame
 * with mutter as is (2012-04), but you can modify your "mutter theme" to simulate it:
 * https://mail.gnome.org/archives/gnome-shell-list/2011-September/msg00136.html
 *
 * See also here for a python/gdk script that does it for the current active window.
 * http://askubuntu.com/questions/75284/remove-titlebar-from-maximized-terminal-window/75291#75291
 *
 * This complies with "Method 2" of the first link.
 *
 * Modify /usr/share/themes/Adwaita/metacity-1/metacity-theme-3.xml:
 *
 * Find "frame_geometry name-"max" and:
 * - add '  has_title="false" ' to it
 * - distance name="title_vertical_pad" modify paddings to 0
 * - border name="title_border" modify paddings to 0
 * etc
 *
 * So, this is not CSS. How to modify the XML?
 *
 * see user-theme extension
 * Main.setThemeStyleSheet(...) --> hmm this is still a css
 * Main.loadTheme()
 *
 * advanced settings: Window Theme. This *just* changes a gconf key, BAH
 * I don't think there's functionality for monkey patching the .XML file.
 * 
 *
 * Hmmm.
 *
 * 1. Use gdk/wnck for everything and basically re-implement maximus-app.c
 * 2. Copy current (metacity) theme to local, modify, change gconf, reload.
 *    /desktop/gnome/shell/windows theme
 * 3. Use wnck and change window type to a non-decorated one
 *
 * TODO: deal with user externally doing decorations (chrome): notify::decorated.
 *
 * Use gtk : set_decorated
 * or  gdk : set_decorations ?????
 * Gtk: http://developer.gnome.org/gtk3/stable/   Gimp toolkit
 * Gdk: http://developer.gnome.org/gdk3/stable/   Gimp Drawing kit
 * "GDK lies between X server and GTK+ library"
 *
 * Functionality of Screen etc seems to be in GDK not GTK
 *
 * On window opened (connect SCREEN to window-opened):
 * - if already undecorated: RETURN
 * - if already maximised: 
 *       remove decoration
 * - connect 'state-changed' with the function.
 *
 * CHECK: half-maximised windows??
 * State changed function:
 *     if not excluded:
 *         if it is fully maximised:
 *             if it's too large for the screen:
 *                 decorate & unmaximise
 *             else --> and it wasn't originally maximised!
 *                 undecorate
 *         else:
 *            enable window decorations 
 *
 *  Why would I use wnck and not gdk? gdk_window_set_keep_above etc?
 *
 */

const Gdk = imports.gi.Gdk;
// Put your extension initialization code here
function init(metadata) {
    global.log('Example extension initalized');

}

function enable() {
    global.log('Maximus enabled');

    // can do screen.get_active_window()
    let screen = Gdk.Screen.get_default();
    if ( screen ) {
        // list of all windows: ARGH longer than the second option!
        let winList = screen.get_toplevel_windows();
        // want winList[i].get_window_type() == Gdk.WindowType.WINDOW_TOPLEVEL
        // (possibly WINDOW_CHILD too? "child window used to implement GtkEntry")
        // err but there's barely any of those

        // NOTE: how do other apps get the window list?
        // wins[0].set_decorations
       
       // OPTION 2: doesn't return as many windows 
        let metaWorkspace = global.screen.get_active_workspace();
        let windows = metaWorkspace.list_windows();

    } else {
        global.log('scream and die, you have no default screen?!');
    }


       

}

function disable() {
    global.log('Example extension disabled');

}
