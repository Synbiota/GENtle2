import {View} from 'backbone';
import template from '../templates/onboarding_help_view.hbs';
import Gentle from 'gentle';
import Modal from '../../../common/views/modal_view';
import _ from 'underscore';

const hidePcrModalKey = 'newRdpPartHideModalPcr';
const hideOligoModalKey = 'newRdpPartHideModalOligo';
const getKey = (isOligo) => isOligo ? hideOligoModalKey : hidePcrModalKey;

var OnboardingHelpView = View.extend({
  manage: true,
  template: template,

  events: {
    'change input': 'toggleShowNextTime',
    'click .new-rdp-part_onboarding-help-continue': 'confirmModal',
    'click .new-rdp-part_onboarding-help-pcr': 'choosePcr',
    'click .new-rdp-part_onboarding-help-oligo': 'chooseOligo'
  },

  initialize: function(options) {
    this.isOligo = options.isOligo;
  },

  serialize: function() {
    return _.pick(this, 'isOligo', 'isUncertain');
  },

  toggleShowNextTime(event) {
    var checked = this.$(event.target).is(':checked');
    Gentle.currentUser.set(getKey(this.isOligo), !checked);
  },

  confirmModal: function(event) {
    event.preventDefault();
    Modal.confirm();
  },

  chooseOligo: function(event) {
    event.preventDefault();
    Modal.confirm(null, {method: 'oligo'});
  },

  choosePcr: function(event) {
    event.preventDefault();
    Modal.confirm(null, {method: 'pcr'});
  }
});

OnboardingHelpView.shouldShowModal = function(hasRdpOligoSequence) {
  return !Gentle.currentUser.get(getKey(hasRdpOligoSequence));
};

export default OnboardingHelpView;