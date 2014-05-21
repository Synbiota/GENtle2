define(function(require) {
  var template        = require('hbars!home/templates/home_view'),
      Backbone        = require('backbone.mixed'),
      Gentle          = require('gentle')(),
      NewSequenceView = require('home/views/new_sequence_view'),
      OpenFileView    = require('home/views/open_file_view'),
      HomeView;

  HomeView = Backbone.View.extend({
    manage: true,
    template: template,

    initialize: function() {

      var defaultTabs, tabsFromPlugins;

      defaultTabs = [{
        name: 'new-sequence',
        title: 'New sequence',
        view: new NewSequenceView(),
        active: true
      }, {
        name: 'open-file',
        title: 'Open from disk',
        view: new OpenFileView()
      }];

      Gentle.addSequencesAndNavigate = this.addSequencesAndNavigate;

      tabsFromPlugins = _.pluck(_.where(Gentle.plugins, {type: 'home'}), 'data');

      this.tabs = [];
      _.each(_.union(defaultTabs, tabsFromPlugins), _.bind(this.addTab, this));
    },

    addTab: function(tab) {
      this.tabs.push(tab);
    },

    addSequencesAndNavigate: function(sequences) {
      if(sequences.length) {
        sequences = _.map(sequences, function(sequence) {
          return Gentle.sequences.create(sequence);
        });
        Gentle.router.sequence(sequences[0].get('id'));
      } else {
        alert('Could not parse the sequence.');
      }
    },

    afterRender: function() {
      var _this = this;
      _.each(this.tabs, function(tab) {
        _this.setView('#home-tab-'+tab.name, tab.view);
        tab.view.render();
      });
    },

    serialize: function() {
      return {
        tabs: this.tabs
      };
    }

  });

  return HomeView;
});