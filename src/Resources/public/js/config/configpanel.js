pimcore.registerNS("pimcore.plugin.exporttoolkit.config.ConfigPanel");
pimcore.plugin.exporttoolkit.config.ConfigPanel = Class.create({

    initialize: function () {

        this.getTabPanel();
    },

    activate: function () {
        var tabPanel = Ext.getCmp("pimcore_panel_tabs");
        tabPanel.activate("plugin_exporttoolkit_configpanel");
    },

    getTabPanel: function () {

        if (!this.panel) {
            this.panel = new Ext.Panel({
                id: "plugin_exporttoolkit_configpanel",
                title: t("plugin_exporttoolkit_configpanel"),
                iconCls: "plugin_exporttoolkit_configpanel",
                border: false,
                layout: "border",
                closable:true,
                items: [this.getTree(), this.getEditPanel()]
            });

            var tabPanel = Ext.getCmp("pimcore_panel_tabs");
            tabPanel.add(this.panel);
            tabPanel.setActiveItem("plugin_exporttoolkit_configpanel");

            this.panel.on("destroy", function () {
                pimcore.globalmanager.remove("plugin_exporttoolkit_configpanel");
            }.bind(this));

            pimcore.layout.refresh();
        }

        return this.panel;
    },

    getTree: function () {
        if (!this.tree) {

            var store = Ext.create('Ext.data.TreeStore', {
                autoLoad: false,
                autoSync: true,
                proxy: {
                    type: 'ajax',
                    url: '/admin/elementsexporttoolkit/config/list',
                    reader: {
                        type: 'json'
                    }
                }
            });

            this.tree = new Ext.tree.TreePanel({
                id: "plugin_exporttoolkit_configpanel_tree",
                store: store,
                region: "west",
                useArrows:true,
                autoScroll:true,
                animate:true,
                containerScroll: true,
                border: true,
                width: 200,
                split: true,
                root: {
                    //nodeType: 'async',
                    id: '0',
                    expanded: true,
                    iconCls: "pimcore_icon_thumbnails"

                },
                rootVisible: false,
                tbar: {
                    items: [
                        {
                            text: t("plugin_exporttoolkit_configpanel_add"),
                            iconCls: "pimcore_icon_add",
                            handler: this.addField.bind(this)
                        }
                    ]
                },
                listeners: {
                    itemclick : this.onTreeNodeClick.bind(this),
                    itemcontextmenu: this.onTreeNodeContextmenu.bind(this),
                    render: function() {
                        this.getRootNode().expand()
                    }
                }
            });
        }

        return this.tree;
    },

    getEditPanel: function () {
        if (!this.editPanel) {
            this.editPanel = new Ext.TabPanel({
                region: "center"
            });
        }

        return this.editPanel;
    },

    getTreeNodeListeners: function () {
        var treeNodeListeners = {
            'click' : this.onTreeNodeClick.bind(this),
            "contextmenu": this.onTreeNodeContextmenu
        };

        return treeNodeListeners;
    },

    onTreeNodeClick: function (tree, record, item, index, e, eOpts ) {
        this.openConfig(record.id);
    },

    openConfig: function(id) {
        var existingPanel = Ext.getCmp("plugin_exporttoolkit_configpanel_panel_" + id);
        if(existingPanel) {
            this.editPanel.setActiveTab(existingPanel);
            return;
        }

        Ext.Ajax.request({
            url: "/admin/elementsexporttoolkit/config/get",
            params: {
                name: id
            },
            success: function (response) {
                var data = Ext.decode(response.responseText);

                var fieldPanel = new pimcore.plugin.exporttoolkit.config.Item(data, this);
                pimcore.layout.refresh();
            }.bind(this)
        });
    },

    onTreeNodeContextmenu: function (tree, record, item, index, e, eOpts ) {
        e.stopEvent();

        tree.select();

        var menu = new Ext.menu.Menu();
        menu.add(new Ext.menu.Item({
            text: t('delete'),
            iconCls: "pimcore_icon_delete",
            handler: this.deleteField.bind(this, tree, record)
        }));

        menu.add(new Ext.menu.Item({
            text: t('duplicate'),
            iconCls: "pimcore_icon_clone",
            handler: this.cloneField.bind(this, tree, record)
        }));

        menu.showAt(e.pageX, e.pageY);
    },

    addField: function () {
        Ext.MessageBox.prompt(t('plugin_exporttoolkit_configpanel_enterkey_title'), t('plugin_exporttoolkit_configpanel_enterkey_prompt'), this.addFieldComplete.bind(this), null, null, "");
    },

    addFieldComplete: function (button, value, object) {

        var regresult = value.match(/[a-zA-Z0-9_\-]+/);
        if (button == "ok" && value.length > 2 && regresult == value) {
            Ext.Ajax.request({
                url: "/admin/elementsexporttoolkit/config/add",
                params: {
                    name: value
                },
                success: function (response) {
                    var data = Ext.decode(response.responseText);

                    this.tree.getStore().load({
                        node: this.tree.getRootNode()
                    });

                    if(!data || !data.success) {
                        pimcore.helpers.showNotification(t("error"), t("plugin_exporttoolkit_configpanel_error_adding_config"), "error", data.message);
                    } else {
                        this.openConfig(data.name);
                    }

                }.bind(this)
            });
        }
        else if (button == "cancel") {
            return;
        }
        else {
            Ext.Msg.alert(t("plugin_exporttoolkit_configpanel"), t("plugin_exporttoolkit_configpanel_invalid_name"));
        }
    },

    cloneFieldComplete: function (tree, record, button, value, object) {

        var regresult = value.match(/[a-zA-Z0-9_\-]+/);
        if (button == "ok" && value.length > 2 && regresult == value) {
            Ext.Ajax.request({
                url: "/admin/elementsexporttoolkit/config/clone",
                params: {
                    name: value,
                    originalName: record.data.id
                },
                success: function (response) {
                    var data = Ext.decode(response.responseText);

                    this.tree.getStore().load({
                        node: this.tree.getRootNode()
                    });

                    if(!data || !data.success) {
                        pimcore.helpers.showNotification(t("error"), t("plugin_exporttoolkit_configpanel_error_cloning_config"), "error", data.message);
                    } else {
                        this.openConfig(data.name, tree, record);
                    }

                }.bind(this)
            });
        }
        else if (button == "cancel") {
            return;
        }
        else {
            Ext.Msg.alert(t("plugin_exporttoolkit_configpanel"), t("plugin_exporttoolkit_configpanel_invalid_name"));
        }
    },

    cloneField: function (tree, record) {
        Ext.MessageBox.prompt(t('plugin_exporttoolkit_configpanel_enterclonekey_title'), t('plugin_exporttoolkit_configpanel_enterclonekey_prompt'),
            this.cloneFieldComplete.bind(this, tree, record), null, null, "");
    },

    deleteField: function (tree, record) {
        Ext.Msg.confirm(t('delete'), t('delete_message'), function(btn){
            if (btn == 'yes'){
                Ext.Ajax.request({
                    url: "/admin/elementsexporttoolkit/config/delete",
                    params: {
                        name: record.data.id
                    }
                });

                this.getEditPanel().removeAll();
                record.remove();
            }
        }.bind(this));
    }
});

