/**
@class SecondaryViewSwitcher
@module Sequence
@submodule Views
**/
define(function(require) {
  var template = require('hbars!sequence/templates/statusbar_secondary_view_switcher_view'),
    Backbone = require('backbone.mixed'),
    Gentle = require('gentle')(),
    Sequences = require('sequence/models/sequences'),
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
      this.getPrimaryView().changeSecondaryView($link.data('sectionName'), true);
    }
    
  });

  return SecondaryViewSwitcher;
});