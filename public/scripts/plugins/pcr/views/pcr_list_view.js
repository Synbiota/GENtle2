import template from '../templates/pcr_list_view.hbs';
import {fastAExportSequenceFromID} from '../../../common/lib/utils';
import Gentle from 'gentle';


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'pcr-product',

  events: {
    'click .show-pcr-product': 'showPcrProduct',
    'click .panel-title': 'showPcrProduct',
    'click .delete-pcr-product': 'deletePcrProduct',
    'click .open-pcr-product': 'openPcrProduct',
    'click .export-sequence': 'exportSequence',
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

  getProducts: function() {
    return this.parentView().products;
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

  exportSequence: function(event) {
    var sequenceID = $(event.target).data('sequence_id');
    var products = this.getProducts();
    fastAExportSequenceFromID(products, sequenceID);
  },

});