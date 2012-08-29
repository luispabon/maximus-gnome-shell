const Gio = imports.gi.Gio;
const GMenu = imports.gi.GMenu;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Signals = imports.signals;

/* COMPATIBILITY */
// in GNOME 3.2 GObject.TYPE_STRING doesn't exist.
const G_TYPE_STRING = (GObject.TYPE_STRING ||
                       GObject.type_from_name('gchararray'));

/***************
 * Helper functions.
 *
 * Note:
 * GMenu.Tree  --> load_sync() to init, get_root_directory().iter() to iterate.
 * | Contains:
 * |- GMenu.TreeDirectory --> use .iter() to iterate through
 * |  |- .iter() to iterate through
 * |  |- .get_menu_id()
 * |  |- .get_name()
 * |  |- and so on...
 * |- GMenu.TreeEntry
 * |  |- .get_app_info()
 * |  |- .get_desktop_file_id()
 * |  |- and so on...
 ***************/

/* Get all nodes of a directory
 * (shell-app-system.c: get_flattened_entires_recurse)
 * @dir: a GMenu.TreeDirectory (example, .get_root_directory() of a GMenu.Tree)
 *
 * returns: an object with key `id` and value GMenu.TreeEntry, where the id
 * is the entry's .get_desktop_file_id().
 */
function getNodes(dir) {
    let entry,
        nodeType,
        entries,
        returnDict = {}, // dictionary. id: entry.
        iter = dir.iter();

    // loop through the directory recursing down directories until we reach
    // items.
    while ((nodeType = iter.next()) !== GMenu.TreeItemType.INVALID) {
        switch (nodeType) {
        case GMenu.TreeItemType.ENTRY:
            // add it to the return object, overwriting duplicates (if any)
            entry = iter.get_entry();
            returnDict[entry.get_desktop_file_id()] = entry;
            break;
        case GMenu.TreeItemType.DIRECTORY:
            // recurse into the directory, adding these results to our own
            // return object (any duplicates are overwritten):
            entries = getNodes(iter.get_directory());
            for (entry in entries) {
                if (entries.hasOwnProperty(entry)) {
                    returnDict[entry] = entries[entry];
                }
            }
            break;
        default: // SEPARATOR, HEADER, ALIAS. skip for now.
            break;
        }
    }
    return returnDict;
}

/* get all nodes from a tree */
function getTreeNodes(tree) {
    return getNodes(tree.get_root_directory());
}

/*************************************************************/
/* A wrapper around an object of [app desktop id] --> Gio.DesktopAppInfo that
 * remains up-to-date.
 *
 * let appslist = new AppsList();
 * // to iterate through apps
 * for (let id in appslist.apps) {
 *     // appslist.apps[id] is a Gio.DesktopAppInfo
 * }
 */
function AppsList() {
    this._init.apply(this, arguments);
}

AppsList.prototype = {
    _init: function () {
        // create a GMenu.Tree holding the applications menu.
        this.appsTree = new GMenu.Tree({
            menu_basename: 'applications.menu',
            flags: GMenu.TreeFlags.INCLUDE_NODISPLAY
        });

        // monitor changes in the tree so we can update appsList (i.e. when this
        // gets called the installed apps have changed)
        this.appsTree.connect('changed', Lang.bind(this, this._onTreeChanged));

        this.apps = {}; // desktop-id --> Gio.DesktopAppInfo

        // update this.appsList
        this._onTreeChanged();
    },

    _onTreeChanged: function () {
        // initialise appsTree
        if (!this.appsTree.load_sync()) {
            throw new Error("Failed to load apps...");
        }

        // new apps tree
        let newApps = getTreeNodes(this.appsTree);

        // look for apps in appsList that are not in newApps and remove them
        for (let id in this.apps) {
            if (!this.apps.hasOwnProperty(id)) {
                continue;
            }
            if (!newApps[id]) {
                delete this.apps[id];
            }
        }

        // add/update appsList from newApps
        for (let id in newApps) {
            if (!newApps.hasOwnProperty(id)) {
                continue;
            }
            let entry = newApps[id];

            if (this.apps[id] !== entry.get_app_info()) {
                // add the entry to appsList
                this.apps[id] = entry.get_app_info();
            }
        }
        this.emit('changed');
    },

    destroy: function () {
        this.apps = {};
        this.appsTree = null;
    }
};
Signals.addSignalMethods(AppsList.prototype);

function AppChooserTreeView() {
    this._init.apply(this, arguments);
}

