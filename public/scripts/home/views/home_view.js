/**
@module Home
@submodule Views
@class HomeView
**/
// define(function(require) {
  var template        = require('../templates/home_view.hbs'),
      Backbone        = require('backbone'),
      Gentle          = require('gentle'),
      NewSequenceView = require('./new_sequence_view'),
      ParentNewSequenceView = require('./parent_new_sequence_view'),
      OpenFileView    = require('./open_file_view'),
      _               = require('underscore'),
      HomeView;

  HomeView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'home',

    initialize: function() {

      var defaultTabs, tabsFromPlugins;

      defaultTabs = [{
        name: 'new-sequence',
        title: 'New sequence',
        view: ParentNewSequenceView,
        active: true
      }, 
      ];

      tabsFromPlugins = _.pluck(_.where(Gentle.plugins, {type: 'home'}), 'data');

      this.tabs = [];
      _.each(_.union(defaultTabs, tabsFromPlugins), _.bind(this.addTab, this));
    },

    addTab: function(tab) {
      this.tabs.push(tab);
    },

    afterRender: function() {
      var _this = this;
      _.each(this.tabs, function(tab) {
        var view = new tab.view();
        _this.setView('#home-tab-'+tab.name, view);
        view.render();
      });
    },

    serialize: function() {
      return {
        tabs: _.sortBy(_.filter(this.tabs, function(tab) {
          return tab.visible === undefined || tab.visible();
        }), (tab) => tab.order || 0)
      };
    }

  });
export default HomeView;
  // return HomeView;
// });
