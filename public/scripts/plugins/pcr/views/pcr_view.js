import template from '../templates/pcr_view.hbs';
import Backbone from 'backbone';
import FormView from './pcr_form_view';
import ProgressView from './pcr_progress_view';
import ListView from './pcr_list_view';
import CanvasView from './pcr_canvas_view';
import Gentle from 'gentle';
import {getPcrProductsFromSequence, savePcrProductsToSequence} from '../lib/utils';
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

    var products = getPcrProductsFromSequence(this.model);
    savePcrProductsToSequence(this.model, products);

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

  //TODO refactor
  showCanvas: function(product, temporarySequence) {
    var view = new CanvasView();
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
  },

  deleteProduct: function(product) {
    var products = getPcrProductsFromSequence(this.model);
    var idx = products.indexOf(product);
    products.splice(idx, 1);
    savePcrProductsToSequence(this.model, products);
    if(_.isEmpty(products)) {
      this.showFormFn();
    } else {
      this.showProducts();
    }
  },

});