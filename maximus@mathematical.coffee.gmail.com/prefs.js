/** Credit:
 *  taken from the gnome shell extensions repository at
 *  git.gnome.org/browse/gnome-shell-extensions
 */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain('@gettextdomain');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const UNDECORATE_HALF_MAXIMIZED_KEY='undecorate-half-maximized';
const IS_BLACKLIST_KEY='is-blacklist';
const BLACKLIST_KEY='window-list';
function init() {
    Convenience.initTranslations();
}

LOG = function (msg) {
    log(msg);
}
/*
 * A Gtk.ListStore with the conveniences of binding one of the columns to
 * a GSettings.
 *
 * Modified from git.gnome.org/gnome-shell-extensions auto-move-windows prefs.js
 *
 * columnInfo: an OBJECT with keys being the column names and values being
 *  another object with keys 'index' (column's index) and 'type' (column's type).
 *  One column may additionally have the flag '.keyvalue = true', marking it as
 *  the column corresponding to the settings. 
 * settings: the GSettings instance to tie to the ListModel
 * key: the key to be updated when the ListStore is updated
 * params: params to Gtk.ListStore.
 *
 * Example: a ListModel with an icon and name, and the name column will
 *          correspond to the key 'NAME_KEY' in the settings:
 *  new ListModel(
 *      {
 *          ICON : { index: 0, type: Gio.Icon },
 *          NAME : { index: 1, type: GObject.TYPE_STRING, keyvalue: true }
 *      },
 *      settings,
 *      NAME_KEY
 *  );
 *
 * When you add to/delete from the store (via .set), call store.lock(). 
 * If this returns true then the store has been successfully locked (against 
 * further changes occuring whilst you make your changes).
 * If it returns 'false' the store was previously locked and you should not 
 * make your changes.
 * When you're done, call store.unlock() to open it up again.
 */
const ListModel = new GObject.Class({
    Name: 'Maximus.ListModel',
    GTypeName: 'ListModel',
    Expands: Gtk.ListStore,

    _init: function (columnInfo, settings, key, params) {
        this.parent(params);
        this._settings = settings;
        this._listKey = key;
        let columnTypes = [];
        for (let columnName in columnInfo) {
            if (columnInfo.hasOwnProperty(columnName)) {
                let col = columnInfo[columnName];
                this.Columns[columnName] = col.index;
                columnTypes.push(col.type);
                if (col.keyvalue) {
                    this._LABEL_COLUMN_INDEX = col.index;
                }
            }
        }
        this.set_column_types(columnTypes);
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
            let newNames = this._settings.get_strv(this._listKey);
            let i = 0;
            let [ok, iter] = this.get_iter_first();
            while (ok) {
                ok = this.remove(iter);
            }

            for ( ; i < newNames.length; i++) {
                iter = this.append();
                this.set(iter, [this._LABEL_COLUMN_INDEX], [newNames[i]]);
            }
            this.unlock();
        }
    },

    _onRowChanged: function (self, path, iter) {
        if (this.lock()) {
            LOG('changing row');
            let index = path.get_indices()[0],
                names = this._settings.get_strv(this._listKey);
            if (index >= names.length) {
                // fill with blanks (????)
                for (let i = names.length; i <= index; i++) {
                    names[i] = '';
                }
            }

            this._settings.set_strv(this._listKey, names);
            this.unlock();
        } else {
            LOG('tried to change row but it was locked');
        }
    },

    _onRowInserted: function(self, path, iter) {
        if (this.lock()) {
            LOG('inserting row');
            let index = path.get_indices()[0];
            let names = this._settings.get_strv(this._listKey);
            let label = this.get_value(iter, this._LABEL_COLUMN_INDEX) || '';
            names.splice(index, 0, label);

            this._settings.set_strv(this._listKey, names);
            this.unlock();
        } else {
            LOG('tried to insert row but it was locked');
        }
    },

    _onRowDeleted: function(self, path) {
        if (this.lock()) {
            LOG('deleting row');
            let index = path.get_indices()[0];
            let names = this._settings.get_strv(this._listKey);

            if (index >= names.length) {
                return;
            }

            names.splice(index, 1);

            // compact the array
            for (let i = names.length -1; i >= 0 && !names[i]; i++) {
                names.pop();
            }

            this._settings.set_strv(this._listKey, names);

            this.unlock();
        } else {
            LOG('tried to delete row but it was locked');
        }
    },
});


