import Gentle from 'gentle';
import template from '../templates/pcr_form_view.hbs';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import StickyEnds from '../../../common/lib/sticky_ends';


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'new-pcr-product-form-container',

  events: {
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
    {targetMeltingTemperature: 68});
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
    // OPTIMIZE: calling `getTemporarySequence` may not be very efficient for long sequences.
    this.renderCanvasSequence();
  },

  showProducts: function(event) {
    event.preventDefault();
    this.parentView().showProducts();
  },

  updateStateAndRenderSequence: function(event) {
    this.updateState();
    var errors = this.validate().errors;
    if(errors) {
      this.displayErrors(errors);
    } else {
      this.renderCanvasSequence();
    }
  },

  validate: function() {
    // TODO add validation of inputs (currently can enter:
    //   *  negative numbers
    //   *  from > to
    //   *  invalid numbers
    return {};
  },

  renderCanvasSequence: function() {
    var sequence = this.getTemporarySequence();
    this.parentView().showCanvas(false, sequence);
  },

  updateState: function() {
    this.state.from = this.getFieldFor('from').val() - 1;
    this.state.to = this.getFieldFor('to').val() - 1;
  },

  getFieldFor: function(field) {
    return this.$('#newProduct_'+field);
  },

  updateRange: function(frm, to) {
    this.getFieldFor('from').val(frm+1);
    this.getFieldFor('to').val(to+1);
    this.getFieldFor('name').focus();
  },

  getTemporarySequence: function() {
    // OPTIMIZE: this may not be very efficient for long sequences.
    var frm = this.state.from;
    var to = this.state.to;
    var sequenceNts = this.model.get('sequence').substr(frm, to - frm + 1);
    return new TemporarySequence({sequence: sequenceNts});
  },

  extractFieldsData: function() {
    return _.reduce(_.toArray(arguments), (memo, field) => {
      var $field = this.getFieldFor(field);
      memo[field] = $field.val();
      if($field.attr('type') == 'number') memo[field] = memo[field]^0;
      return memo;
    }, {});
  },

  getFormData: function() {
    var data = this.extractFieldsData(
      'from', 'to', 'name', 'targetMeltingTemperature'
    );
    return _.extend(data, {
      from: data.from - 1,
      to: data.to - 1,
      stickyEnds: _.find(StickyEnds, {name: this.$('#newProduct_stickyEnds').val()})
    });
  },

  createNewPcrProduct: function(event) {
    event.preventDefault();
    var data = this.getFormData();
    this.parentView().makePrimer(data);
  },

});