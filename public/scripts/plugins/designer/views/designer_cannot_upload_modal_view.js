import Backbone from 'backbone';
import {
  MISSING_EITHER_STICKY_END
} from '../lib/wip_circuit';
import template from '../templates/designer_cannot_upload_modal_view.hbs';

var errorMessages = {
  [MISSING_EITHER_STICKY_END]: 'Missing one or both RDP ends'
};

export default Backbone.View.extend({
  manage: true,
  template: template,
  serialize: function() {
    return {
      errors: this.errors,
      errorMessages
    };
  }
});