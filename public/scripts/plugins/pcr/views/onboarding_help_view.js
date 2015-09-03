import {View} from 'backbone';
import template from '../templates/onboarding_help_view.hbs';
import Gentle from 'gentle';
import Modal from '../../../common/views/modal_view';

const hidePcrModalKey = 'newRdpPartHideModalPcr';
const hideOligoModalKey = 'newRdpPartHideModalOligo';
const getKey = (isOligo) => isOligo ? hideOligoModalKey : hidePcrModalKey;

var OnboardingHelpView = View.extend({
  manage: true,
  template: template,

  events: {
    'change input': 'toggleShowNextTime',
    'click .new-rdp-part_onboarding-help-continue': 'hideModal'
  },

  initialize: function(options) {
    this.isOligo = options.isOligo;
  },

  serialize: function() {
    return { isOligo: this.isOligo };
  },

  toggleShowNextTime(event) {
    var checked = this.$(event.target).is(':checked');
    Gentle.currentUser.set(getKey(this.isOligo), !checked);
  },

  hideModal: function(event) {
    event.preventDefault();
    Modal.confirm();
  }
});

OnboardingHelpView.shouldShowModal = function(hasRdpOligoSequence) {
  return !Gentle.currentUser.get(getKey(hasRdpOligoSequence));
};

export default OnboardingHelpView;