const MaximusPrefsWidget = new GObject.Class({
    Name: 'Maximus.Prefs.Widget',
    GTypeName: 'MaximusPrefsWidget',
    Extends: Gtk.Grid,

    _init: function(params) {
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
        this._store = new ListModel(
            {
                ICON:         { index: 0, type: Gio.Icon },
                DISPLAY_NAME: { index: 1, type: GObject.TYPE_STRING, keyvalue: true }
            },
            this._settings,
            BLACKLIST_KEY
        );
        this._treeView = new Gtk.TreeView({
            model: this._store,
            hexpand: true,
            vexpand: true
        });
        this._treeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);
        // make the single app column composed of icon + string
        let appColumn = new Gtk.TreeViewColumn({
            expand: true,
            sort_column_id: Columns.DISPLAY_NAME,
            title: _("Application")
        }),
            iconRender = new Gtk.CellRenderPixbuf(),
            textRenderer = new Gtk.CellRenderText({editable: false});
        appColumn.pack_start(iconRenderer, false);
        appColumn.pack_start(textRenderer, true);
        appColumn.add_attribute(iconRender, 'gicon', this._store.Columns.ICON);
        appColumn.add_attribute(textRender, 'gicon', this._store.Columns.DISPLAY_NAME);
        this._treeView.append_column(appColumn);

        this.add(this._treeView);

        /* TOOLBAR with 'add' and 'delete' */
        let toolbar = new Gtk.Toolbar();                                        
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);  
     
        let newButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_NEW });        
        newButton.connect('clicked', Lang.bind(this, this._newClicked));        
        toolbar.add(newButton);                                                 
                                                                                
        let delButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_DELETE });     
        delButton.connect('clicked', Lang.bind(this, this._delClicked));        
        toolbar.add(delButton);                                                 
                                                                                
        this.add(toolbar);
    },

    /* *** toolbar stuff *** */
    _newClicked: function() {                                                   
        if (this._store.lock()) {
            /* bring up a dialogue for them to set windows */
            let dialog = new Gtk.AppChooserDialog(this.get_toplevel(),
                    Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT),
                widget = dialog.get_widget();
            dialog.set_heading(_("Select an app to blacklist/whitelist"));
            widget.set_show_all(true);

            widget.connect('application-activated', Lang.bind(this, function (dialog, id) {
                let appInfo = widget.get_app_info()
                if (!appInfo) {
                    return;
                }
                /* add it */
                let iter = this._store.append();
                this._store.set(iter,
                    [this._store.Columns.ICON, this._store.Columns.DISPLAY_NAME],
                    [appInfo.get_icon(), appInfo.get_display_name()]);
                dialog.destroy();
            }));
            dialog.show_all();
            this._store.unlock();
        }
    },                                                                          
                                                                                
    _delClicked: function() {                                                   
        if (this._store.lock()) {
            let [any, model, iter] = this._treeView.get_selection().get_selected(); 
                                                                                    
            if (any) {
                this._store.remove(iter);
            }
            this._store.unlock();
        }
    },

    /* *** Useful *** */
    addBoolean: function (text, key) {
        let item = new Gtk.Switch({active: this._settings.get_boolean(key)});
        this._settings.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.addRow(text, item);
    },

    addRow: function (text, widget) {
        let label = new Gtk.Label({ label: text });
        this.attach(label, 0, this._rownum, 1, 1);
        this.attach(widget, 1, this._rownum, 1, 1);
        this._rownum++;
    }
});

function buildPrefsWidget() {
    let widget = new MaximusPrefsWidget();
    widget.show_all();

    return widget;
}
