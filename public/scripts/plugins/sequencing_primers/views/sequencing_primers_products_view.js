import Backbone from 'backbone.mixed';
import template from '../templates/sequencing_primers_products_view.hbs';

export default Backbone.View.extend({
  manage: true,
  template: template,

  getProducts: function() {
    return this.parentView().products;
  },

  serialize: function() {
    console.log('products', this.getProducts())
    return {
      products: this.getProducts()
    };
  },


});