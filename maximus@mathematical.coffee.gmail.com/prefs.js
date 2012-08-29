/** Credit:
 *  taken from the gnome shell extensions repository at
 *  git.gnome.org/browse/gnome-shell-extensions
 */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const AppChooserDialog = Me.imports.appChooserDialog;

const UNDECORATE_HALF_MAXIMIZED_KEY = 'undecorate-half-maximized';
const IS_BLACKLIST_KEY = 'is-blacklist';
const BLACKLIST_KEY = 'app-list';

function init() {
    Convenience.initTranslations();
}

function LOG(msg) {
    //log(msg);
}
/*
 * A Gtk.ListStore with the convenience of binding one of the columns to
 * a GSettings strv column.
 *
 * Modified from git.gnome.org/gnome-shell-extensions auto-move-windows prefs.js
 *
 * In particular, 'key' is the strv gsettings key, and 'keyColumnIndex' is the
 * column index we will get the values for this key from.
 */
const Columns = {
    APPID: 0,
    ICON: 1,
    DISPLAY_NAME: 2
};
const ListModel = new GObject.Class({
    Name: 'Maximus.MaximusListModel',
    GTypeName: 'MaximusListModel',
    Extends: Gtk.ListStore,

    //Columns: Columns,

    _init: function (settings, key, keyColumnIndex, params) {
        this.parent(params);
        this._settings = settings;
        this._strvKey = key;
        this.set_column_types([
            GObject.TYPE_STRING, Gio.Icon, GObject.TYPE_STRING
        ]);
        this._keyColumnIndex = keyColumnIndex;
        this._preventChanges = false; // a lock.

        this._reloadFromSettings();

        this.connect('row-changed', Lang.bind(this, this._onRowChanged));
        this.connect('row-inserted', Lang.bind(this, this._onRowInserted));
        this.connect('row-deleted', Lang.bind(this, this._onRowDeleted));
    },

    /* attempt to lock the store, returning TRUE if we succeeded and FALSE
     * if it was already locked
     */
    lock: function () {
        if (this._preventChanges) {
            return false;
        }
        this._preventChanges = true;
        return true;
    },

    /* unlock the store to allow future changes */
    unlock: function () {
        this._preventChanges = false;
    },

    /* query whether the store is locked */
    is_locked: function () {
        return this._preventChanges;
    },

    _reloadFromSettings: function () {
        if (this.lock()) {
            LOG('reloadFromSettings');
            let newNames = this._settings.get_strv(this._strvKey);
            let [ok, iter] = this.get_iter_first();
            while (ok) {
                ok = this.remove(iter);
            }

            for (let i = 0; i < newNames.length; i++) {
                let id = newNames[i],
                    appInfo = Gio.DesktopAppInfo.new(id);
                if (!appInfo) {
                    continue;
                }
                iter = this.append();
                this.set(
                    iter,
                    [Columns.APPID, Columns.ICON, Columns.DISPLAY_NAME],
                    [id, appInfo.get_icon(), appInfo.get_display_name()]
                );
            }
            this.unlock();
        } else {
            LOG('tried to reload from settings but it was locked');
        }
    },

    _onRowChanged: function (self, path, iter) {
        if (this.lock()) {
            LOG('changing row');
            let index = path.get_indices()[0],
                names = this._settings.get_strv(this._strvKey);
            // skip blanks
            names = names.filter(function (str) { return str.trim().length; });
            // append to end:
            index = Math.min(index, names.length);
            names[index] = this.get_value(iter, this._keyColumnIndex);
            LOG('names: ' + names);

            this._settings.set_strv(this._strvKey, names);
            this.unlock();
        } else {
            LOG('tried to change row but it was locked');
        }
    },

    _onRowInserted: function (self, path, iter) {
        if (this.lock()) {
            LOG('inserting row');
            let index = path.get_indices()[0];
            let names = this._settings.get_strv(this._strvKey);
            let label = this.get_value(iter, this._keyColumnIndex) || '';
            names.splice(index, 0, label);

            this._settings.set_strv(this._strvKey, names);
            this.unlock();
        } else {
            LOG('tried to insert row but it was locked');
        }
    },

    _onRowDeleted: function (self, path) {
        if (this.lock()) {
            LOG('deleting row');
            let index = path.get_indices()[0];
            let names = this._settings.get_strv(this._strvKey);

            if (index >= names.length) {
                return;
            }

            names.splice(index, 1);

            // compact the array
            for (let i = names.length - 1; i >= 0 && !names[i]; i++) {
                names.pop();
            }

            this._settings.set_strv(this._strvKey, names);

            this.unlock();
        } else {
            LOG('tried to delete row but it was locked');
        }
    }
});

