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
      EditView            = require('./edit_view'),
      SettingsView;
  
  SettingsView = SidebarView.extend({

    initialize: function() {
      this.sidebarName = 'sequence';
      this.addTab('history', 'Sequence history', 'time', new HistoryView(), true);
      this.addTab('features', 'Annotations', 'edit', new FeaturesView());
      this.addTab('display-settings', 'Display settings', 'eye-open', new DisplaySettingsView());
      this.addTab('edit', 'Sequence details', 'book', new EditView());
      this.addTab('export', 'Export sequence', 'floppy-save', new ExportView());
    }

  });

  return SettingsView;
});