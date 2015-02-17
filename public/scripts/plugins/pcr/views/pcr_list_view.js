import template from '../templates/pcr_list_view.hbs';
import Backbone from 'backbone.mixed';
import Gentle from 'gentle';
import Filetypes from '../../../common/lib/filetypes/filetypes';
import Sequence from '../../../sequence/models/sequence';

Gentle = Gentle();

export default Backbone.View.extend({
  template: template,
  manage: true,
  className: 'pcr-product',

  events: {
    'click .show-pcr-product': 'showPcrProduct',
    'click .delete-pcr-product': 'deletePcrProduct',
    'click .open-pcr-product': 'openPcrProduct',
    'click .export-forward-primer': 'exportPrimer',
    'click .export-reverse-primer': 'exportPrimer'
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

    this.$('.has-tooltip').tooltip({
      container: 'body'
    });
  },

  getProduct: function(event) {
    var products = this.parentView().products;
    var productId = $(event.target).closest('.panel').data('productId');
    event.preventDefault();
    return _.find(products, {id: productId});
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

  exportPrimer: function(event) {
    var product = this.getProduct(event);
    console.log('export', $(event.currentTarget))
    var forward = $(event.currentTarget).hasClass('export-forward-primer');

    if(product) {
      Filetypes.exportToFile('fasta', (new Sequence({
        sequence: product[forward ? 'forwardPrimer' : 'reversePrimer'].sequence,
        name: product.name + ' - ' + (forward ? 'Forward primer' : 'Reverse primer')
      })).toJSON());
    }
  }
});