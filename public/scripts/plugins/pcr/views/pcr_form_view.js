import Gentle from 'gentle';
import template from '../templates/pcr_form_view.hbs';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import StickyEnds from '../../../common/lib/sticky_ends';


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'new-pcr-product-form-container',

  events: {
    'change input': 'updateState',
    'keyup #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'change #newProduct_from, #newProduct_to': 'updateStateAndRenderSequence',
    'submit .new-pcr-product-form': 'createNewPcrProduct',
    'click .cancel-new-pcr-product-form': 'showProducts',
  },

  initialize: function({selectionFrom, selectionTo}) {
    this.state = _.defaults({
      from: selectionFrom || 0,
      to: selectionTo || this.model.length()-1,
    }, this.model.get('meta.pcr.defaults') || {},
    {targetMeltingTemperature: 68.5});
    this.validateState();
  },

  validateFields: function() {
    return ['name', 'from', 'to', 'targetMeltingTemperature'];
  },

  serialize: function() {
    return {
      state: this.state,
      availableStickyEnds: _.map(StickyEnds, function(end) {
        return {
          name: end.name,
          value: end.name
        };
      })
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
    this.state.name = this.getFieldFor('name').val();
    this.state.from = this.getFieldFor('from').val() - 1;
    this.state.to = this.getFieldFor('to').val() - 1;
    this.state.targetMeltingTemperature = +this.getFieldFor('targetMeltingTemperature').val();
    this.validateState();
    this.updateFormErrors();
  },

  validateState: function() {
    var isInteger = (val) => _.isNumber(val) && !_.isNaN(val) && val >= 0;
    var validBp = (val) => isInteger(val) && val < this.model.get('sequence').length;

    this.state.invalid = {};
    this.state.invalid.name = !this.state.name;
    this.state.invalid.from = !validBp(this.state.from);
    this.state.invalid.to = !validBp(this.state.to);
    this.state.invalid.targetMeltingTemperature = !isInteger(this.state.targetMeltingTemperature);

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
    var sequenceNts = this.model.get('sequence').substr(frm, to - frm + 1);
    return {sequence: sequenceNts, from: frm, to: to};
  },

  getFormData: function() {
    return {
      name: this.state.name,
      from: this.state.from,
      to: this.state.to,
      targetMeltingTemperature: this.state.targetMeltingTemperature,
      stickyEnds: _.find(StickyEnds, {name: this.getFieldFor('stickyEnds').val()})
    };
  },

  createNewPcrProduct: function(event) {
    event.preventDefault();
    if(this.state.invalid.any) {
      alert("Some PCR primer details are incorrect or missing.  Please correct them first.");
    } else {
      var data = this.getFormData();
      this.parentView().makePrimer(data);
    }
  },

});