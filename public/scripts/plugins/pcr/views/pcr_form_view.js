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


var convertForSelect = function(values) {
  return _.map(values, (value) => {
    return {name: value, value: value};
  });
};


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'new-pcr-product-form-container',

  events: {
    'change input, textarea': 'updateState',
    'change #newProduct_partType': 'updateStateAndRenderStickyEnds',
    'keyup #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'change #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'submit .new-pcr-product-form': 'calculateRdpEdits',
    'click .cancel-new-pcr-product-form': 'cancel',
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
      partType: 'CDS'
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
    this.updateState();
    if(!(this.state.invalid.from || this.state.invalid.to)) {
      this.renderCanvasSequence();
    }
  },

  updateStateAndRenderStickyEnds: function() {
    this.updateState();
    var optionsHtml = makeOptions(this.availableStickyEnds());
    this.$el.find('#newProduct_stickyEnds').html(optionsHtml);
  },

  renderCanvasSequence: function() {
    var sequenceAttributes = _.pick(this.getData(), 'name', 'sequence', 'features');
    // OPTIMIZE: creating a new TemporarySequence each time may not be very efficient for long sequences.
    var temporarySequence = new TemporarySequence(sequenceAttributes);
    this.parentView().showCanvas(false, temporarySequence);
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


    if(this.rdpOligoSequence) {
      var stickyEnds = this.getStickyEnds();
      var start = stickyEnds.start;
      start.sequence = start.sequence.substr(start.offset, start.size);
      start.offset = 0;
      var end = stickyEnds.end;
      end.sequence = end.sequence.substr(0, end.size);
      end.offset = 0;
    }

    var frm = this.state.from;
    var to = this.state.to;
    data.sequence = this.model.getSubSeq(frm, to, this.model.STICKY_END_ANY);
    data.features = this.model.getFeatures();

    return data;
  },

  calculateRdpEdits: function(event) {
    if(event) event.preventDefault();
    if(this.state.invalid.any) {
      alert('Some RDP part details are incorrect or missing.  Please correct them first.');
    } else {
      var attributes = _.pick(this.getData(), 'name', 'sequence', 'features', 'sourceSequenceName', 'partType');
      attributes.desiredStickyEnds = this.getStickyEnds();
      var wipRdpSequence = new this.model.constructor(attributes);
      var rdpEdits = transformSequenceForRdp(wipRdpSequence);

      let rdpEditTypes = _.pluck(rdpEdits, 'type');
      if(_.includes(rdpEditTypes, RdpEdit.types.NOT_MULTIPLE_OF_3)) {
        alert('The target sequence length needs to be a multiple of 3');
      } else if(rdpEdits.length === 0) {
        this.createNewRdpPart(wipRdpSequence, rdpEdits);
      } else {
        Modal.show({
          title: 'Make source sequence RDP-compliant',
          subTitle: 'The following edit(s) must be made to the source sequence to convert it to an RDP-compliant part',
          confirmLabel: 'Make edits',
          bodyView: new EditsView({
            transforms: rdpEdits
          })
        }).once('confirm', () => {
          this.createNewRdpPart(wipRdpSequence, rdpEdits);
        });
      }
    }
  },

  createNewRdpPart: function(wipRdpSequence, rdpEdits) {
    this.state.calculating = true;
    var data = this.getData();
    data.rdpEdits = rdpEdits;
    if(this.rdpOligoSequence) {
      var wipRdpOligoSequence = wipRdpSequence;
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
      var wipRdpPcrSequence = wipRdpSequence;
      wipRdpPcrSequence.transformDataBeforePcr(rdpEdits);
      var dataAndOptions = {
        rdpEdits: rdpEdits,
        frm: 0,
        to: wipRdpPcrSequence.getLength(wipRdpPcrSequence.STICKY_END_ANY) - 1,
        stickyEnds: wipRdpPcrSequence.get('desiredStickyEnds'),
        name: wipRdpPcrSequence.get('name'),
      };
      this.parentView().makePrimers(wipRdpPcrSequence, dataAndOptions);
    }
  },

  cancel: function(event) {
    if(event) event.preventDefault();
    this.model.destroy();
    Gentle.router.home();
  }

});