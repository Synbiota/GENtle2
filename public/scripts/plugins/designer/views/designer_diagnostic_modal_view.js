import Backbone from 'backbone';
import _ from 'underscore';
import {CANNOT_CIRCULARIZE, INCOMPATIBLE_STICKY_ENDS} from '../lib/assemble_sequence';
import template from '../templates/designer_diagnostic_modal_view.hbs';

var errorMessages = {
  [CANNOT_CIRCULARIZE]: 'The circuit cannot be made circular because the sticky ends of the first and last sequence are incompatible',
  [INCOMPATIBLE_STICKY_ENDS]: 'There are incompatible sticky ends in some of the parts'
};

export default Backbone.View.extend({
  manage: true,
  template: template,
  serialize: function() {
    return {
      errors: _.pick(errorMessages, ...this.errors)
    };
  }
});