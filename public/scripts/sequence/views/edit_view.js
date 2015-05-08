/**
@class EditView
@module Sequence
@submodule Views
**/
// define(function(require) {
  var template = require('../templates/edit_view.hbs'),
    Backbone = require('backbone'),
    Gentle = require('gentle'),
    Sequences = require('../models/sequences'),
    EditView;

  EditView = Backbone.View.extend({
    manage: true,
    template: template,

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.delayedReadAndUpdate = _.afterLastCall(this.readAndUpdate, 1000);
    },

    events: {
      'click input[type=button]': 'readAndUpdate',
      'keydown :input' : 'delayedReadAndUpdate',
      'click input[type=radio]' : 'delayedReadAndUpdate',
    },

    readAndUpdate: function(event) {
      console.log("saving");
      var descript = 'No Description';
      this.model.nameBefore = this.model.get('name');
      this.model.errors= {};
      event.preventDefault();
      var isCircular = this.$('[name="isCircular"]:checked').val() || "false";

      this.model.set({
        name: this.$('#name').val(),
        description: this.$('#desc').val(),
        isCircular: isCircular == "true"
      }, {
        validate: true
      });

      if (this.model.validationError !== null) {
        if (this.model.validationError[0] === 'name') {
          this.model.errors.name = true;
          this.model.set('name', this.model.nameBefore);
          document.title = this.model.nameBefore + " / Gentle";
          this.model.set('desc', this.$('#desc').val());
        }
        if (this.model.validationError[0] === 'desc') {
          this.model.set('desc', descript);
          this.model.set('name', this.$('#name').val());
          document.title = this.$('#name').val() + " / Gentle";
        }
        if (this.model.validationError.length === 2) {
          this.model.set('name', this.model.nameBefore);
          this.model.set('desc', descript);
          document.title = this.model.nameBefore + " / Gentle";
        }
        this.$("#name").parents('.form-group').addClass('has-error');
      } else {
        this.model.set('name', this.$('#name').val());
        this.model.set('desc', this.$('#desc').val());
        document.title = this.$('#name').val() + " / Gentle";
        this.$("#name").parents('.form-group').removeClass('has-error');

      }

      this.model.save();
      // this.render(); 
    },

    serialize: function() {
      return {
        readOnly: this.model.get('readOnly'),
        Name: this.model.get('name'),
        Desc: this.model.get('desc'),
        isCircular: !!this.model.get('isCircular'),
        error: this.model.errors || {}
      };

    },
  });
export default EditView;
  // return EditView;
// });