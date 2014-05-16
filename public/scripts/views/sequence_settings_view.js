define(function(require) {
  var FeaturesView    = require('views/features_view'),
      HistoryView     = require('views/history_view'),
      DisplaySettingsView = require('views/sequence_display_settings_view'),
      SidebarView     = require('views/sidebar_view'),
      SequenceSettingsView;
  
  SequenceSettingsView = SidebarView.extend({

    initialize: function() {
      this.sidebarName = 'sequence';
      this.addTab('history', 'Sequence history', 'time', new HistoryView(), true);
      this.addTab('features', 'Annotations', 'edit', new FeaturesView());
      this.addTab('display-settings', 'Display settings', 'eye-open', new DisplaySettingsView());
    }

  });

  return SequenceSettingsView;
});