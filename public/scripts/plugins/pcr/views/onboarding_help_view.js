import {View} from 'backbone';
import template from '../templates/onboarding_help_view.hbs';
import Gentle from 'gentle';

const hideModalKey = 'newRdpPartHideModal';

export default View.extend({
  manage: true,
  template: template,

  events: {
    'change input': 'toggleShowNextTime'
  },

  initialize: function(options) {
    this.isOligo = options.isOligo;
  },

  serialize: function() {
    return { isOligo: this.isOligo }
  },

  toggleShowNextTime(event) {
    var checked = this.$(event.target).is(':checked');
    Gentle.currentUser.set(hideModalKey, !checked);
  }
});
