import template from '../templates/pcr_view.hbs';
import Backbone from 'backbone';
import FormView from './pcr_form_view';
import ProgressView from './pcr_progress_view';
import ListView from './pcr_list_view';
import CanvasView from './pcr_canvas_view';
import Gentle from 'gentle';
import Sequence from '../../../sequence/models/sequence';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import {handleError} from '../../../common/lib/handle_error';


var viewStates = {
  form: 'form',
  products: 'products',
  progress: 'progress',
};


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'pcr',

  events: {
    'click .show-new-pcr-product-form': 'showFormFn',
  },

  initialize: function({showForm}, argumentsForFormView={}) {
    this.model = Gentle.currentSequence;

    var products = this.getProducts();
    this.saveProducts(products);

    this.viewState = (showForm || !products.length) ? viewStates.form : viewStates.products;

    var args = {model: this.model};
    this.formView = new FormView(_.extend(argumentsForFormView, args));
    this.listView = new ListView(args);
    this.progressView = new ProgressView(args);
  },

  beforeRender: function() {
    if(this.viewState === viewStates.form) {
      this.setView('.pcr-view-container', this.formView);
    } else if(this.viewState === viewStates.products) {
      this.setView('.pcr-view-container', this.listView);
    } else if(this.viewState === viewStates.progress) {
      this.setView('.pcr-view-container', this.progressView);
    }
  },

  showFormFn: function(event) {
    if(event) event.preventDefault();
    this.viewState = viewStates.form;
    this.render();
  },

  showProducts: function(product) {
    this.hideCanvas();
    this.listView.showProduct(product);
    this.viewState = viewStates.products;
    this.render();
  },

  makePrimer: function(data) {
    this.progressView.makePrimer(data);
    this.viewState = viewStates.progress;
    this.render();
  },

  showCanvas: function(product, temporarySequence) {
    var view = new CanvasView();
    this.setView('#pcr-canvas-container', view);

    if(product) {
      view.setProduct(product);
      this.showingProductId = product.id;
      this.listView.$('.panel').removeClass('panel-info');
      this.listView.$('[data-product_id="'+product.id+'"]').addClass('panel-info');
    } else if(temporarySequence) {
      view.setSequence(temporarySequence);
    }

    view.render();
  },

  hideCanvas: function() {
    this.removeView('#pcr-canvas-container');
  },

  getProducts: function() {
    return this.model.get('meta.pcr.products') || [];
  },

  saveProducts: function(products) {
    return this.model.set('meta.pcr.products', products).throttledSave();
  },

  deleteProduct: function(product) {
    var products = this.getProducts();
    var idx = products.indexOf(product);
    products.splice(idx, 1);
    this.saveProducts(products);
    if(_.isEmpty(products)) {
      this.showFormFn();
    } else {
      this.showProducts();
    }
  },

  getSequenceAttributesFromProduct: function(product) {
    var sequenceNts = product.sequence;
    var features = [];

    if(product.stickyEnds) {
      features = features.concat([{
        name: product.stickyEnds.startName + ' end',
        _type: 'sticky_end',
        ranges: [{
          from: 0,
          to: product.stickyEnds.start.length-1
        }]
      },
      {
        name: product.stickyEnds.endName + ' end',
        _type: 'sticky_end',
        ranges: [{
          from: sequenceNts.length - 1,
          to: sequenceNts.length - 1 - product.stickyEnds.end.length,
        }]
      },
      {
        name: 'Annealing region',
        _type: 'annealing_region',
        ranges: [_.pick(product.forwardAnnealingRegion, 'from', 'to')]
      },
      {
        name: 'Annealing region',
        _type: 'annealing_region',
        ranges: [_.pick(product.reverseAnnealingRegion, 'from', 'to')]
      },
      {
        name: product.forwardPrimer.name,
        _type: 'primer',
        ranges: [_.pick(product.forwardPrimer, 'from', 'to')]
      },
      {
        name: product.reversePrimer.name,
        _type: 'primer',
        ranges: [_.pick(product.reversePrimer, 'from', 'to')]
      }
      ]);
    }

    return {
      sequence: sequenceNts,
      name: product.name,
      features: features,
    };
  },

  getSequenceFromProduct: function(product) {
    return new Sequence(this.getSequenceAttributesFromProduct(product));
  },

  getTemporarySequenceFromProduct: function(product) {
    return new TemporarySequence(this.getSequenceAttributesFromProduct(product));
  },
});