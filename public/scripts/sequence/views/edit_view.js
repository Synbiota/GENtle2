/**
@class EditView
@module Sequence
@submodule Views
**/
define(function(require) {
  var template = require('hbars!sequence/templates/edit_view'),
    Backbone = require('backbone.mixed'),
    Gentle = require('gentle')(),
    Sequences = require('sequence/models/sequences'),
    Edit = require('sequence/models/edit'),
    EditView;

  EditView = Backbone.View.extend({
    manage: true,
    template: template,

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.validation = new Edit();
    },

    events: {
      'click input[type=submit]': 'updateNameDescription',
    },

    updateNameDescription: function(event) {
      var validation = this.validation,
          model = this.model;

      event.preventDefault();

      model.set('name', validation.valid(this.$('#name').val(), 'name'));
      model.set('description', validation.valid(this.$('#desc').val(), 'desc'));
      model.save();
      document.title = this.model.get('name');
    },

    serialize: function() {

      return {

        Name: this.model.get('name'),
        Desc: this.model.get('description')
      };

    }
  });
  return EditView;

});