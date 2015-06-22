import _ from 'underscore';
import Backbone from 'backbone';
import DisplaySettingsView from './display_settings_view';
import Gentle from 'gentle';
import RestrictionEnzymes from 'gentle-restriction-enzymes';
import RestrictionEnzymesSettingsListView from './restriction_enzymes_settings_list_view';
import template from '../templates/restriction_enzymes_settings_view.hbs';

var escKey = 27;

export default Backbone.View.extend({
  template: template,
  manage: true,

  events: {
    'change input.res-settings-sites': 'updateDisplaySettings',
    'keyup input.res-settings-filter': 'updateFilter',
    'click .res-settings-selected-clear': 'clearSelected',
    'click .res-settings-filter-clear': 'clearFilter',
    'change .res-settings-hide-non-palindromic-sticky-end-sites': 'updateDisplaySettings'
  },

  initialize: function() {
    var listView = new RestrictionEnzymesSettingsListView();
    this.model = Gentle.currentSequence;
    this.filter = '';

    this.setView('.res-settings-list-outlet', listView);
    listView.model = this.model;
    listView.updateDisplaySettings = this.updateDisplaySettings;
    this.listView = listView;

    this.listenTo(
      this.model, 
      'change:displaySettings.rows.res.custom', 
      _.debounce(this.render, 50), 
      this
    );
  },

  populate: DisplaySettingsView.prototype.populate,

  clearSelected: function(event) {
    event.preventDefault();
    var key = 'displaySettings.rows.res.custom';
    this.model.set(key, []).throttledSave();
    Gentle.currentUser.set(key, []);
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
        // lengths = this.model.get('displaySettings.rows.res.lengths') || [],
        filter = this.filter,
        output = [];

    _.each(enzymes, function(enzyme) {
      // Disabling length filter:
      // 
      // if(~lengths.indexOf(enzyme.seq.length+"") && (!filter || ~enzyme.name.toLowerCase().indexOf(filter.toLowerCase()))) {
      if(!filter || ~enzyme.name.toLowerCase().indexOf(filter.toLowerCase())) {
        output.push(enzyme);
      }
    });

    return output;
  },

  afterRender: function() {
    this.populate();
  },

  focusOnFilter: function() {
    this.$('.res-settings-filter').focus();
  },

  openTab: function() {
    if (!this.isOpen) {
      this.listenToOnce(
        this,
        'afterRender', 
        this.focusOnFilter, 
        this
      );
      this.$toggleButton.click();
    } else {
      this.focusOnFilter();
    }
  },

  serialize: function() {
    return {
      // recognitionSites: _.range(1,22),
      selected: this.model.get('displaySettings.rows.res.custom'),
      filter: this.filter
    };
  }

});