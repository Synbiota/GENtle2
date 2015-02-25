define(function(require) {
  var Backbone = require('backbone'),
      DisplaySettingsView = require('./display_settings_view'),
      Gentle = require('gentle'),
      RestrictionEnzymes = require('../lib/restriction_enzymes'),
      RestrictionEnzymesSettingsListView = require('./restriction_enzymes_settings_list_view'),
      template = require('../templates/restriction_enzymes_settings_view.hbs');

  var escKey = 27;

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
      var key = 'displaySettings.rows.res';
      DisplaySettingsView.prototype.updateDisplaySettings.call(this, event);
      Gentle.currentUser.set(key, this.model.get(key));
      this.render();
    },

    updateFilter: function(event) {
      if(event.which == escKey) {
        this.clearFilter(event);
      } else {
        this.filter = $(event.currentTarget).val() || '';
        this.listView.render();
      }
    },

    clearFilter: function(event) {
      event.preventDefault();
      this.filter = '';
      this.$('input.res-settings-filter').val('');
      this.listView.render();
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
        recognitionSites: _.range(1,22),
        selected: this.model.get('displaySettings.rows.res.custom'),
        filter: this.filter
      };
    }

  });
});