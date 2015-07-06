/**
@class ExportView
@module Sequence
@submodule Views
**/
import Backbone from 'backbone';
import template from '../templates/export_view.hbs';
import Filetypes from '../../common/lib/filetypes/filetypes';
import Gentle from 'gentle';
import isDesktopSafari from '../../common/lib/is_desktop_safari';

var ExportView = Backbone.View.extend({
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
      formats: this.formats,
      isDesktopSafari: isDesktopSafari()
    };
  }

});

export default ExportView;