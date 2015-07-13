import Backbone from 'backbone';
import _ from 'underscore';
import {
  CANNOT_CIRCULARIZE, 
  INCOMPATIBLE_STICKY_ENDS,
  MISSING_ANCHOR,
  MISSING_CAP
} from '../lib/wip_circuit';
import template from '../templates/designer_diagnostic_modal_view.hbs';

var errorMessages = {
  [CANNOT_CIRCULARIZE]: 'The circuit cannot be made circular because the RDP ends of the anchor and cap are incompatible',
  [INCOMPATIBLE_STICKY_ENDS]: 'There are incompatible RDP ends in some of the parts',
  [MISSING_ANCHOR]: 'The circuit is missing an anchor',
  [MISSING_CAP]: 'The circuit is missing a cap'
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