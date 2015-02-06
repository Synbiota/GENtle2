import template from '../templates/pcr_view.hbs';
import Backbone from 'backbone.mixed';
import StickyEnds from '../../../common/lib/sticky_ends';
import PrimerDesign from '../lib/pcr_primer_design';
import ListView from './pcr_list_view';
import CanvasView from './pcr_canvas_view';
import Gentle from 'gentle';
import Sequence from '../../../sequence/models/sequence';

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

  extractFieldsData: function() {
    return _.reduce(_.toArray(arguments), (memo, field) => {
      var $field = this.$('#newProduct_'+field);
      memo[field] = $field.val();
      if($field.attr('type') == 'number') memo[field] = memo[field]^0;
      return memo;
    }, {});
  },

  getFormData: function() {
    var data = this.extractFieldsData(
      'from', 'to', 'name', 'meltingTemperatureFrom',
      'meltingTemperatureTo'
    );
    return _.extend(data, {
      from: data.from - 1,
      to: data.to - 1,
      stickyEnds: _.find(StickyEnds, {name: this.$('#newProduct_stickyEnds').val()})
    });
  },

  createNewPcrProduct: function(event) {
    event.preventDefault();

    var data = this.getFormData();

    var sequence = Gentle.currentSequence;

    var product = _.extend(PrimerDesign.getPCRProduct(sequence, data), {
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

  getStickyEndOffsets: function(product) {
    return !product.stickyEnds ? [0, 0] : [
      product.stickyEnds.start.length,
      -product.stickyEnds.end.length
    ];
  },

  getSequenceFromProduct: function(product) {

    console.log(product)
    var sequence = Gentle.currentSequence.getSubSeq(product.from, product.to);
    var stickyEndOffsets = this.getStickyEndOffsets(product);
    var features = [];

    if(product.stickyEnds) {
      sequence = product.stickyEnds.start + sequence + product.stickyEnds.end;

      features = features.concat([{
        name: 'Sticky end',
        _type: 'sticky_end',
        ranges: [{
          from: 0,
          to: product.stickyEnds.start.length-1
        }]
      }],[{
        name: 'Sticky end',
        _type: 'sticky_end',
        ranges: [{
          from: sequence.length - product.stickyEnds.end.length,
          to: sequence.length-1
        }]
      }]);
    }

    features = features.concat([{
      name: 'Forward primer',
      _type: 'primer',
      ranges: [{
        from: 0,
        to: product.forwardPrimer.to,
      }]
    },{
      name: 'Reverse primer',
      _type: 'primer',
      ranges: [{
        from: sequence.length - product.reversePrimer.sequence.length,
        to: sequence.length - 1
      }]
    }]);

    return new Sequence({
      sequence: sequence,
      name: product.name,
      features: features
    });
  },

  serialize: function() {
    return {
      availableStickyEnds: _.map(StickyEnds, function(end) {
        return {
          name: end.name,
          value: end.name
        };
      }),
      defaultFrom: 1,
      defaultTo: Gentle.currentSequence.length(),
      defaultTemperatureFrom: 57,
      defaultTemperatureTo: 62

    };
  }

});