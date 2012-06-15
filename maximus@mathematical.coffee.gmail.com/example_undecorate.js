const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

// Works.
Gtk.init(null);
var curwin = Gdk.Screen.get_default().get_active_window();
curwin.set_decorations(0);
curwin.maximize();
curwin.process_all_updates();