AppChooserTreeView.prototype = {
    Columns: {
        APPID: 0,   // NOTE: we have to store the APPID in a separate column
        APPINFO: 1, // because this.appsTree contains the right ID, but
                    // appinfo.get_id() is NULL!
        ICON: 2,
        DISPLAY_NAME: 3
    },

    _init: function (treeviewParams) {

        /* set up list store */
        this.list = new Gtk.ListStore();
        this.list.set_column_types([
            G_TYPE_STRING,
            Gio.AppInfo,
            Gio.Icon,
            G_TYPE_STRING
        ]);

        /* set up treeview (main widget) */
        this.widget = new Gtk.TreeView(
            treeviewParams ||
            {
                hexpand: true,
                vexpand: true,
                headers_visible: false
            }
        );
        this.widget.model = this.list;
        this.list.set_sort_column_id(this.Columns.DISPLAY_NAME, Gtk.SortType.ASCENDING);
        this.widget.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

        /* set up renderers for the treeview */
        let col = new Gtk.TreeViewColumn({
            expand: true,
            title: "Applications"
        }),
            iconRenderer = new Gtk.CellRendererPixbuf(),
            textRenderer = new Gtk.CellRendererText({editable: false});
        col.pack_start(iconRenderer, false);
        col.pack_start(textRenderer, true);
        col.add_attribute(iconRenderer, 'gicon', this.Columns.ICON);
        col.add_attribute(textRenderer, 'text', this.Columns.DISPLAY_NAME);
        this.widget.append_column(col);

        /* create the apps list that provides the data for the treeview */
        this.appsList = new AppsList();
        this.appsList.connect('changed', Lang.bind(this, this._updateList));
        this.apps = this.appsList.apps;

        this._updateList();
    },

    get_app_info: function () {
        let [ok, dummy, iter] = this.widget.get_selection().get_selected();
        if (ok) {
            return [this.list.get_value(iter, this.Columns.APPID),
                    this.list.get_value(iter, this.Columns.APPINFO)];
        } else {
            return null;
        }
    },

    _updateList: function () {
        this.list.clear();
        let apps = this.apps;
        for (let id in apps) {
            if (!apps.hasOwnProperty(id)) {
                continue;
            }
            let iter = this.list.append(),
                app = apps[id],
                icon = app.get_icon();
            //list.set_value(iter, this.Columns.APPID, id);
            this.list.set_value(iter, this.Columns.APPID, id);
            this.list.set_value(iter, this.Columns.APPINFO, app);
            if (icon) {
                this.list.set_value(iter, this.Columns.ICON, icon);
            }
            this.list.set_value(iter, this.Columns.DISPLAY_NAME,
                    app.get_display_name());
        }
    },

    destroy: function () {
        this.appsList.destroy();
        this.widget.destroy();

        this.list = null;
        this.widget = null;
        this.apps = null;
        this.appsList = null;
    }
};

function AppChooserDialog() {
    this._init.apply(this, arguments);
}

AppChooserDialog.prototype = {
    _init: function (parent) {
        let dialog = this.dialog = new Gtk.Dialog({
            title: "Choose an application",
            transient_for: parent,
            modal: true, // <-- if this is true the dialog won't be decorated
                         // even if you .set_decorated(true)
            destroy_with_parent: true,
            decorated: true
        });
        // centre buttons in the dialog
        dialog.get_action_area().set_layout(Gtk.ButtonBoxStyle.CENTER);

        let area = dialog.get_content_area();
        // add some spacing between widgets
        area.spacing = 10;
        // add some padding between the dialog and its contents
        dialog.set_border_width(10);

        dialog.add_button(Gtk.STOCK_OK, Gtk.ResponseType.OK);
        dialog.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
        dialog.set_default_response(Gtk.ResponseType.OK);

        // create a label with the title
        this.title = new Gtk.Label({
            label: dialog.title,
            hexpand: true,
            halign: Gtk.Align.START
        });
        this.title.set_line_wrap(true);
        area.add(this.title);

        // create the app chooser
        this.appTreeView = new AppChooserTreeView({
            hexpand: true,
            vexpand: true,
            headers_visible: false
        });
        let treeview = this.appTreeView.widget;

        // add it to the dialog in a scroll window
        let sw = new Gtk.ScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            hexpand: true,
            vexpand: true
        });

        sw.add_with_viewport(treeview);
        sw.set_min_content_height(300);
        sw.show_all();
        area.add(sw);

        // pass through some signals
        treeview.connect('row-activated', Lang.bind(this, function () {
            this.emit('response', Gtk.ResponseType.OK);
        }));
        dialog.connect('response', Lang.bind(this, function (dlg, id) {
            this.emit('response', id);
        }));
        dialog.connect('close', Lang.bind(this, function () {
            this.emit('response', Gtk.ResponseType.CANCEL);
        }));
    },

    /* pass through some functions */
    // Similar to GtkAppChooserDialog
    set_heading: function (title) {
        this.dialog.title = title;
        this.title.label = title;
    },

    get_app_info: function () {
        return this.appTreeView.get_app_info();
    },

    // return the AppChooserTreeView object
    get_widget: function () {
        return this.appTreeView;
    },

    show_all: function () {
        this.dialog.show_all();
    },

    destroy: function () {
        this.dialog.destroy();
        this.appTreeView.destroy();

        this.appTreeView = null;
        this.dialog = null;
    }
};
Signals.addSignalMethods(AppChooserDialog.prototype);
