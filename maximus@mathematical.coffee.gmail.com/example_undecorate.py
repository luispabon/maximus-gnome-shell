# NOTE: this uses PyGtk, which is at the moment 2.2.40 and works
# The lookingGlass version uses v 3.0 of Gdk

VER2240 = False
if ( VER2240 ):
    import gtk.gdk as Gdk

    curwin = Gdk.screen_get_default().get_active_window()
    curwin.set_decorations(0)
    # It works (Gdk.__version__ == 2.24.0)

else:
    # Take two: try with python-gobject
    # Gdk.__path__ : /usr/lib/girepository-1.0/Gdk-3.0.typelib
    from gi.repository import Gdk

    # OOHHH YEAH
    curwin = Gdk.Screen.get_default().get_active_window()
    # curwin.freeze_updates() # <-- not necessary in python, no difference in gjs
    curwin.set_decorations(0)
    curwin.maximize()
    curwin.process_all_updates()
    # after a while it shuts down
