/**
@class EditView
@module Sequence
@submodule Views
**/
define(function(require) {
  var template = require('hbars!sequence/templates/dropdown_secondary_view'),
    Backbone = require('backbone.mixed'),
    Gentle = require('gentle')(),
    Sequences = require('sequence/models/sequences'),
    EditView;

  SecondaryChangeView = Backbone.View.extend({
    manage: true,
    template: template,

    initialize: function() {
      this.model = Gentle.currentSequence;
    },
    
  });

  return SecondaryChangeView;
});