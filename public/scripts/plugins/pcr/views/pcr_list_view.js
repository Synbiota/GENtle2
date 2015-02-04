import template from '../templates/pcr_list_view.hbs';
import Backbone from 'backbone.mixed';

export default Backbone.View.extend({
  template: template,
  manage: true,
  className: 'pcr-product',

  events: {
    'click .show-pcr-product': 'showPcrProduct',
    'click .delete-pcr-product': 'deletePcrProduct'
  },

  serialize: function() {
    var parentView = this.parentView();

    return {
      products: parentView.products,
    };
  },

  afterRender: function() {
    var showingProductId = this.parentView().showingProductId;
    if(showingProductId) {
      this.$('[data-product-id="'+showingProductId+'"]').addClass('panel-info');
    }
  },

  getProduct: function(event) {
    var products = this.parentView().products;
    var productId = $(event.target).closest('.panel').data('productId');
    return _.find(products, {id: productId});
  },

  showPcrProduct: function(event) {
    event.preventDefault();
    var product = this.getProduct(event);
    if(product) {
      this.parentView().showCanvas(product);
    }
  },

  deletePcrProduct: function(event) {
    event.preventDefault();
    var product = this.getProduct(event);
    if(product) {
      this.parentView().deleteProduct(product);
    }
  }
});