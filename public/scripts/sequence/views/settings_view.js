/**
@module Sequence
@submodule Views
@class SettingsView
**/
define(function(require) {
  var FeaturesView        = require('./features_view'),
      HistoryView         = require('./history_view'),
      DisplaySettingsView = require('./display_settings_view'),
      RestrictionEnzymesSettingsView = require('./restriction_enzymes_settings_view'),
      ExportView          = require('./export_view'),
      SidebarView         = require('../../common/views/sidebar_view'),
      ToolsView           = require('./tools_view'),
      EditView            = require('./edit_view'),
      Gentle              = require('gentle'),
      SettingsView;
  
  SettingsView = SidebarView.extend({

    initialize: function() {
      var _this = this;
      this.sidebarName = 'sequence';

      // {
      //   name: 'tools',
      //   title: 'Mode',
      //   icon: 'wrench',
      //   view: ToolsView,
      //   hoverable: true
      // }, 

      this.addTab([{
        name: 'edit',
        title: 'Sequence details',
        icon: 'book',
        view: EditView,
        hoverable: true
      }, {
        name: 'export',
        title: 'Export sequence',
        icon: 'floppy-save',
        view: ExportView,
        hoverable: true
      }, {
        name: 'display-settings',
        title: 'Display settings',
        icon: 'eye-open',
        view: DisplaySettingsView,
        visible: function() {
          return _this.parentView().primaryView.name == 'edition';
        },
        hoverable: true
      }, {
        name: 'history',
        title: 'Sequence history',
        icon: 'time',
        view: HistoryView,
        maxHeighted: true
      }, {
        name: 'features',
        title: 'Annotations',
        icon: 'edit',
        view: FeaturesView,
        visible: function() {
          return _this.parentView().primaryView.name == 'edition';
        },
      },{
        name: 'resSettings',
        title: 'Restriction enzymes',
        icon: 'sort',
        view: RestrictionEnzymesSettingsView,
        visible: function() {
          return _this.parentView().primaryView.name == 'edition';
        },
      }]);

      _.chain(Gentle.plugins)
        .where({type: 'sequence-settings-tab'})
        .pluck('data')
        .each(_.bind(this.addTab, this));

      this.listenTo(Gentle.currentSequence, 'change:displaySettings.primaryView', this.closeOpenTabs);

    }

  });

  return SettingsView;
});