const MaximusPrefsWidget = new GObject.Class({
    Name: 'Maximus.Prefs.Widget',
    GTypeName: 'MaximusPrefsWidget',
    Extends: Gtk.Grid,

    _init: function (params) {
        this.parent(params);
        this.margin = this.row_spacing = this.column_spacing = 10;
        this._rownum = 0;
        this._settings = Convenience.getSettings();

        // undecorate half-maximized?
        this.addBoolean(_("Undecorate half-maximized windows?"),
            UNDECORATE_HALF_MAXIMIZED_KEY);

        // is it a blacklist or whitelist?
        this.addBoolean(_("Window list is a blacklist?"), IS_BLACKLIST_KEY);

        /* A TreeView to display the app list. See the extra-panels,
         * workspace-navigator and auto-move-windows extensions for examples.
         */
        this._store = new ListModel(this._settings, BLACKLIST_KEY,
            Columns.APPID);
        this._treeView = new Gtk.TreeView({
            model: this._store,
            hexpand: true,
            vexpand: true
        });
        //this._treeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);
        // we will only display the app's display name + icon.
        let appColumn = new Gtk.TreeViewColumn({
            expand: true,
            sort_column_id: Columns.DISPLAY_NAME,
            title: _("Application blacklist/whitelist")
        }),
            iconRenderer = new Gtk.CellRendererPixbuf(),
            textRenderer = new Gtk.CellRendererText({editable: false});
        appColumn.pack_start(iconRenderer, false);
        appColumn.pack_start(textRenderer, true);
        appColumn.add_attribute(iconRenderer, 'gicon', Columns.ICON);
        appColumn.add_attribute(textRenderer, 'text', Columns.DISPLAY_NAME);
        this._treeView.append_column(appColumn);

        this.addItem(this._treeView);

        /* TOOLBAR with 'add' and 'delete' */
        let toolbar = new Gtk.Toolbar();
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);

        let button = new Gtk.ToolButton({
            stock_id: Gtk.STOCK_ADD,
            label: _("Add")
        });
        button.connect('clicked', Lang.bind(this, this._newClicked));
        toolbar.add(button);

        button = new Gtk.ToolButton({
            stock_id: Gtk.STOCK_REMOVE,
            label: _("Remove")
        });
        button.connect('clicked', Lang.bind(this, this._delClicked));
        toolbar.add(button);

        button = new Gtk.ToolButton({
            stock_id: Gtk.STOCK_CLEAR,
            label: _("Clear all"),
            is_important: true // show its label
        });
        button.connect('clicked', Lang.bind(this, this._clearClicked));
        toolbar.add(button);

        this.addItem(toolbar);
    },

    /* *** toolbar stuff *** */
    _newClicked: function () {
        /* bring up a dialogue for them to set windows */
        let dialog = new AppChooserDialog.AppChooserDialog(this.get_toplevel()),
            widget = dialog.get_widget();
        dialog.set_heading(_("Select an application to blacklist/whitelist"));

        function getAppFromDialog(dialog, id) {
            if (id !== Gtk.ResponseType.OK) {
                dialog.destroy();
                return;
            }
            // NOTE: the GDesktopAppInfo returned has a NULL .get_id() !
            let [appId, appInfo] = widget.get_app_info();
            if (!appInfo) {
                dialog.destroy();
                return;
            }
            /* add it */
            let iter = this._store.append();
            this._store.set(
                iter,
                [Columns.APPID, Columns.ICON,
                 Columns.DISPLAY_NAME],
                [appId, appInfo.get_icon(),
                 appInfo.get_display_name()]
            );
            dialog.destroy();
        }
        dialog.connect('response', Lang.bind(this, getAppFromDialog));
        dialog.show_all();
    },

    _delClicked: function () {
        let [any, model, iter] = this._treeView.get_selection().get_selected();

        if (any) {
            this._store.remove(iter);
        }
    },

    _clearClicked: function () {
        this._settings.reset(BLACKLIST_KEY);
        this._store._reloadFromSettings();
    },

    /* *** Useful *** */
    addBoolean: function (text, key) {
        let item = new Gtk.Switch({active: this._settings.get_boolean(key)});
        this._settings.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.addRow(text, item);
    },

    addRow: function (text, widget, wrap) {
        let label = new Gtk.Label({ label: text });
        label.set_line_wrap(wrap || false);
        this.attach(label, 0, this._rownum, 1, 1); // col, row, colspan, rowspan
        this.attach(widget, 1, this._rownum, 1, 1);
        this._rownum++;
    },

    addItem: function (widget, col, colspan, rowspan) {
        this.attach(widget, col || 0, this._rownum, colspan || 2, rowspan || 1);
        this._rownum++;
    },
    // TODO: lock on drag/drop to prevent 3 changes being fired.
});

function buildPrefsWidget() {
    let widget = new MaximusPrefsWidget();
    widget.show_all();

    return widget;
}
