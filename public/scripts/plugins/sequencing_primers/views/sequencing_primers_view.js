import Backbone from 'backbone.mixed';
import template from '../templates/sequencing_primers_view.hbs';
import {getAllPrimersAndProductsHelper} from '../lib/sequencing_primers_design';
import ProductsView from './sequencing_primers_products_view';
import CanvasView from './sequencing_primers_canvas_view';
import Gentle from 'gentle';
import Sequence from '../../../sequence/models/sequence';
import {namedHandleError} from '../../../common/lib/handle_error';
import Product from '../../pcr/lib/product';
import errors from '../lib/errors';


export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'click .start-sequencing-primers': 'startCalculation'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
    var products = this.getProducts();
    _.map((productData) => new Product(productData), products);
    this.model.set('meta.sequencingPrimers.products', products);
    this.setView('.sequencing-primers-products-container', new ProductsView());
    this.setView('.sequencing-primers-canvas-container', new CanvasView());
  },

  getProducts: function () {
    return this.model.get('meta.sequencingPrimers.products') || [];
  },

  serialize: function() {
    return {
      products: this.getProducts()
    };
  },

  startCalculation: function(event) {
    if(event) event.preventDefault();
    this.$('.start-sequencing-primers').hide();
    this.$('.new-sequencing-primers-progress').show();

    var sequenceBases = this.model.get('sequence');
    getAllPrimersAndProductsHelper(sequenceBases)
    .progress((progressOrStatus) => {
      if(progressOrStatus.level) {
        var $message = $('<p>').text(progressOrStatus.message);
        if(progressOrStatus.level === 'warn') {
          $message.addClass('text-warning');
        }
        this.$('.new-sequencing-primers-progress .status').append($message);
      } else {
        this.updateProgress(progressOrStatus);
      }
    })
    .then((results) => {
      this.model.set('meta.sequencingPrimers.products', results).throttledSave();
      this.render();
    })
    .catch(function(error) {
      // We have been passed a message.
      if(error.error === errors.DNA_LEFT_UNSEQUENCED) {
        this.updateProgress(100).css('background-color', '#C00');
        var $status = this.$('.new-sequencing-primers-progress .status');
        $status.find('.no-universal-primers-found').show();
      }
      namedHandleError('startCalculation')(error);
    })
    .done();
  },

  updateProgress: function(progress) {
    return this.$('.new-sequencing-primers-progress .progress-bar').css('width', progress*100+'%');
  },

  getSequence: function() {
    var features = [];
    var products = this.getProducts();
    if(_.isEmpty(products)) return;

    _.each(products, function(product) {

      features.push({
        name: product.name,
        _type: 'sequencing_product',
        ranges: [{
          from: product.from,
          to: product.to
        }]
      });
      var primer = product.primer;
      if(primer) {
        features.push({
          name: primer.name,
          _type: 'primer',
          ranges: [{
            from: primer.from,
            to: primer.to,
          }]
        });
      }

    });

    return new Sequence({
      sequence: this.model.get('sequence'),
      features: features
    });
  }

});
