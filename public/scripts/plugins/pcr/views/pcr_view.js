import _ from 'underscore';
import template from '../templates/pcr_view.hbs';
import Backbone from 'backbone';
import FormView from './pcr_form_view';
import ProgressView from './pcr_progress_view';
import ProductView from './pcr_product_view';
import CanvasView from './pcr_canvas_view';
import Gentle from 'gentle';
import RdpPcrSequence from 'gentle-rdp/rdp_pcr_sequence';
import WipRdpPcrSequence from '../lib/wip_rdp_pcr_sequence';
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

  initialize: function() {
    var model = this.model = Gentle.currentSequence;
    if(model instanceof RdpPcrSequence || model instanceof RdpOligoSequence) {
      this.viewState = viewStates.product;
    } else if(model instanceof WipRdpPcrSequence || model instanceof WipRdpOligoSequence) {
      this.viewState = viewStates.form;
    }
    var canvasView = this.canvasView = new CanvasView();
    this.setView('#pcr-canvas-container', canvasView);

    if(model instanceof RdpOligoSequence) {
      let secondaryCanvasView = this.secondaryCanvasView = new CanvasView();
      this.setView('#pcr-canvas-container-2', secondaryCanvasView);
    }
  },

  makeFormView: function() {
    if(!this.formView) this.formView = new FormView({model: this.model});
    return this.formView;
  },

  makeProgressView: function() {
    if(!this.progressView) this.progressView = new ProgressView({model: this.model});
    return this.progressView;
  },

  serialize: function() {
    return {
      hasTwoCanvasViews: !!this.secondaryCanvasView
    };
  },

  beforeRender: function() {
    if(this.viewState === viewStates.form) {
      this.setView('.pcr-view-container', this.makeFormView());
      this.showCanvas(null, this.model);
      this.removeView('.pcr-view-container2');
    } else if(this.viewState === viewStates.product) {
      this.setView('.pcr-view-container', new ProductView({model: this.model}));
      let primarySequence = this.getBluntEndedSequence();
      let secondarySequence = this.secondaryCanvasView && this.getBluntEndedSequence(true);
      this.showCanvas(null, primarySequence, secondarySequence);
      this.removeView('.pcr-view-container2');
    } else if(this.viewState === viewStates.progress) {
      this.setView('.pcr-view-container', this.makeFormView());
      this.setView('.pcr-view-container2', this.makeProgressView());
    }
  },

  getBluntEndedSequence(rdpOligoReverseStrand = false) {
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

    if(!(model instanceof RdpOligoSequence) || !rdpOligoReverseStrand) {
      features.push({
        name: stickyEnds.start.name + ' end',
        _type: 'sticky_end',
        ranges: [{
          from: 0,
          to: stickyEnds.start.size + stickyEnds.start.offset - 1,
          reverseComplement: false,
        }]
      });
    }

    if(!(model instanceof RdpOligoSequence) || rdpOligoReverseStrand) {
      features.push({
        name: stickyEnds.end.name + ' end',
        _type: 'sticky_end',
        ranges: [{
          from: sequence.getLength() - stickyEnds.start.size - stickyEnds.start.offset,
          to: sequence.getLength() - 1,
          reverseComplement: true,
        }]
      });
    }

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
  showCanvas: function(product, temporarySequence, temporarySequence2 = undefined) {
    var {canvasView, secondaryCanvasView} = this;
    
    if(product) {
      var id = product.get('id');
      canvasView.setProduct(product);
      this.showingProductId = id;
      this.listView.$('.panel').removeClass('panel-info');
      this.listView.$('[data-product_id="'+id+'"]').addClass('panel-info');
    } else if(temporarySequence) {
      canvasView.setSequence(temporarySequence);
      if(secondaryCanvasView) {
        secondaryCanvasView.setSequence(temporarySequence2, true);
      }
    }
  },

  hideCanvas: function() {
    this.removeView('#pcr-canvas-container');
  },

  updateCanvasHighlight: function(frm, to) {
    this.canvasView.updateHighlight(frm, to);
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
