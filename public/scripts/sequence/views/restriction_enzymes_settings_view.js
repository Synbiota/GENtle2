define(function(require) {
  var Backbone = require('backbone.mixed'),
      DisplaySettingsView = require('./display_settings_view'),
      Gentle = require('gentle')(),
      RestrictionEnzymes = require('../lib/restriction_enzymes'),
      RestrictionEnzymesSettingsListView = require('./restriction_enzymes_settings_list_view'),
      template = require('hbars!../templates/restriction_enzymes_settings_view');

  return Backbone.View.extend({
    template: template,
    manage: true,

    events: {
      'change input.res-settings-sites': 'updateDisplaySettings',
      'keyup input.res-settings-filter': 'updateFilter',
      'click .res-settings-selected-clear': 'clearSelected',
      'click .res-settings-filter-clear': 'clearFilter',
    },

    initialize: function() {
      var listView = new RestrictionEnzymesSettingsListView();
      this.model = Gentle.currentSequence;
      this.filter = '';

      this.setView('.res-settings-list-outlet', listView);
      listView.model = this.model;
      listView.updateDisplaySettings = this.updateDisplaySettings;
      this.listView = listView;

      this.listenTo(this.model, 'change:displaySettings.rows.res.custom', _.debounce(this.render, 50), this);
    },

    populate: DisplaySettingsView.prototype.populate,

    clearSelected: function(event) {
      event.preventDefault();
      this.model.set('displaySettings.rows.res.custom', []);
      this.render();
    },  

    updateDisplaySettings: function(event) {
      DisplaySettingsView.prototype.updateDisplaySettings.call(this, event);
      this.render();
    },

    updateFilter: function(event) {
      this.filter = $(event.currentTarget).val() || '';
      this.listView.render();
    },

    clearFilter: function(event) {
      event.preventDefault();
      this.filter = '';
      this.render();
    },

    getEnzymes: function() {
      var enzymes = RestrictionEnzymes.all(),
          lengths = this.model.get('displaySettings.rows.res.lengths') || [],
          filter = this.filter,
          output = [];

      _.each(enzymes, function(enzyme) {
        if(~lengths.indexOf(enzyme.seq.length+"") && (!filter || ~enzyme.name.toLowerCase().indexOf(filter.toLowerCase()))) {
          output.push(enzyme);
        }
      });

      return output;
    },

    afterRender: function() {
      this.populate();
    },

    serialize: function() {
      return {
        recognitionSites: _.range(1,10),
        selected: this.model.get('displaySettings.rows.res.custom'),
        filter: this.filter
      };
    }

  });
});