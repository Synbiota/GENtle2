/**
@module Sequence
@submodule Views
@class SettingsView
**/
define(function(require) {
  var FeaturesView        = require('./features_view'),
      HistoryView         = require('./history_view'),
      DisplaySettingsView = require('./display_settings_view'),
      ExportView          = require('./export_view'),
      SidebarView         = require('common/views/sidebar_view'),
      ToolsView           = require('./tools_view'),
      EditView            = require('./edit_view'),
      SettingsView;
  
  SettingsView = SidebarView.extend({

    initialize: function() {
      var _this = this;
      this.sidebarName = 'sequence';

      this.addTab([{
        name: 'tools',
        title: 'Mode',
        icon: 'wrench',
        view: new ToolsView(),
        hoverable: true
      }, {
        name: 'edit',
        title: 'Sequence details',
        icon: 'book',
        view: new EditView(),
        hoverable: true
      }, {
        name: 'export',
        title: 'Export sequence',
        icon: 'floppy-save',
        view: new ExportView(),
        hoverable: true
      }, {
        name: 'display-settings',
        title: 'Display settings',
        icon: 'eye-open',
        view: new DisplaySettingsView(),
        visible: function() {
          return _this.parentView.primaryView.name == 'edition';
        },
        hoverable: true
      }, {
        name: 'history',
        title: 'Sequence history',
        icon: 'time',
        view: new HistoryView(),
        maxHeighted: true
      }, {
        name: 'features',
        title: 'Annotations',
        icon: 'edit',
        view: new FeaturesView(),
        visible: function() {
          return _this.parentView.primaryView.name == 'edition';
        },
      }]);

    }

  });

  return SettingsView;
});