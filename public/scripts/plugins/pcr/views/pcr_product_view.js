import _ from 'underscore';
import onClickSelectableSequence from '../../../common/lib/onclick_selectable_sequence';
import {gcContent} from '../../../sequence/lib/sequence_calculations';
import RdpPcrSequence   from 'gentle-rdp/rdp_pcr_sequence';
import RdpOligoSequence from 'gentle-rdp/rdp_oligo_sequence';

import EditsView from './pcr_edits_view';
import template from '../templates/pcr_product_view.hbs';
import {humaniseRdpLabel} from '../lib/utils';


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'pcr-product',

  events: {
    // 'click .show-pcr-product': 'showPcrProduct',
    // 'click .panel-title': 'showPcrProduct',
    // // 'click .delete-pcr-product': 'deletePcrProduct',
    // 'click .open-pcr-product': 'openPcrProduct',
    // 'click .export-sequence': 'exportSequence',
    'click .selectable-sequence': 'selectSequence',
    'click .primer-product': 'scrollToPrimer'
  },

  initialize: function() {
    this.setView('.pcr-edits-outlet', new EditsView({
      transforms: this.model.get('rdpEdits'),
      isAfterTransform: true
    }));
  },

  serialize: function() {
    var attributes = this.model.toJSON();
    attributes.isRdpPcrSequence = this.model instanceof RdpPcrSequence;
    attributes.isRdpOligoSequence = this.model instanceof RdpOligoSequence;

    attributes.partType = humaniseRdpLabel(attributes.partType);
    attributes.productLength = this.model.getLength(this.model.STICKY_END_OVERHANG);

    // Provide attributes not present in serialisation (due to them being
    // childSequences of the parent, which means they don't need and should not
    // be serialised)
    if(attributes.isRdpPcrSequence) {
      var forwardPrimer = attributes.meta.associations.forwardPrimer;
      var reversePrimer = attributes.meta.associations.reversePrimer;
      forwardPrimer.sequence = this.model.get('forwardPrimer').getSequence();
      forwardPrimer.gcContent = gcContent(forwardPrimer.sequence);

      reversePrimer.sequence = this.model.get('reversePrimer').getSequence();
      reversePrimer.gcContent = gcContent(reversePrimer.sequence);
    }

    if(attributes.isRdpOligoSequence) {
      attributes.senseStrand = {sequence: this.model.getSenseStrand()};
      attributes.antisenseStrand = {sequence: this.model.getAntisenseStrand()};
    }

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

    this.$('.has-tooltip').gentleTooltip({
      view: this
    });
  },

  /*
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
    this.parentView().showCanvas(product);
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

  scrollToProduct: function(productId) {
    var $container = $('#pcr-list-outer-container');
    var $target = this.$('[data-product_id="' + productId + '"]');
    $container.scrollTop($target.offset().top);
  },
  */

  selectSequence: onClickSelectableSequence,

  scrollToPrimer: function(event) {
    var $target = $(event.currentTarget);
    var id = $target.data('product_id');
    var primer = _.find([
      this.model.get('forwardPrimer'), 
      this.model.get('reversePrimer')
    ], {id});
    this.parentView().canvasView.sequenceCanvas.scrollToBase(primer.range.from);
  }

});