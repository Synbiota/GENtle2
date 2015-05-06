import {fastAExportSequenceFromID} from '../../../common/lib/utils';
import template from '../templates/sequencing_primers_products_view.hbs';
import onClickSelectableSequence from '../../../common/lib/onclick_selectable_sequence';


export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'click .export-sequence': 'exportSequence',
    'click .selectable-sequence': 'selectSequence'
  },

  serialize: function() {
    return {
      products: this.getProducts()
    };
  },

  afterRender: function() {
    this.$('.has-tooltip').tooltip({
      container: 'body'
    });
  },

  getProducts: function() {
    return this.parentView().getProducts();
  },

  exportSequence: function(event) {
    var sequenceID = $(event.target).data('sequence_id');
    var products = this.getProducts();
    fastAExportSequenceFromID(products, sequenceID);
  },

  selectSequence: onClickSelectableSequence

});