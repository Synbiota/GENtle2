import AbstractViewContainingSequences from '../../common/views/abstract_view_containing_sequences';
import template from '../templates/sequencing_primers_products_view.hbs';

export default AbstractViewContainingSequences.extend({
  template: template,

  serialize: function() {
    return {
      products: this.getProducts()
    };
  },

});