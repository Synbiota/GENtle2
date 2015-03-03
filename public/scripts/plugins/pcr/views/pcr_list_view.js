import template from '../templates/pcr_list_view.hbs';
import Backbone from 'backbone';
import Gentle from 'gentle';
import Filetypes from '../../../common/lib/filetypes/filetypes';
import Sequence from '../../../sequence/models/sequence';

export default Backbone.View.extend({
  template: template,
  manage: true,
  className: 'pcr-product',

  events: {
    'click .show-pcr-product': 'showPcrProduct',
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

  getProduct: function(event) {
    var products = this.parentView().products;
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

  getProductAndSequenceForSequenceID: function(sequenceID) {
    var products = this.parentView().products;
    // var filteredProduct = _.find(products, {id: sequenceID});
    // if(filteredProducts.length) return filteredProduct;
    var fields = ['forwardPrimer', 'reversePrimer'];
    for (var i = products.length - 1; i >= 0; i--) {
      var product = products[i];
      for (var j = fields.length - 1; j >= 0; j--) {
        var sequence = product[fields[j]];
        if(sequence && sequence.id && sequence.id === sequenceID) return [product, sequence];
      }
    }
  },

  getSequenceID: function(event) {
    return $(event.target).data('sequence_id');
  },

  exportSequence: function(event) {
    var sequenceID = this.getSequenceID(event);
    var result = this.getProductAndSequenceForSequenceID(sequenceID);

    if(result) {
      var [product, sequence] = result;
      Filetypes.exportToFile('fasta', (new Sequence({
        sequence: sequence.sequence,
        name: product.name + ' - ' + sequence.name,
      })).toJSON());
    }
  }
});