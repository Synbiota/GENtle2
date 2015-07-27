import Gentle from 'gentle';
import template from '../templates/pcr_form_view.hbs';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import allStickyEnds from '../../../common/lib/sticky_ends';
import Modal from '../../../common/views/modal_view';
import EditsView from './pcr_edits_view';
import _ from 'underscore';
import {transformSequenceForRdp} from 'gentle-rdp/sequence_transform';
import RdpOligoSequence from 'gentle-rdp/rdp_oligo_sequence';
import WipRdpOligoSequence from 'gentle-rdp/wip_rdp_oligo_sequence';
import RdpEdit from 'gentle-rdp/rdp_edit';
import RdpTypes from 'gentle-rdp/rdp_types';
import {makeOptions} from '../../../common/lib/utils';
import Backbone from 'backbone';

const rdpLabels = ['CDS', 'RBS'].concat(_.pluck(allStickyEnds(), 'name'));

var convertForSelect = function(values) {
  return _.map(values, (value) => {
    return {
      name: _.includes(rdpLabels, value) ? value : _.ucFirst(value, true), 
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
    this.rdpOligoSequence = this.model instanceof WipRdpOligoSequence;
    this.rdpPcrSequence = !this.rdpOligoSequence;
    this.state = _.defaults({
      from: selectionFrom || 0,
      to: selectionTo || this.model.getLength(this.model.STICKY_END_ANY)-1,
      name: this.model.get('name'),
      sourceSequenceName: this.model.get('sourceSequenceName'),
    }, this.model.get('meta.pcr.defaults') || {}, {
      targetMeltingTemperature: 68.5, 
      partType: RdpTypes.types.CDS
    });
    this.validateState();
  },

  validateFields: function() {
    return ['name', 'from', 'to', 'targetMeltingTemperature'];
  },

  serialize: function() {
    return {
      rdpOligoSequence: this.rdpOligoSequence,
      state: this.state,
      availablePartTypes: this.availablePartTypes(),
      availableStickyEnds: this.availableStickyEnds(),
    };
  },

  availablePartTypes: function() {
    var partTypes = RdpTypes.availablePartTypes(this.rdpPcrSequence, this.rdpOligoSequence);
    return convertForSelect(partTypes);
  },

  availableStickyEnds: function() {
    var stickyEnds = RdpTypes.availableStickyEnds(this.state.partType, this.rdpPcrSequence, this.rdpOligoSequence);
    return convertForSelect(stickyEnds);
  },

  afterRender: function() {
    var $inputs = this.$('input, select');
    $inputs.attr('disabled', this.state.calculating ? 'disabled' : null);
    this.renderCanvasSequence();
  },

  // showProducts: function(event) {
  //   event.preventDefault();
  //   this.parentView().showProducts();
  // },

  updateStateAndRenderSequence: function(event) {
    event.preventDefault();
    this.updateState();
    if(!(this.state.invalid.from || this.state.invalid.to)) {
      this.renderCanvasSequence();
    }
  },

  updateStateAndRenderStickyEndsOption: function() {
    this.updateState();
    var optionsHtml = makeOptions(this.availableStickyEnds());
    this.$el.find('#newProduct_stickyEnds').html(optionsHtml);
  },

  renderCanvasSequence: function() {
    var temporarySequence = this.getTruncatedSequenceModelForCanvas();
    this.parentView().showCanvas(false, temporarySequence);
  },

  // TODO: Would be nice to remove this function and just pass the `from` and
  // `to` values to the canvas view to selectively render part of the sequence
  // AND retain the correct template base pair numbering rather than always be
  // from base 0 (displayed as 1).
  getTruncatedSequenceModelForCanvas: function() {
    var sequenceAttributes = _.pick(this.getData(), 'name', 'features', 'sequence');
    // OPTIMIZE: creating a new TemporarySequence each time may not be very efficient for long sequences.
    var temporarySequence = new TemporarySequence(sequenceAttributes);
    var ANY = temporarySequence.STICKY_END_ANY;
    var options = {stickyEndFormat: ANY};
    var diff = (temporarySequence.getLength(ANY) - 1) - this.state.to;
    if(diff > 0) {
      temporarySequence.deleteBases(this.state.to, diff, options);
    }
    if(this.state.from > 0) {
      temporarySequence.deleteBases(0, this.state.from, options);
    }
    return temporarySequence;
  },

  updateState: function() {
    _.extend(this.state, {
      name: this.getFieldFor('name').val(),
      shortName: this.getFieldFor('shortName').val(),
      partType: this.getFieldFor('partType').val(),
      desc: this.getFieldFor('desc').val(),
    });
    // `availableStickyEnds()` requires updated this.state.partType
    this.state.availableStickyEnds = this.availableStickyEnds();
    if(!this.rdpOligoSequence) {
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
    if(!this.rdpOligoSequence) {
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
      'sourceSequenceName'
    );
    if(!this.rdpOligoSequence) {
      _.extend(data, _.pick(this.state,
        'from',
        'to',
        'targetMeltingTemperature'
      ));
    }
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
        var attributes = _.pick(data, 'name', 'sequence', 'features', 'sourceSequenceName', 'partType', 'desiredStickyEnds', 'shortName');
        attributes.frm = data.from;
        attributes.size = data.to - data.from + 1;
        var wipRdpSequence = new this.model.constructor(attributes);
        var desiredWipRdpSequence = wipRdpSequence.getDesiredSequenceModel();
        var rdpEdits = transformSequenceForRdp(desiredWipRdpSequence);
        desiredWipRdpSequence.set({rdpEdits});

        let rdpEditTypes = _.pluck(rdpEdits, 'type');
        if(_.includes(rdpEditTypes, RdpEdit.types.NOT_MULTIPLE_OF_3)) {
          alert('The target sequence length needs to be a multiple of 3');
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
      this.handleError(error);
    }
  },

  createNewRdpPart: function(desiredWipRdpSequence) {
    this.state.calculating = true;
    var data = this.getData();
    if(this.rdpOligoSequence) {
      var wipRdpOligoSequence = desiredWipRdpSequence;

      // var stickyEnds = this.getStickyEnds();
      // var start = stickyEnds.start;
      // start.sequence = start.sequence.substr(start.offset, start.size);
      // start.offset = 0;
      // var end = stickyEnds.end;
      // end.sequence = end.sequence.substr(0, end.size);
      // end.offset = 0;

      // stickyEnds not yet present on transformedSequence so we don't need to
      // specify any stickyEnd format
      data.sequence = wipRdpOligoSequence.getSequence(wipRdpOligoSequence.STICKY_END_ANY);
      data.features = wipRdpOligoSequence.getFeatures(wipRdpOligoSequence.STICKY_END_ANY);
      // data.sequence = data.stickyEnds.start.sequence + sequenceBases + data.stickyEnds.end.sequence;

      // ensures Gentle routes view to the RDP oligo product result view
      data.displaySettings = data.displaySettings || {};
      data.displaySettings.primaryView = 'rdp_oligo';

      var newRdpOligoSequence = new RdpOligoSequence(data);
      Gentle.sequences.add(newRdpOligoSequence);
      this.model.destroy();
      Gentle.router.sequence(newRdpOligoSequence.get('id'));
    } else {
      var wipRdpPcrSequence = desiredWipRdpSequence;
      this.parentView().makePrimers(wipRdpPcrSequence);
    }
  },

  handleError: function(error) {
    this.$el.find('.new-pcr-form-error').show();
    console.error(error);
  },

  cancel: function(event) {
    if(event) event.preventDefault();
    this.model.destroy();
    Gentle.router.home();
  }

});