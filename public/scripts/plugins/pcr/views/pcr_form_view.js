import Gentle from 'gentle';
import template from '../templates/pcr_form_view.hbs';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import StickyEnds from '../../../common/lib/sticky_ends';
import Modal from '../../../common/views/modal_view';
import EditsView from './pcr_edits_view';
import _ from 'underscore';
import {transformSequenceForRdp} from 'gentle-rdp/sequence_transform';


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'new-pcr-product-form-container',

  events: {
    'change input': 'updateState',
    'keyup #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'change #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'submit .new-pcr-product-form': 'confirmRdpEdits',
    'click .cancel-new-pcr-product-form': 'showProducts',
  },

  initialize: function({selectionFrom, selectionTo}) {
    this.state = _.defaults({
      from: selectionFrom || 0,
      to: selectionTo || this.model.getLength()-1,
      name: this.model.get('name')
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
      state: this.state,
      sourceSequenceName: this.model.get('sourceSequenceName'),
      availableStickyEnds: _.map(StickyEnds(), function(end) {
        return {
          name: end.name,
          value: end.name
        };
      }),
      availablePartTypes: [{name: 'CDS', value: 'CDS'}]
    };
  },

  afterRender: function() {
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
      from: this.getFieldFor('from').val() - 1,
      to: this.getFieldFor('to').val() - 1,
      partType: this.getFieldFor('partType').val()
    })
    
    this.validateState();
    this.updateFormErrors();
  },

  validateState: function() {
    var isInteger = (val) => _.isNumber(val) && !_.isNaN(val) && val >= 0;
    var validBp = (val) => isInteger(val) && val < this.model.getLength();

    this.state.invalid = {
      name: !this.state.name,
      from: !validBp(this.state.from),
      to: !validBp(this.state.to),
      targetMeltingTemperature: !isInteger(this.state.targetMeltingTemperature),
    };

    this.state.invalid.any = _.reduce(this.validateFields(), (memo, field) => memo || this.state.invalid[field], false);

    if(this.state.from > this.state.to) {
      var frm = this.state.from;
      this.state.from = this.state.to;
      this.state.to = frm;
    }
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
    // OPTIMIZE: this may not be very efficient for long sequences.
    var frm = this.state.from;
    var to = this.state.to;
    var sequenceNts = this.model.getSequence().substr(frm, to - frm + 1);
    var name = this.model.get('name');
    return {sequence: sequenceNts, from: frm, to: to, name};
  },

  getData: function() {
    var data = _.pick(this.state, 
      'name', 
      'from', 
      'to', 
      'targetMeltingTemperature',
      'partType',
      'shortName'
    );

    data.stickyEnds = _.find(StickyEnds(), {name: this.getFieldFor('stickyEnds').val()});

    return data;
  },

  confirmRdpEdits: function(event) {
    if(event) event.preventDefault();
    if(this.state.invalid.any) {
      alert("Some PCR primer details are incorrect or missing.  Please correct them first.");
    } else {
      let tempSequence = new this.model.constructor(this.getSequenceAttributes());
      let transforms = transformSequenceForRdp(tempSequence);

      console.log('transforms', transforms)

      let transformsTypes = _.pluck(transforms, 'type');
      if(_.includes(transformsTypes, 'RDP_EDIT_MULTIPLE_OF_3')) {
        alert('The target sequence length needs to be a multiple of 3');
      } else if(transforms.length === 0) {
        this.createNewPcrProduct()
      } else {
        Modal.show({
          title: 'Make source sequence RDP-compliant',
          subTitle: 'The following edit(s) must be made to the source sequence to convert it to an RDP-compliant part',
          bodyView: new EditsView({
            transforms: transforms
          })
        }).once('confirm', () => this.createNewPcrProduct());
      }
    }
  },

  createNewPcrProduct: function(event) {
    console.log('data', this.getData())
    return;
    if(event) event.preventDefault();
    if(event && this.state.invalid.any) {
      alert("Some PCR primer details are incorrect or missing.  Please correct them first.");
    } else {
      var data = this.getData();
      this.parentView().makePrimer(data);
    }
  }

});