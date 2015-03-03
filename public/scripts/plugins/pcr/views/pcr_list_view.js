import template from '../templates/pcr_list_view.hbs';
import AbstractViewContainingSequences from '../../common/views/abstract_view_containing_sequences';
import Gentle from 'gentle';

export default AbstractViewContainingSequences.extend({
  template: template,
  className: 'pcr-product',

  events: function () {
    return _.extend(AbstractViewContainingSequences.prototype.events.call(this),
    {
      'click .show-pcr-product': 'showPcrProduct',
      'click .delete-pcr-product': 'deletePcrProduct',
      'click .open-pcr-product': 'openPcrProduct',
    });
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
      this.$('[data-product_id="'+showingProductId+'"]').addClass('panel-info');
    }

    this.$('.has-tooltip').tooltip({
      container: 'body'
    });
  },

  getProduct: function(event) {
    var products = this.getProducts();
    var productID = $(event.target).closest('.panel').data('product_id');
    event.preventDefault();
    return _.find(products, {id: productID});
  },

  showPcrProduct: function(event) {
    var product = this.getProduct(event);
    if(product) {
      this.parentView().showCanvas(product);
    }
  },

  deletePcrProduct: function(event) {
    var product = this.getProduct(event);
    if(product) {
      this.parentView().deleteProduct(product);
    }
  },

  openPcrProduct: function(event) {
    var product = this.getProduct(event);
    if(product) {
      var sequence = this.parentView().getSequenceFromProduct(product);
      Gentle.addSequencesAndNavigate([sequence]);
    }
  },

});