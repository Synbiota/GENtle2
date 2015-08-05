import _ from 'underscore';
import Backbone from 'backbone';
import Gentle from 'gentle';
import allStickyEnds from '../../../common/lib/sticky_ends';
import {makeOptions} from '../../../common/lib/utils';
import Modal         from '../../../common/views/modal_view';
import RdpEdit             from 'gentle-rdp/rdp_edit';
import WipRdpOligoSequence from 'gentle-rdp/wip_rdp_oligo_sequence';

import template from '../templates/pcr_form_view.hbs';
import rdpErrorsTemplate from '../templates/rdp_errors.hbs';
import EditsView from './pcr_edits_view';
import {humaniseRdpType} from '../lib/utils';


var convertForSelect = function(values) {
  return _.map(values, (value) => {
    return {
      name: humaniseRdpType(value),
      value
    };
  });
};


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'new-pcr-product-form-container',

  events: {
    'change input, textarea': 'updateState',
    'change #newProduct_partType': 'updateStateAndRenderStickyEndsOption',
    'keyup #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'change #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'submit .new-pcr-product-form': 'calculateRdpEdits',
    'click .cancel-new-pcr-product-form': 'cancel'
  },

  initialize: function({selectionFrom, selectionTo}) {
    if(this.model.getStickyEnds(false)) {
      throw new Error('sequenceModel for RDP part creation can not yet have stickyEnds');
    }
    this.hasRdpOligoSequence = this.model instanceof WipRdpOligoSequence;
    this.hasRdpPcrSequence = !this.hasRdpOligoSequence;
    var partType = this.model.get('partType');
    this.state = _.defaults({
      from: selectionFrom || 0,
      to: selectionTo || this.model.getLength(this.model.STICKY_END_ANY)-1,
      name: this.model.get('name'),
      sourceSequenceName: this.model.get('sourceSequenceName'),
    }, this.model.get('meta.pcr.defaults') || {}, {
      targetMeltingTemperature: 68.5, 
      partType,
    });
    this.validateState();
  },

  validateFields: function() {
    return ['name', 'from', 'to', 'targetMeltingTemperature'];
  },

  serialize: function() {
    return {
      rdpOligoSequence: this.hasRdpOligoSequence,
      state: this.state,
      availablePartTypes: this.availablePartTypes(),
      availableStickyEndNameOptions: this.availableStickyEndNameOptions(),
    };
  },

  availablePartTypes: function() {
    var baseTypes = convertForSelect(this.model.availablePartTypes);
    console.log("available part types")
    console.log(baseTypes);
    var blank = {name: "",
                 value: "--",
                 disabled: true,
                 isSelected: true};
    
    baseTypes.unshift(blank)
    console.log(baseTypes)
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

  // showProducts: function(event) {
  //   event.preventDefault();
  //   this.parentView().showProducts();
  // },

  updateStateAndRenderSequence: function(event) {
    event.preventDefault();
    this.updateState();
    if(!(this.state.invalid.from || this.state.invalid.to)) {
      this.updateCanvas();
    }
  },

  updateStateAndRenderStickyEndsOption: function() {
    this.updateState();
    var optionsHtml = makeOptions(this.availableStickyEndNameOptions());
    this.$el.find('#newProduct_stickyEnds').html(optionsHtml);
  },

  updateCanvas: function() {
    this.parentView().updateCanvasHighlight(this.state.from, this.state.to);
  },


  updateState: function() {
    var partType = this.getFieldFor('partType').val();
    _.extend(this.state, {
      name: this.getFieldFor('name').val(),
      shortName: this.getFieldFor('shortName').val(),
      partType,
      desc: this.getFieldFor('desc').val(),
    });
    // `availableStickyEndNameOptions()` requires updated this.state.partType
    this.model.set({partType});
    if(!this.hasRdpOligoSequence) {
      _.extend(this.state, {
        from: this.getFieldFor('from').val() - 1,
        to: this.getFieldFor('to').val() - 1,
      });
    }

    this.validateState();
    this.updateFormErrors();
  },

  validateState: function() {
    var isPositiveInteger = (val) => _.isNumber(val) && !_.isNaN(val) && val >= 0;
    var validBp = (val) => isPositiveInteger(val) && val < this.model.getLength();

    this.state.invalid = {
      name: !this.state.name,
      targetMeltingTemperature: !isPositiveInteger(this.state.targetMeltingTemperature),
    };
    if(!this.hasRdpOligoSequence) {
      _.extend(this.state.invalid, {
        from: !validBp(this.state.from),
        to: !validBp(this.state.to),
      });
      if(this.state.from > this.state.to) {
        var frm = this.state.from;
        this.state.from = this.state.to;
        this.state.to = frm;
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
    return _.find(allStickyEnds(), {name: this.getFieldFor('stickyEnds').val()});
  },

  getData: function() {
    var data = _.pick(this.state,
      'name',
      'partType',
      'shortName',
      'desc',
      'sourceSequenceName',
      'from',
      'to',
      'targetMeltingTemperature'
    );
    data.sequence = this.model.getSequence(this.model.STICKY_END_ANY);
    data.features = this.model.getFeatures();
    data.desiredStickyEnds = this.getStickyEnds();
    return data;
  },

  calculateRdpEdits: function(event) {
    event.preventDefault();
    try {
      if(this.state.invalid.any) {
        alert('Some RDP part details are incorrect or missing.  Please correct them first.');
      } else {
        var data = this.getData();
        var attributes = _.pick(data, 'name', 'sequence', 'features', 'sourceSequenceName', 'partType', 'desiredStickyEnds');
        attributes.frm = data.from;
        attributes.size = data.to - data.from + 1;
        // TODO refactor to keep same sequenceModel?
        var desiredWipRdpSequence = this.model.getRdpCompliantSequenceModel(attributes);
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
    var data = this.getData();
    data.shortName = data.desiredStickyEnds.start.name +'-'+ data.shortName +'-'+ data.desiredStickyEnds.end.name;
    if(this.hasRdpOligoSequence) {
      var wipRdpOligoSequence = desiredWipRdpSequence;
      data.stickyEnds = data.desiredStickyEnds;
      var newRdpOligoSequence = wipRdpOligoSequence.getRdpOligoSequence(data);

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
