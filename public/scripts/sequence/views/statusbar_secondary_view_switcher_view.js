/**
@class SecondaryViewSwitcher
@module Sequence
@submodule Views
**/
// define(function(require) {
  var template = require('../templates/statusbar_secondary_view_switcher_view.hbs'),
    Backbone = require('backbone'),
    Gentle = require('gentle'),
    Sequences = require('../models/sequences'),
    SecondaryViewSwitcher;

  SecondaryViewSwitcher = Backbone.View.extend({
    manage: true,
    template: template, 

    events: {
      'click .dropdown-menu a': 'onClick',
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.listenTo(this.model, 'change:displaySettings.secondaryView', this.render, this);
    },

    serialize: function() {
      var primaryView = this.getPrimaryView();
      return {
        currentView: primaryView.secondaryView,
        views: primaryView.secondaryViews 
      };
    },

    getPrimaryView: function() {
      return this.parentView(2).actualPrimaryView;
    },

    onClick: function(event) {
      var $link = $(event.currentTarget);
      event.preventDefault();
      this.getPrimaryView().changeSecondaryView($link.data('section_name'), true);
    }
    
  });
export default SecondaryViewSwitcher;
  // return SecondaryViewSwitcher;
// });