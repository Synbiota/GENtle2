import _ from 'underscore';
import template from '../templates/pcr_view.hbs';
import Backbone from 'backbone';
import FormView from './pcr_form_view';
import ProgressView from './pcr_progress_view';
import ProductView from './pcr_product_view';
import CanvasView from './pcr_canvas_view';
import Gentle from 'gentle';
import RdpPcrSequence from 'gentle-rdp/rdp_pcr_sequence';
import WipPcrProductSequence from '../lib/wip_product';
import RdpOligoSequence from 'gentle-rdp/rdp_oligo_sequence';
import WipRdpOligoSequence from 'gentle-rdp/wip_rdp_oligo_sequence';


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
    // 'click .show-new-pcr-product-form': 'showFormFn',
  },

  // `{showForm: showForm}={}` as first argument is required because
  // `var actualView = new primaryView.view(argumentsForView[0], argumentsForView[1], argumentsForView[2]);`
  // was replaced with `var actualView = new primaryView.view(...argumentsForView);`
  // in sequence_view and for some reason the default options are not
  // correctly passed by the Backbone View's
  // `this.initialize.apply(this, arguments);` so just having `{showForm}`
  // will throw an exception.
  initialize: function() { //{showForm: showForm}={}, argumentsForFormView={}) {
    this.model = Gentle.currentSequence;
    if(this.model instanceof RdpPcrSequence || this.model instanceof RdpOligoSequence) {
      this.viewState = viewStates.product;
    } else if(this.model instanceof WipPcrProductSequence || this.model instanceof WipRdpOligoSequence) {
      this.viewState = viewStates.form;
    }
    // var args = {model: this.model};
    // this.formView = new FormView(_.extend(argumentsForFormView, args));
    // this.progressView = new ProgressView(args);
  },

  makeFormView: function() {
    if(!this.formView) this.formView = new FormView({model: this.model});
    return this.formView;
  },

  makeProgressView: function() {
    if(!this.progressView) this.progressView = new ProgressView({model: this.model});
    return this.progressView;
  },

  beforeRender: function() {
    if(this.viewState === viewStates.form) {
      this.setView('.pcr-view-container', this.makeFormView());
      this.removeView('.pcr-view-container2');
    } else if(this.viewState === viewStates.product) {
      this.setView('.pcr-view-container', new ProductView({model: this.model}));
      this.showCanvas(null, this.getBluntEndedSequence());
      this.removeView('.pcr-view-container2');
    } else if(this.viewState === viewStates.progress) {
      this.setView('.pcr-view-container', this.makeFormView());
      this.setView('.pcr-view-container2', this.makeProgressView());
    }
  },

  getBluntEndedSequence() {
    var model = this.model;
    var sequence = model.clone();
    sequence.setStickyEndFormat(sequence.STICKY_END_FULL);

    var stickyEnds = sequence.getStickyEnds(true);
    var features = [];
    if(this.model instanceof RdpPcrSequence) {
      var forwardPrimer = sequence.get('forwardPrimer');
      var reversePrimer = sequence.get('reversePrimer');

      features = [
      {
        name: 'Annealing region',
        _type: 'annealing_region',
        ranges: [{
          from: forwardPrimer.annealingRegion.range.from,
          to: forwardPrimer.annealingRegion.range.to - 1,
          reverseComplement: false,
        }]
      },
      {
        name: 'Annealing region',
        _type: 'annealing_region',
        ranges: [{
          from: reversePrimer.annealingRegion.range.from,
          to: reversePrimer.annealingRegion.range.to -1,
          reverseComplement: true,
        }]
      },
      {
        name: forwardPrimer.name,
        _type: 'primer',
        ranges: [{
          from: forwardPrimer.range.from,
          to: forwardPrimer.range.to - 1,
          reverseComplement: false,
        }]
      },
      {
        name: reversePrimer.name,
        _type: 'primer',
        ranges: [{
          from: reversePrimer.range.from,
          to: reversePrimer.range.to - 1,
          reverseComplement: true,
        }]
      }];
    }
    features = features.concat([
      {
        name: stickyEnds.start.name + ' end',
        _type: 'sticky_end',
        ranges: [{
          from: 0,
          to: stickyEnds.start.size + stickyEnds.start.offset - 1,
          reverseComplement: false,
        }]
      },
      {
        name: stickyEnds.end.name + ' end',
        _type: 'sticky_end',
        ranges: [{
          from: sequence.getLength() - stickyEnds.start.size - stickyEnds.start.offset,
          to:  sequence.getLength() - 1,
          reverseComplement: true,
        }]
      }
    ]);

    _.each(features, (feature) => feature._id = _.uniqueId());
    sequence.set('features', features);

    return sequence;
  },

  /*
  showFormFn: function(event) {
    if(event) event.preventDefault();
    this.viewState = viewStates.form;
    this.render();
  },
  */

  makePrimers: function(wipRdpPcrSequence) {
    this.makeProgressView().makePrimers(wipRdpPcrSequence);
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

    // Probably don't need this call to render.  Will be double rendering.
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
