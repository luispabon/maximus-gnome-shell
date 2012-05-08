const Mainloop = imports.mainloop;
const St = imports.gi.St;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const Main = imports.ui.main;


/* We don't automatically maximise all windows. 
 * Might build it in in the future if people really want it.
 * If you automatically maximise all windows, you need to have an exclude list
 * as in maximus-app.c
 *
 * TODO:
 * - windows maximised in one dimension only?
 * - multiple windows same name?
 * - listen to window-new in case windows *start* maximised: YES need this.
 * - Window manager warning: Treating resize request of legacy application 0x221d769 as a fullscreen request
 */

/* 
 * This is how to remove decoration from maximised windows in gnome-shell:
 * http://www.webupd8.org/2011/05/how-to-remove-maximised-windows.html 
 *
 * One way to do it is to edit the Metacity window theme for the
 * 'frame_geometry name="max"' element, however this can't be done
 * on-the-fly in GNOME-shell as the window theme isn't to do with the 
 * shell theme.
 *
 */

const Util = imports.misc.util;
const Meta = imports.gi.Meta;

let maxID=null;
let minID=null;
let changeWorkspaceID=null;
let workspaces=[];
let onetime=null;

/*
 * If I use set_decorations(0) from within the GNOME shell extension (i.e.
 *  from within the compositor process), the window dies.
 * If I use the same code but use `gjs` to run it, the window undecorates
 *  properly.
 *
 * Hence I have to make some sort of external call to do the undecoration.
 * See the included .js and .py files for examples of how to do this with
 *  GDK. Alternatively, we can use xprop.
 *
 * The .js version needs 'gjs' binary which is installed with GNOME-shell.
 * The .py version needs 'pygobject' which is *not* installed by default.
 * To reduce the number of files needed to be bundled with the extension &
 *  executed, we'll use 'xprop'.
 *
 * We can use xprop using the window's title to identify the window, but
 *  prefer to use the window's X ID (in case the title changes between
 *  the signal being fired & command being sent).
 * You can get the window's X ID with wnck but not with the current Metacity
 *  gobject introspection!
 * 
 * For now I'll use the title to avoid loading in wnck.
 *
 * (Also: windowActor['x-window'] returns the X ID of the window manager's *frame*
 *  for the window, not for the window itself.)
 *
 * See here for xprop usage for undecoration: 
 * http://xrunhprof.wordpress.com/2009/04/13/removing-decorations-in-metacity/
 */
function onMaximise(shellwm, actor) {
    if ( !actor ) // then how did I get here?
        return;

    let titleOfMaximised = actor.get_meta_window().get_title();
    global.log('onMaximise: ' + titleOfMaximised);
    log('onMaximise: ' + titleOfMaximised);

    // if not fully maximised, return.
    if ( actor.get_meta_window().get_maximized() != 
        (Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL) ) {
            return;
    }


    /* Undecorate with xprop */
    let cmd = ['xprop', '-name', titleOfMaximised,
               '-f', '_MOTIF_WM_HINTS', '32c',
               '-set', '_MOTIF_WM_HINTS',
                '0x2, 0x0, 0x0, 0x0, 0x0'];
    /* WM_HINTS: see MwmUtil.h from OpenMotif source (cvs.openmotif.org),
     *  or rudimentary documentation here:
     * http://odl.sysworks.biz/disk$cddoc04sep11/decw$book/d3b0aa63.p264.decw$book
     *
     * Struct { flags, functions, decorations, input_mode, status }.
     * Flags: what the hints are for. (functions, decorations, input mode and/or status).
     * Functions: minimize, maximize, close, ...
     * Decorations: title, border, all, none, ...
     * Input Mode: modeless, application modal, system model, ..
     * Status: tearoff window.
     */
    Util.spawn(cmd);
}

/* TODO: don't redecorate if it wasn't decorated in the first place! */
/* Add a flag to the window with original decorations? */
function onUnmaximise(shellwm, actor) {
    if ( !actor ) // then how did I get here?
        return;

    let titleOfMaximised = actor.get_meta_window().get_title();
    global.log('onUnmaximise: ' + titleOfMaximised);
    log('onUnmaximise: ' + titleOfMaximised);

    /* Undecorate with xprop: 1 == DECOR_ALL */
    let cmd = ['xprop', '-name', titleOfMaximised,
               '-f', '_MOTIF_WM_HINTS', '32c',
               '-set', '_MOTIF_WM_HINTS',
                '0x2, 0x0, 0x1, 0x0, 0x0'];
    Util.spawn(cmd);
}

function onWindowAdded(ws, win) {
    onMaximise(null, win.get_compositor_private());
}

function onChangeWorkspace() {
    let i,ws;
    for ( i=0; i<workspaces.length; ++i ) {
        workspaces[i].disconnect(workspaces[i]._MaximusWindowAddedId);
    }

    workspaces = [];
    for ( i=0; i<global.screen.n_workspaces; ++i ) {
        ws = global.screen.get_workspace_by_index(i);
        workspaces[i] = global.screen.get_workspace_by_index(i);
        ws._MaximusWindowAddedId = ws.connect('window-added',
                                              onWindowAdded);
    }
}


function init() {
}

function enable() {
    global.log('Maximus enabled');

    /* go through already-maximised windows & undecorate. 
     * This needs a delay as the window list is not yet loaded
     *  when the extension is loaded (or so it seems).
     */

    // TODO: is this just active workspace? WHAT ABOUT the others?
    // FROM StatusTitleBar:
    maxID = global.window_manager.connect('maximize',onMaximise);
    minID = global.window_manager.connect('unmaximize',onUnmaximise);
    changeWorkspaceID = global.screen.connect('notify::n-workspaces',
                            onChangeWorkspace);
    // connect up window-added.
    onChangeWorkspace();

    onetime = GLib.timeout_add_seconds(0,1,function() { 
        let winActList = global.get_window_actors();
        for ( let i=0; i<winActList.length; i++ ) {
            onMaximise(null, winActList[i]);
        }
    });

}

function disable() {
    global.window_manager.disconnect(maxID);
    global.window_manager.disconnect(minID);
    global.window_manager.disconnect(changeWorkspaceID);

    /* disconnect window-added from workspaces */
    let i;
    for ( i=0; i<workspaces.length; i++ ) {
        workspaces[i].disconnect(workspaces[i]._MaximusWindowAddedId);
    }
    workspaces=[];

    /* redecorate undecorated windows we screwed with */
    // TODO: modal windows/ chrome ? How to tell *we* undecorated them?
    Mainloop.source_remove(onetime);
    let winActList = global.get_window_actors();
    for ( i=0; i<winActList.length; i++ ) {
        if ( !winActList[i].get_meta_window().decorated ) {
            onUnmaximise(null,winActList[i]);
        }
    }
}

