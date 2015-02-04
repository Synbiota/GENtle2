import template from '../templates/pcr_view.hbs';
import Backbone from 'backbone.mixed';
import StickyEnds from '../../../common/lib/sticky_ends';
import PrimerDesign from '../lib/pcr_primer_design';
import ListView from './pcr_list_view';
import CanvasView from './pcr_canvas_view';
import Gentle from 'gentle';

Gentle = Gentle();

export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'pcr',

  initialize: function() {
    this.model = Gentle.currentSequence;
    this.products = [];
    this.listView = new ListView();
    this.setView('.pcr-list-container', this.listView);
  },

  events: {
    'submit .new-pcr-product-form': 'createNewPcrProduct'
  },

  getFormData: function() {
    return {
      from: this.$('#newProduct_from').val(),
      to: this.$('#newProduct_to').val(),
      name: this.$('#newProduct_name').val(),
      targetMeltingTemperature:  this.$('#newProduct_meltingTemperature').val(),
      stickyEnds: _.find(StickyEnds, {name: this.$('#newProduct_stickyEnds').val()})
    };
  },

  createNewPcrProduct: function(event) {
    event.preventDefault();

    var data = this.getFormData();

    console.log('data', data)
    var sequence = Gentle.currentSequence.getSubSeq(data.from, data.to);

    var product = _.extend(PrimerDesign.getPCRProduct(sequence, _.pick(data, 
      'targetMeltingTemperature',
      'stickyEnds'
    )), {
      name: data.name
    });

    this.products.push(product);

    this.listView.render();
    this.showCanvas(product);
  },

  showCanvas: function(product) {
    var view = new CanvasView();
    this.setView('#pcr-canvas-container', view);
    view.setProduct(product);
    view.render();
    this.showingProductId = product.id;
    this.listView.$('.panel').removeClass('panel-info');
    this.listView.$('[data-product-id="'+product.id+'"]').addClass('panel-info');
  },

  deleteProduct: function(product) {
    var idx = this.products.indexOf(product);
    if(~idx) {
      if(this.showingProductId == product.id) this.removeView('#pcr-canvas-container');
      this.products.splice(idx, 1);
      this.listView.render();
    }
  },

  serialize: function() {
    return {
      availableStickyEnds: _.map(StickyEnds, function(end) {
        return {
          name: end.name,
          value: end.name
        };
      }),
      defaultFrom: 0,
      defaultTo: Gentle.currentSequence.length()-1,
      defaultTemperature: 65
    };
  }

});