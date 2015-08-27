import _ from 'underscore';
import Backbone from 'backbone';
import Gentle from 'gentle';
import allStickyEnds from '../../../common/lib/sticky_ends';
import {makeOptions} from '../../../common/lib/utils';
import Modal from '../../../common/views/modal_view';
import WipRdpOligoSequence from 'gentle-rdp/wip_rdp_oligo_sequence';

import template from '../templates/pcr_form_view.hbs';
import rdpErrorsTemplate from '../templates/rdp_errors.hbs';
import EditsView from './pcr_edits_view';
import OnboardingHelpView from './onboarding_help_view';
import {humaniseRdpLabel} from '../lib/utils';


var convertForSelect = function(values) {
  return _.map(values, (value) => {
    return {
      name: humaniseRdpLabel(value),
      value
    };
  });
};

const hideModalKey = 'newRdpPartHideModal';

var shouldShowModal = function() {
  return !Gentle.currentUser.get(hideModalKey);
};

export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'new-pcr-product-form-container',

  events: {
    'change input, textarea': 'updateState',
    'change #newProduct_partType': 'updateStateAndRenderStickyEndsOption',
    'keyup #newProduct_frm, #newProduct_to': 'updateStateAndRenderSequence',
    'change #newProduct_frm, #newProduct_to': 'updateStateAndRenderSequence',
    'submit .new-pcr-product-form': 'calculateRdpEdits',
    'click .cancel-new-pcr-product-form': 'cancel'
  },

  initialize: function() {
    if(this.model.getStickyEnds(false)) {
      throw new Error('sequenceModel for RDP part creation can not yet have stickyEnds');
    }
    this.hasRdpOligoSequence = this.model instanceof WipRdpOligoSequence;
    this.hasRdpPcrSequence = !this.hasRdpOligoSequence;

    var tryShowingModalKey = 'tryShowingModal';

    if(this.model.get(tryShowingModalKey)) {
      if(shouldShowModal()) {
        Modal.show({
          title: 'New RDP Part',
          displayFooter: false,
          bodyView: new OnboardingHelpView({isOligo: this.hasRdpOligoSequence})
        }).on('hide', () => {
          this.model.set(tryShowingModalKey, false).throttledSave();
        });
      } else {
        this.model.set(tryShowingModalKey, false).throttledSave();
      }
    }

    var attributes = this.model.toJSON();
    attributes = _.defaults(attributes, {
      frm: 0,
      size: this.model.getLength(this.model.STICKY_END_ANY),
      // if description has not been set/modified, set it to name
      desc: this.model.get('name'),
    }, this.model.get('meta.pcr.defaults') || {});
    this.model.set(attributes);

    this.state = {};
    this.validateModelState();
  },

  getState: function() {
    var state = _.extend({}, this.state, this.model.toJSON());
    state.to = state.frm + state.size - 1;
    return state;
  },

  validateFields: function() {
    return ['name', 'frm', 'to'];
  },

  serialize: function() {
    return {
      rdpOligoSequence: this.hasRdpOligoSequence,
      state: this.getState(),
      availablePartTypes: this.availablePartTypes(),
      availableStickyEndNameOptions: this.availableStickyEndNameOptions(),
    };
  },

  availablePartTypes: function() {
    var baseTypes = convertForSelect(this.model.availablePartTypes);
    var blank = {name: 'Select RDP Part Type',
                 value: '',
                 disabled: true,
                 isSelected: true};
    
    baseTypes.unshift(blank);
    return baseTypes;
  },

  availableStickyEndNameOptions: function() {
    return convertForSelect(this.model.availableStickyEndNames);
  },

  afterRender: function() {
    var $inputs = this.$('input, select');
    $inputs.attr('disabled', this.state.calculating ? 'disabled' : null);
    this.updateCanvas();
  },

  updateStateAndRenderSequence: function(event) {
    event.preventDefault();
    this.updateState();
    if(!(this.state.invalid.frm || this.state.invalid.to)) {
      this.updateCanvas();
    }
  },

  updateStateAndRenderStickyEndsOption: function() {
    this.updateState();
    var optionsHtml = makeOptions(this.availableStickyEndNameOptions());
    this.$el.find('#newProduct_stickyEnds').html(optionsHtml);
  },

  updateCanvas: function() {
    var state = this.getState();
    this.parentView().updateCanvasHighlight(state.frm, state.to);
  },

  updateState: function() {
    var attributes = {
      shortName: this.getFieldFor('shortName').val(),
      partType: this.getFieldFor('partType').val(),
      desc: this.getFieldFor('desc').val(),
    };
    if(!this.hasRdpOligoSequence) {
      var frm = this.getFieldFor('frm').val() - 1;
      _.extend(attributes, {
        frm,
        size: this.getFieldFor('to').val() - frm,
      });
    }
    this.model.set(attributes);
    // Have to update desiredStickyEnds after partType as former is dependent
    // on latter
    var desiredStickyEnds = this.getStickyEnds();
    this.model.set({desiredStickyEnds});

    this.validateModelState();
    this.updateFormErrors();
    if(!this.state.invalid.any) {
      this.model.throttledSave();
    }
  },

  validateModelState: function() {
    var isPositiveInteger = (val) => _.isInteger(val) && val >= 0;
    var validBp = (val) => isPositiveInteger(val) && val < this.model.getLength();
    var modelState = this.getState();

    this.state.invalid = {
      name: !modelState.name,
    };
    if(!this.hasRdpOligoSequence) {
      this.state.invalid.frm = !validBp(modelState.frm);
      this.state.invalid.to = !validBp(modelState.to);
      if(modelState.frm > modelState.to) {
        this.model.set({
          frm: modelState.to,
          size: modelState.frm - modelState.to,
        });
        this.render();
      }
    }

    this.state.invalid.any = _.reduce(this.validateFields(), (memo, field) => memo || this.state.invalid[field], false);
  },

  updateFormErrors: function() {
    _.each(this.validateFields(), (field) => {
      var $field = this.getFieldFor(field).parent();
      if(this.state.invalid[field]) {
        $field.addClass('has-error');
      } else {
        $field.removeClass('has-error');
      }
    });
  },

  getFieldFor: function(field) {
    return this.$('#newProduct_'+field);
  },

  getStickyEnds: function() {
    var name = this.getFieldFor('stickyEnds').val();
    // Check it's valid
    if(!_.contains(this.model.availableStickyEndNames, name)) {
      name = this.model.availableStickyEndNames[0];
    }
    return _.find(allStickyEnds(), {name});
  },

  calculateRdpEdits: function(event) {
    event.preventDefault();
    try {
      if(this.state.invalid.any) {
        alert('Some RDP part details are incorrect or missing.  Please correct them first.');
      } else {
        var desiredWipRdpSequence = this.model.getWipRdpCompliantSequenceModel();
        var rdpEdits = desiredWipRdpSequence.get('rdpEdits');
        var errors = desiredWipRdpSequence.errors();

        if(errors.length) {
          this.renderKnownRdpErrors(errors);
        } else if(rdpEdits.length === 0) {
          this.createNewRdpPart(desiredWipRdpSequence);
        } else {
          Modal.show({
            title: 'Make source sequence RDP-compliant',
            subTitle: 'The following edit(s) must be made to the source sequence to convert it to an RDP-compliant part',
            confirmLabel: 'Make edits',
            bodyView: new EditsView({
              transforms: rdpEdits
            })
          }).once('confirm', () => {
            this.createNewRdpPart(desiredWipRdpSequence);
          });
        }
      }
    } catch(error) {
      this.handleUnexpectedError(error);
    }
  },

  createNewRdpPart: function(desiredWipRdpSequence) {
    this.state.calculating = true;
    if(this.hasRdpOligoSequence) {
      var wipRdpOligoSequence = desiredWipRdpSequence;
      var newRdpOligoSequence = wipRdpOligoSequence.getRdpSequenceModel();

      // ensures Gentle routes view to the RDP oligo product result view
      newRdpOligoSequence.set('displaySettings.primaryView', 'rdp_oligo');

      Gentle.sequences.add(newRdpOligoSequence);
      this.model.destroy();
      Gentle.router.sequence(newRdpOligoSequence.get('id'));
    } else {
      var wipRdpPcrSequence = desiredWipRdpSequence;
      this.parentView().makePrimers(wipRdpPcrSequence);
    }
  },

  renderKnownRdpErrors: function(errors) {
    var bodyHtml = rdpErrorsTemplate({errors});
    Modal.show({
      title: `${errors.length} errors with transforming sequence for RDP compliance.`,
      subTitle: '',
      bodyHtml,
      confirmLabel: 'Okay.',
      cancelLabel: false,
    }).once('confirm', () => {
    });
  },

  handleUnexpectedError: function(error) {
    this.$el.find('.new-pcr-form-error').show();
    console.error(error);
  },

  cancel: function(event) {
    if(event) event.preventDefault();
    this.model.destroy();
    Gentle.router.home();
  }

});
