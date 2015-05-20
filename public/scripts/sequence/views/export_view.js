/**
@class ExportView
@module Sequence
@submodule Views
**/
// define(function(require) {
  var Backbone    = require('backbone'),
      template    = require('../templates/export_view.hbs'),
      Filetypes   = require('../../common/lib/filetypes/filetypes'),
      Gentle      = require('gentle'),
      ExportView;

  ExportView = Backbone.View.extend({
    template: template,
    manage: true,

    formats: [{
      name: 'SYBIL',
      value: 'sybil'
    }, {
      name: 'Plain text',
      value: 'plaintext'
    }],  

    events: {
      'click .sequence-export-button': 'exportSequence'
    },

    afterRender: function() {
      this.$('form input[type= "text"]').focus();
    },
    

    exportSequence: function(event) {
      var sequence = Gentle.currentSequence,
          format = this.$('form [name="export-formats"]').val(),
          exportName = this.$('form input[type= "text"]').val();
      event.preventDefault();
      var options = {
        exportName: exportName,
      };
      Filetypes.exportToFile(format, sequence.toJSON(), options);
    },

    serialize: function() {
      return {
        formats: this.formats,
        exportName: Gentle.currentSequence.get('name'),
      };
    }

  });
export default ExportView;
  // return ExportView;
// });