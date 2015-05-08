import template from '../templates/pcr_list_view.hbs';
import {fastAExportSequenceFromID, getProductAndSequenceForSequenceID} from '../../../common/lib/utils';
import Gentle from 'gentle';
import {getPcrProductsFromSequence, savePcrProductsToSequence} from '../lib/utils';
import onClickSelectableSequence from '../../../common/lib/onclick_selectable_sequence';


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
    'click .selectable-sequence': 'selectSequence',
  },

  serialize: function() {
    return {
      products: _.map(this.getProducts(), (product) => product.toJSON()),
    };
  },

  showProduct: function(product) {
    this.showingProduct = product;
  },

  afterRender: function() {
    var showingProduct = this.showingProduct;
    if(showingProduct) {
      let id = showingProduct.get('id');
      let $element = this.$(`[data-product_id="${id}"]`);
      $element.addClass('panel-info');
      $element.find('.selectable-sequence').first().select();
      this.scrollToProduct(id);
      this.parentView().showCanvas(showingProduct);
    }

    this.$('.has-tooltip').tooltip({
      container: 'body'
    });
  },

  getProducts: function() {
    return getPcrProductsFromSequence(this.model);
  },

  getProduct: function(event) {
    event.preventDefault();
    var products = this.getProducts();
    var productId = $(event.target).closest('.panel').data('product_id');
    return _.find(products, (product) => product.id === productId);
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
      Gentle.addSequencesAndNavigate([product.asSequence()]);
    }
  },

  exportSequence: function(event) {
    var sequenceID = $(event.target).data('sequence_id');
    var products = this.getProducts();
    fastAExportSequenceFromID(products, sequenceID);
  },

  selectSequence: onClickSelectableSequence,

  scrollToProduct: function(productId) {
    var $container = $('#pcr-list-outer-container');
    var $target = this.$('[data-product_id="' + productId + '"]');
    // debugger
    $container.scrollTop($target.offset().top);
  },

});