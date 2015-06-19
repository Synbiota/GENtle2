import _ from 'underscore';
import template from '../templates/pcr_view.hbs';
import Backbone from 'backbone';
import FormView from './pcr_form_view';
import ProgressView from './pcr_progress_view';
import ProductView from './pcr_product_view';
import CanvasView from './pcr_canvas_view';
import Gentle from 'gentle';
import PcrProductSequence from '../lib/product';


var viewStates = {
  form: 'form',
  product: 'product',
  progress: 'progress',
};


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'pcr',

  events: {
    'click .show-new-pcr-product-form': 'showFormFn',
  },

  // `{showForm: showForm}={}` as first argument is required because
  // `var actualView = new primaryView.view(argumentsForView[0], argumentsForView[1], argumentsForView[2]);`
  // was replaced with `var actualView = new primaryView.view(...argumentsForView);`
  // in sequence_view and for some reason the default options are not
  // correctly passed by the Backbone View's
  // `this.initialize.apply(this, arguments);` so just having `{showForm}`
  // will throw an exception.
  initialize: function({showForm: showForm}={}, argumentsForFormView={}) {
    this.model = Gentle.currentSequence;

    this.viewState = this.model instanceof PcrProductSequence ? 
      viewStates.product : viewStates.form;

    var args = {model: this.model};
    this.formView = new FormView(_.extend(argumentsForFormView, args));
    this.progressView = new ProgressView(args);
  },

  beforeRender: function() {
    if(this.viewState === viewStates.form) {
      this.setView('.pcr-view-container', this.formView);
      this.removeView('.pcr-view-container2');
    } else if(this.viewState === viewStates.product) {
      this.setView('.pcr-view-container', new ProductView({model: this.model}));
      this.showCanvas(null, this.getBluntEndedSequence());
      this.removeView('.pcr-view-container2');
    } else if(this.viewState === viewStates.progress) {
      this.setView('.pcr-view-container', this.formView);
      this.setView('.pcr-view-container2', this.progressView);
    }
  },

  getBluntEndedSequence() {
    var model = this.model;
    var sequence = model.clone();
    sequence.setStickyEndFormat(sequence.STICKY_END_FULL);

    var forwardPrimer = sequence.get('forwardPrimer');
    var reversePrimer = sequence.get('reversePrimer');
    var stickyEnds = sequence.getStickyEnds();

    var features = [
    {
      name: 'Annealing region',
      _type: 'annealing_region',
      ranges: [{
        from: forwardPrimer.annealingRegion.range.from,
        to: forwardPrimer.annealingRegion.range.to - 1,
      }]
    },
    {
      name: 'Annealing region',
      _type: 'annealing_region',
      ranges: [{
        from: reversePrimer.annealingRegion.range.from,
        to: reversePrimer.annealingRegion.range.to -1,
      }]
    },
    {
      name: forwardPrimer.name,
      _type: 'primer',
      ranges: [{
        from: forwardPrimer.range.from,
        to: forwardPrimer.range.to - 1,
      }]
    },
    {
      name: reversePrimer.name,
      _type: 'primer',
      ranges: [{
        from: reversePrimer.range.from,
        to: reversePrimer.range.to - 1,
      }]
    },
    {
      name: stickyEnds.start.name + ' end',
      _type: 'sticky_end',
      ranges: [{
        from: 0,
        to: stickyEnds.start.size + stickyEnds.start.offset - 1
      }]
    },
    {
      name: stickyEnds.end.name + ' end',
      _type: 'sticky_end',
      ranges: [{
        from: sequence.getLength() - stickyEnds.start.size - stickyEnds.start.offset,
        to:  sequence.getLength() - 1
      }]
    }];


    sequence.set('features', features);

    return sequence;
  },

  showFormFn: function(event) {
    if(event) event.preventDefault();
    this.viewState = viewStates.form;
    this.render();
  },

  parentShowProduct: function(product) {
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

  //TODO refactor
  showCanvas: function(product, temporarySequence) {
    var view = this.canvasView = new CanvasView();
    this.setView('#pcr-canvas-container', view);

    if(product) {
      var id = product.get('id');
      view.setProduct(product);
      this.showingProductId = id;
      this.listView.$('.panel').removeClass('panel-info');
      this.listView.$('[data-product_id="'+id+'"]').addClass('panel-info');
    } else if(temporarySequence) {
      view.setSequence(temporarySequence);
    }

    view.render();
  },

  hideCanvas: function() {
    this.removeView('#pcr-canvas-container');
  }

  // deleteProduct: function(product) {
  //   var products = getPcrProductsFromSequence(this.model);
  //   var idx = products.indexOf(product);
  //   products.splice(idx, 1);
  //   savePcrProductsToSequence(this.model, products);
  //   if(_.isEmpty(products)) {
  //     this.showFormFn();
  //   } else {
  //     this.showProducts();
  //   }
  // },

});