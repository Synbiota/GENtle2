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
      var id = product.get('id');
      view.setProduct(product);  //TODO refactor
      this.showingProductId = id;
      this.listView.$('.panel').removeClass('panel-info');
      this.listView.$('[data-product_id="'+id+'"]').addClass('panel-info');
    } else if(temporarySequence) {
      view.setSequence(temporarySequence);  //TODO refactor
    }

    view.render();
  },

  hideCanvas: function() {
    this.removeView('#pcr-canvas-container');
  },

  getProducts: function() {
    var attributesOfProducts = this.model.get('meta.pcr.products') || [];
    return _.map(attributesOfProducts, (productAttributes) => new TemporarySequence(productAttributes));
  },

  saveProducts: function(products) {
    // Originally the model attributes were just stored and handled as a hash,
    // we know want to use a model to handle them.
    // We call stringify -> parse, to convert everything: vanilla hashes and
    // backbone models into vanilla hashes.
    var serialisedProducts = JSON.parse(JSON.stringify(products));
    return this.model.set('meta.pcr.products', serialisedProducts).throttledSave();
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

});