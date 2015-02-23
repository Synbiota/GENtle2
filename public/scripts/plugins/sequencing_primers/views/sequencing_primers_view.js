import Backbone from 'backbone.mixed';
import template from '../templates/sequencing_primers_view.hbs';
import PrimersDesign from '../lib/sequencing_primers_design';
import ProductsView from './sequencing_primers_products_view';
import CanvasView from './sequencing_primers_canvas_view';
import Gentle from 'gentle';
import Sequence from '../../../sequence/models/sequence';

Gentle = Gentle();


export default Backbone.View.extend({
  manage: true,
  template: template, 

  events: {
    'click .start-sequencing-primers': 'startCalculation'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
    this.products = [];
    this.setView('.sequencing-primers-products-container', new ProductsView());
    this.setView('.sequencing-primers-canvas-container', new CanvasView());
  },

  serialize: function() {
    return {
      products: this.products
    };
  },

  startCalculation: function(event) {
    if(event) event.preventDefault();
    this.$('.start-sequencing-primers').hide();
    this.$('.new-sequencing-primers-progress').show();
    PrimersDesign(this.model).progress((progress) => {
      this.$('.new-sequencing-primers-progress .progress-bar').css('width', progress*100+'%');
    }).then((results) => {
      console.log('done', results)
      this.products = results;
      this.render();
    }).catch((e) => console.log(e));
  },

  getSequence: function() {
    var features = [];
    if(_.isEmpty(this.products)) return;

    _.each(this.products, function(product) {

      features = features.concat([{
        name: 'Product '+product.index,
        _type: 'sequencing_product',
        ranges: [{
          from: product.from,
          to: product.to
        }]
      },{
        name: 'Forward primer '+product.index,
        _type: 'primer',
        ranges: [{
          from: product.from,
          to: product.from + product.forwardPrimer.sequenceLength
        }]
      }, {
        name: 'Reverse primer  '+product.index,
        _type: 'primer',
        ranges: [{
          from: product.to - product.reversePrimer.sequenceLength-1,
          to: product.to
        }]
      }]);

    });

    return new Sequence({
      sequence: this.model.get('sequence'),
      features: features
    });
  }




});