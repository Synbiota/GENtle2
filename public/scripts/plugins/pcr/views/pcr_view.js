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
    this.products = this.model.get('meta.pcr.products') || [];
    this.defaults = _.defaults(this.model.get('meta.pcr.defaults') || {}, {
      from: 0,
      to: this.model.length()-1,
      targetMeltingTemperature: 68
    });

    this.listView = new ListView();
    this.setView('.pcr-list-container', this.listView);
  },

  events: {
    'submit .new-pcr-product-form': 'createNewPcrProduct',
    'keyup #newProduct_from, #newProduct_to': 'updateTemporarySequence',
    'click .toggle-new-pcr-product-form, .cancel-new-pcr-product-form': 'toggleForm'
  },

  getFieldFor: function(field) {
    return this.$('#newProduct_'+field);
  },

  extractFieldsData: function() {
    return _.reduce(_.toArray(arguments), (memo, field) => {
      var $field = this.getFieldFor(field);
      memo[field] = $field.val();
      if($field.attr('type') == 'number') memo[field] = memo[field]^0;
      return memo;
    }, {});
  },

  getFormData: function() {
    var data = this.extractFieldsData(
      'from', 'to', 'name', 'targetMeltingTemperature'
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

    var sequence = this.model;

    this.$('.new-pcr-product-form').hide();
    this.$('.new-pcr-progress').show();
    this.$('.new-pcr-progress .progress-bar').css('width', 0);

    PrimerDesign.getPCRProduct(sequence, data).then((product) => {

      _.extend(product, {
        name: data.name
      });

      this.products.push(product);

      sequence.set('meta.pcr.products', this.products);
      sequence.set('meta.pcr.defaults', _.omit(data, 'name', 'from', 'to', 'stickyEnds'));
      sequence.throttledSave();

      this.getFieldFor('name').val('');      
      this.$('.new-pcr-product-form').show();
      this.$('.new-pcr-progress').hide();

      this.listView.render();
      this.hideCanvas();
      this.showCanvas(product);
      this.toggleForm();

    }).progress((progress) => {

      this.$('.new-pcr-progress .progress-bar').css('width', progress*100+'%');

    }).catch((e) => console.log(e));
    
  },

  showCanvas: function(product) {
    var view = new CanvasView();
    this.setView('#pcr-canvas-container', view);

    if(product) {
      view.setProduct(product);
      this.showingProductId = product.id;
      this.listView.$('.panel').removeClass('panel-info');
      this.listView.$('[data-product-id="'+product.id+'"]').addClass('panel-info');
    } else if(this.temporarySequence) {
      view.setSequence(this.temporarySequence);
    }

    view.render();
  },

  hideCanvas: function() {
    this.removeView('#pcr-canvas-container');
  },

  deleteProduct: function(product) {
    var idx = this.products.indexOf(product);
    if(~idx) {
      if(this.showingProductId == product.id) {
        this.hideCanvas();
        this.showingProductId = null;
      }
      this.products.splice(idx, 1);
      this.model.set('meta.pcr.products', this.products).throttledSave();
      this.listView.render();
      if(_.isEmpty(this.products)) this.toggleForm();
    }
  },

  getStickyEndOffsets: function(product) {
    return !product.stickyEnds ? [0, 0] : [
      product.stickyEnds.start.length,
      -product.stickyEnds.end.length
    ];
  },

  getSequenceFromProduct: function(product) {

    var sequence = Gentle.currentSequence.getSubSeq(product.from, product.to);
    var stickyEndOffsets = this.getStickyEndOffsets(product);
    var features = [];

    if(product.stickyEnds) {
      sequence = product.stickyEnds.start + sequence + product.stickyEnds.end;

      features = features.concat([{
        name: product.stickyEnds.startName + ' end',
        _type: 'sticky_end',
        ranges: [{
          from: 0,
          to: product.stickyEnds.start.length-1
        }]
      }, {
        name: product.stickyEnds.endName + ' end',
        _type: 'sticky_end',
        ranges: [{
          from: sequence.length - product.stickyEnds.end.length,
          to: sequence.length-1
        }]
      }, {
        name: 'Annealing region',
        _type: 'annealing_region',
        ranges: [{
          from: stickyEndOffsets[0],
          to: stickyEndOffsets[0] + product.forwardPrimer.to,
        }]
      }, {
        name: 'Annealing region',
        _type: 'annealing_region',
        ranges: [{
          from: sequence.length + stickyEndOffsets[1] - product.reversePrimer.sequence.length,
          to: sequence.length + stickyEndOffsets[1] - 1
        }]
      }, {
        name: 'Forward primer',
        _type: 'primer',
        ranges: [{
          from: 0,
          to: stickyEndOffsets[0] + product.forwardPrimer.to,
        }]
      }, {
        name: 'Reverse primer',
        _type: 'primer',
        ranges: [{
          from: sequence.length + stickyEndOffsets[1] - product.reversePrimer.sequence.length,
          to: sequence.length - 1
        }]
      }]);
    }

    return new Sequence({
      sequence: sequence,
      name: product.name,
      features: features
    });
  },

  updateRange: function(from, to) {
    this.getFieldFor('from').val(from);
    this.getFieldFor('to').val(to);
    this.getFieldFor('name').focus();
  },

  toggleForm: function(event) {
    var product;
    if(event) event.preventDefault();
    this.$('.new-pcr-product-form-container, .pcr-list-container, .toggle-new-pcr-product-form').toggle();

    if(!_.isEmpty(this.products)) {
      this.$('.cancel-new-pcr-product-form').show();
    } else {
      this.$('.cancel-new-pcr-product-form').hide();
    }

    this.hideCanvas();

    if(!this.temporarySequence) {
      this.temporarySequence = new Sequence({
        sequence: this.getTemporarySequence()
      });
    } else {
      this.temporarySequence = null;
      product = _.find(this.products, {id: this.showingProductId});
      if(product) {
        this.showCanvas(product);
      }
    }

    if(!product) this.showCanvas();
  },

  getTemporarySequence: function() {
    var from = this.getFieldFor('from').val() - 1;
    var to = this.getFieldFor('to').val() - 1;
    return this.model.get('sequence').substr(from, to - from + 1);
  },

  updateTemporarySequence: function(event) {
    var sequence = this.temporarySequence;
    if(sequence) sequence.set('sequence', this.getTemporarySequence());
  },

  serialize: function() {
    return {
      availableStickyEnds: _.map(StickyEnds, function(end) {
        return {
          name: end.name,
          value: end.name
        };
      }),
      defaults: this.defaults
    };
  },

  afterRender: function() {
    if(_.isEmpty(this.products)) {
      this.toggleForm();
    }
  }

});