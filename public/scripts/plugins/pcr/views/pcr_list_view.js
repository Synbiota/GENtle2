import template from '../templates/pcr_list_view.hbs';
import {fastAExportSequenceFromID} from '../../../common/lib/utils';
import Gentle from 'gentle';
import {getPcrProductsFromSequence} from '../lib/utils';
import onClickSelectableSequence from '../../../common/lib/onclick_selectable_sequence';
import _ from 'underscore';


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'pcr-product',

  events: {
    'click .show-pcr-product': 'showPcrProduct',
    'click .panel-title': 'showPcrProduct',
    // 'click .delete-pcr-product': 'deletePcrProduct',
    'click .open-pcr-product': 'openPcrProduct',
    'click .export-sequence': 'exportSequence',
    'click .selectable-sequence': 'selectSequence',
  },

  serialize: function() {
    var convertChildSequence = function(childSequence) {
      var attributes = childSequence.toJSON();
      attributes.sequence = childSequence.getSequence(childSequence.parentSequence.STICKY_END_FULL);
      attributes.from = childSequence.range.from;
      attributes.length = childSequence.range.size;
      attributes.to = childSequence.range.to;
      return attributes;
    };

    var attributes = {
      products: _.map(this.getProducts(), (product) => {
        var attributes = product.toJSON();
        delete attributes.meta.associations;
        var forwardPrimer = product.get('forwardPrimer');
        var reversePrimer = product.get('reversePrimer');
        attributes.forwardPrimer = convertChildSequence(forwardPrimer);
        attributes.reversePrimer = convertChildSequence(reversePrimer);
        attributes.forwardPrimer.annealingRegion = convertChildSequence(forwardPrimer.annealingRegion);
        attributes.reversePrimer.annealingRegion = convertChildSequence(reversePrimer.annealingRegion);
        return attributes;
      }),
    };
    return attributes;
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
    return this.showingProduct ? [this.showingProduct] : []; //getPcrProductsFromSequence(this.model);
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

  // deletePcrProduct: function(event) {
  //   var product = this.getProduct(event);
  //   if(product) {
  //     this.parentView().deleteProduct(product);
  //   }
  // },

  openPcrProduct: function(event) {
    var product = this.getProduct(event);

    if(product) {
      product = product.toJSON();

      let stickyEnds = product.stickyEnds;

      product.features = _.where(product.features, {
        _type: 'sticky_end'
      }).concat({
        _type: 'misc',
        name: `${stickyEnds.start.name}-${product.name}-${stickyEnds.end.name}`,
        desc: '',
        ranges: [{
          from: 0,
          to: product.sequence.length
        }]
      });
    
      Gentle.addSequencesAndNavigate([product]);
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