// Sample extension code, makes clicking on the panel show a message
const Mainloop = imports.mainloop;
const St = imports.gi.St;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const Main = imports.ui.main;

/* We don't automatically maximise all windows. 
 * Might build it in in the future if people really want it.
 * If you automatically maximise all windows, you need to have an exclude list
 * as in maximus-app.c
 */

/* This is how to remove decoration from maximised windows in gnome-shell:
 * http://www.webupd8.org/2011/05/how-to-remove-maximised-windows.html 
 *
 * Ideally (?) we'd listen to window state-changed events, and when the window 
 *  is maximised remove the frame, otherwise restore it.
 *
 * This thread from the mailing list says you can't destroy a window's frame
 * with mutter as is (2012-04), but you can modify your "mutter theme" to simulate it:
 * https://mail.gnome.org/archives/gnome-shell-list/2011-September/msg00136.html
 *
 * See also here for a python/gdk script that does it for the current active window.
 * http://askubuntu.com/questions/75284/remove-titlebar-from-maximised-terminal-window/75291#75291
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
const GdkX11 = imports.gi.GdkX11;
const Wnck = imports.gi.Wnck;

let maxID=null;
let minID=null;

// BAH these make the windows disappear!
/*
 * NOTE: if I convert a wnck window (get_xid()) to a gdk one, .unmaximise etc work        --> CORRECT XID
 * If I convert a *metacity* window (/actor) via actor['x-window'] to gdk, they DON'T work --> INCORRECT XID
 * Gnome-shell mailing list: Can't get XID of metacity window.
 * Will have to use wnck/get current/verify against actor + import OR gdk get current
 * --> then use gdk set hints
 */
function onMaximise(shellwm, actor) {
    let titleOfMaximised = actor.get_meta_window().get_title();
    global.log('onMaximise: ' + titleOfMaximised);
    log('onMaximise: ' + titleOfMaximised);

    /* Get Wnck version of actor (NOTE: why not just use Gdk.Screen.get_default().get_active_window()?) */
    let cur_win = getWnckWindowForActor(actor);

    if ( !cur_win ) {
        global.log("Could't find wnck window with title " + titleOfMaximised);
        log("Could't find wnck window with title " + titleOfMaximised);
        return;
    }

    /* convert to Gdk window */
    cur_win = GdkX11.X11Window.foreign_new_for_display( Gdk.Display.get_default(),
            cur_win.get_xid() );
    
    if ( !cur_win ) {
        // probably something like Chrome
        return;
    }

    /* Do undecoration */
    // TODO: do not undecorate if it's larger than screen.
    // NOTE: set_decorations( 0 ) kills the window - it disappears. why? That's what Iwant.
    // "Most window managers honor a decorations hint of 0 to disable all decorations, 
    // BUT very few honor all possible combinations of bits.
    cur_win.set_decorations( Gdk.WMDecoration.BORDER );
    cur_win.process_updates(true); // or curr_win.flush() ?

    // note: need to unmaximise/maximise first?
    //Gdk.WMDecoration: ALL BORDER RESIZEH TITLE MENU MINIMIZE MAXIMIZE
}

function onUnmaximise(shellwm, actor) {
    let titleOfMaximised = actor.get_meta_window().get_title();
    global.log('onUnmaximise: ' + titleOfMaximised);
    log('onUnmaximise: ' + titleOfMaximised);

    /* Get Wnck version of actor */
    let cur_win = getWnckWindowForActor(actor);

    if ( !cur_win ) {
        global.log("Could't find wnck window with title " + titleOfMaximised);
        log("Could't find wnck window with title " + titleOfMaximised);
        return;
    }


    /* convert to Gdk window */
    cur_win = GdkX11.X11Window.foreign_new_for_display( Gdk.Display.get_default(),
            cur_win.get_xid() );
    
    if ( !cur_win ) {
        // probably something like Chrome
        return;
    }

    /* Do redecoration */
    // NOTE: what if the window is normally undecorated ???
    cur_win.set_decorations( Gdk.WMDecoration.ALL );
    cur_win.process_updates(true);
}

function getWnckWindowForActor( actor ) {
    // find the WNCK version of the window (?!?!)
    // What if the title changes (like you change tab instantly!)
    // How do I compare some sort of ID?
    let winList = Wnck.Screen.get_default().get_windows();
    let cur_win = null;
    let titleOfMaximised = actor.get_meta_window().get_title();

    for ( let i=0; i<winList.length; i++ ) {
        if ( winList[i].get_name() == titleOfMaximised ) {
            cur_win = winList[i];
            break;
        }
    }

    return(cur_win);
}

function init() {
}

function enable() {
    global.log('Maximus enabled');

    // TODO: is this just active workspace? WHAT ABOUT the others?
    // FROM StatusTitleBar:
    maxID = global.window_manager.connect('maximize',onMaximise);
    minID = global.window_manager.connect('unmaximize',onUnmaximise);

}

function disable() {
    global.window_manager.disconnect(maxID);
    global.window_manager.disconnect(minID);


    // TODO: need to redecorate windows we'v screwed with:
    // Do we really need to go through wnck?
    let winList = Wnck.Screen.get_default().get_windows();
    let curwin;
    let maximised,decorated,decoration;

    for ( let i=0; i<winList.length; i++ ) {
        curwin = GdkX11.X11Window.foreign_new_for_display( Gdk.Display.get_default(),
                winList[i].get_xid() );

        // see if we manually decorated it..
        // TODO: see if *we* decorated it or someone else: set tag?
        [decorated,decoration] = curwin.get_decorations();
        if ( decorated && decoration != Gdk.WMDecoration.ALL ) {
            // looks like if the window is maximised I have to unmaximise/remaxmise
            // to have the redraw happen: process_updates & flush don't do it!
            maximised = winList[i].is_maximized();
            if ( maximised ) {
                winList[i].unmaximize();
            }
            curwin.set_decorations( Gdk.WMDecoration.ALL );
            if ( maximised ) {
                winList[i].maximize();
            }
        }
    }
}

