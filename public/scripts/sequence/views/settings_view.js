/**
@module Sequence
@submodule Views
@class SettingsView
**/
import FeaturesView         from './features_view';
import HistoryView          from './history_view';
import DisplaySettingsView  from './display_settings_view';
import RestrictionEnzymesSettingsView 
                            from './restriction_enzymes_settings_view';
import ExportView           from './export_view';
import SidebarView          from '../../common/views/sidebar_view';
import ToolsView            from './tools_view';
import EditView             from './edit_view';
import Gentle               from 'gentle';
import StickyEndsView       from './sticky_ends_settings_view';

var SettingsView = SidebarView.extend({

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
    }, {
      name: 'stickEnds',
      title: 'Sticky ends',
      icon: 'align-left',
      view: StickyEndsView,
      visible: function() {
        return Gentle.currentUser.get('displaySettings.stickyEndsSettings');
      }
    }]);

    _.chain(Gentle.plugins)
      .where({type: 'sequence-settings-tab'})
      .pluck('data')
      .each(_.bind(this.addTab, this));

    this.listenTo(Gentle.currentSequence, 'change:displaySettings.primaryView', this.closeOpenTabs);

  }

});

export default SettingsView;