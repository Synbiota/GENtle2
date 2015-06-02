import {fastAExportSequenceFromID} from '../../../common/lib/utils';
import template from '../templates/sequencing_primers_products_view.hbs';
import onClickSelectableSequence from '../../../common/lib/onclick_selectable_sequence';
import _ from 'underscore';


export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'click .selectable-sequence': 'selectSequence',
    'click .sequencing-primers-product': 'showPrimer'
  },

  serialize: function() {
    return {
      products: this.getProducts(),
      noForwardUniversalPrimer: this.missingUniversalPrimer(),
      noReverseUniversalPrimer: this.missingUniversalPrimer(true)
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

  missingUniversalPrimer: function(reverse = false) {
    return !_.some(this.getProducts(), function(product) {
      return (reverse ? /U-rvs/ : /U-fwd/).test(product.primer.name);
    });
  },

  exportSequence: function(event) {
    var sequenceID = $(event.target).data('sequence_id');
    var products = this.getProducts();
    fastAExportSequenceFromID(products, sequenceID);
  },

  selectSequence: onClickSelectableSequence,

  showPrimer: function(event) {
    var $target = this.$(event.currentTarget);
    this.highlightPrimer($target);
    this.parentView().scrollToProduct($target.data('product_id'));
  },

  highlightPrimer: function($el) {
    this.$('.sequencing-primers-product').removeClass('active');
    if($el) {
      this.highlightedProductId = $el.data('product_id');
      $el.addClass('active');
    } else {
      this.highlightedProductId = undefined;
    }
  },

  sortProductsForScrolling: function() {
    var products = this.getProducts();
    if(products.length) {
      this._sortedProductsForScrolling = this._sortedProductsForScrolling || (
        _.sortBy(products, function(product) {
          return product.primer.from;
        })
      );
      return this._sortedProductsForScrolling;
    } else {
      return {};
    }
  },

  distanceToVisibility: function($el, padding = 15) {
    var $parent = this.getScrollingParent();
    var parentScrollTop = $parent.scrollTop();
    var parentHeight = $parent.outerHeight();
    var top = $el.position().top;
    var height = $el.outerHeight();

    return - Math.max(0, parentScrollTop - top + padding) + 
      Math.max(0, top + height - parentScrollTop - parentHeight + padding);
  },

  getScrollingParent: function() {
    return this.$el.closest('.sequencing-primers-products-outer-container');
  },

  scrollToFirstProductInRange: function(baseRange) {
    var sortedProducts = this.sortProductsForScrolling();

    var product = _.find(sortedProducts, function(product_) {
      return product_.primer.from <= baseRange[1] && product_.primer.to >= baseRange[0];
    });

    // TODO REmove that and required functions if we indeed remove that behaviour
    // (maybe move the logic in a module)

    if(!product || product.id !== this.highlightedProductId) {
      this.highlightPrimer();
    }

    // if(product) {
    //   let $product = this.$(`[data-product_id="${product.id}"]`);
    //   let distanceToVisibility = this.distanceToVisibility($product);
    //   let $scrollingParent = this.getScrollingParent();
    //   this.highlightPrimer($product);

    //   if(distanceToVisibility !== 0) {
    //     $scrollingParent.animate({
    //       scrollTop: $scrollingParent.scrollTop() + distanceToVisibility
    //     }, 150);
    //   }
    // } else {
    //   this.highlightPrimer();
    // }
  }

});