/**
@module Sequence
@submodule Views
@class SettingsView
**/
define(function(require) {
  var FeaturesView        = require('sequence/views/features_view'),
      HistoryView         = require('sequence/views/history_view'),
      DisplaySettingsView = require('sequence/views/display_settings_view'),
      SidebarView         = require('common/views/sidebar_view'),
      SettingsView;
  
  SettingsView = SidebarView.extend({

    initialize: function() {
      this.sidebarName = 'sequence';
      this.addTab('history', 'Sequence history', 'time', new HistoryView(), true);
      this.addTab('features', 'Annotations', 'edit', new FeaturesView());
      this.addTab('display-settings', 'Display settings', 'eye-open', new DisplaySettingsView());
    }

  });

  return SettingsView;
});