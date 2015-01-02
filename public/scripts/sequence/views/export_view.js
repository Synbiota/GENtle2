/**
@class ExportView
@module Sequence
@submodule Views
**/
define(function(require) {
  var Backbone    = require('backbone.mixed'),
      template    = require('../templates/export_view.hbs'),
      Filetypes   = require('../../common/lib/filetypes/filetypes'),
      Gentle      = require('gentle')(),
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

    exportSequence: function(event) {
      var sequence = Gentle.currentSequence,
          format = this.$('form [name="export-formats"]').val();

      event.preventDefault();
      Filetypes.exportToFile(format, sequence.toJSON());
    },

    serialize: function() {
      return {
        formats: this.formats
      };
    }

  });

  return ExportView;
});