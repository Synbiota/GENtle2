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


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'new-pcr-product-form-container',

  events: {
    'change input': 'updateState',
    'keyup #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'change #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'submit .new-pcr-product-form': 'confirmRdpEdits',
    'click .cancel-new-pcr-product-form': 'cancel',
  },

  initialize: function({selectionFrom, selectionTo}) {
    this.rdpOligoSequence = this.model instanceof WipRdpOligoSequence;
    this.state = _.defaults({
      from: selectionFrom || 0,
      to: selectionTo || this.model.getLength(this.model.STICKY_END_FULL)-1,
      name: this.model.get('name'),
      sourceSequenceName: this.model.get('sourceSequenceName')
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
    var availablePartTypes = [{name: 'CDS', value: 'CDS'}];
    if(this.rdpOligoSequence) {
      availablePartTypes = [
        {name: 'CDS',      value: 'CDS'},
        {name: 'Promoter', value: 'PROMOTER'},
        {name: 'RBS',      value: 'RBS'},
        {name: 'Other',    value: 'OTHER'},
      ];
    }
    return {
      rdpOligoSequence: this.rdpOligoSequence,
      state: this.state,
      availableStickyEnds: _.map(allStickyEnds(), function(end) {
        return {
          name: end.name,
          value: end.name
        };
      }),
      availablePartTypes
    };
  },

  afterRender: function() {
    var $inputs = this.$('input, select');
    $inputs.attr('disabled', this.state.calculating ? 'disabled' : null);
    this.renderCanvasSequence();
  },

  showProducts: function(event) {
    event.preventDefault();
    this.parentView().showProducts();
  },

  updateStateAndRenderSequence: function(event) {
    this.updateState();
    if(!(this.state.invalid.from || this.state.invalid.to)) {
      this.renderCanvasSequence();
    }
  },

  renderCanvasSequence: function() {
    var sequenceAttributes = this.getSequenceAttributes();
    // OPTIMIZE: creating a new TemporarySequence each time may not be very efficient for long sequences.
    var temporarySequence = new TemporarySequence(sequenceAttributes);
    this.parentView().showCanvas(false, temporarySequence);
  },

  updateState: function() {
    _.extend(this.state, {
      name: this.getFieldFor('name').val(),
      shortName: this.getFieldFor('shortName').val(),
      partType: this.getFieldFor('partType').val()
    });
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
    var isInteger = (val) => _.isNumber(val) && !_.isNaN(val) && val >= 0;
    var validBp = (val) => isInteger(val) && val < this.model.getLength();

    this.state.invalid = {
      name: !this.state.name,
      targetMeltingTemperature: !isInteger(this.state.targetMeltingTemperature),
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

  getSequenceAttributes: function() {
    return _.pick(this.getData(), 'name', 'sequence', 'from', 'to', 'sourceSequenceName');
  },

  getData: function() {
    var data = _.pick(this.state,
      'name',
      'partType',
      'shortName',
      'rdpEdits',
      'sourceSequenceName'
    );
    if(!this.rdpOligoSequence) {
      _.extend(data, _.pick(this.state,
        'from',
        'to',
        'targetMeltingTemperature'
      ));
    }

    data.stickyEnds = _.find(allStickyEnds(), {name: this.getFieldFor('stickyEnds').val()});

    var frm = this.state.from;
    var to = this.state.to;
    data.sequence = this.model.getSubSeq(frm, to);

    return data;
  },

  confirmRdpEdits: function(event) {
    if(event) event.preventDefault();
    if(this.state.invalid.any) {
      alert('Some RDP part details are incorrect or missing.  Please correct them first.');
    } else {
      var temporarySequence = new this.model.constructor(this.getSequenceAttributes());
      this.state.temporarySequence = temporarySequence;
      var transforms = transformSequenceForRdp(temporarySequence);
      this.state.rdpEdits = transforms;

      let transformsTypes = _.pluck(transforms, 'type');
      if(_.includes(transformsTypes, 'RDP_EDIT_MULTIPLE_OF_3')) {
        alert('The target sequence length needs to be a multiple of 3');
      } else if(transforms.length === 0) {
        this.state.rdpEdits = [];
        this.createNewRdpPart();
      } else {
        Modal.show({
          title: 'Make source sequence RDP-compliant',
          subTitle: 'The following edit(s) must be made to the source sequence to convert it to an RDP-compliant part',
          confirmLabel: 'Make edits',
          bodyView: new EditsView({
            transforms: transforms
          })
        }).once('confirm', () => {
          this.state.rdpEdits = transforms;
          this.createNewRdpPart();
        });
      }
    }
  },

  createNewRdpPart: function() {
    this.state.calculating = true;
    var data = this.getData();
    if(this.rdpOligoSequence) {
      var rdpOligoSequence = this.state.temporarySequence;
      var sequenceBases = rdpOligoSequence.getSequence(rdpOligoSequence.STICKY_END_FULL);
      data.sequence = data.stickyEnds.start.sequence + sequenceBases + data.stickyEnds.end.sequence;
      data.rdpEdits = this.state.rdpEdits;

      // ensures Gentle routes view to the RDP oligo product result view
      data.displaySettings = data.displaySettings || {};
      data.displaySettings.primaryView = 'rdp_pcr';

      var newRdpOligoSequence = new RdpOligoSequence(data);
      Gentle.sequences.add(newRdpOligoSequence);
      this.model.destroy();
      Gentle.router.sequence(newRdpOligoSequence.get('id'));
    } else {
      this.parentView().makePrimers(data);
    }
  },

  cancel: function(event) {
    if(event) event.preventDefault();
    this.model.destroy();
    Gentle.router.home();
  }

});