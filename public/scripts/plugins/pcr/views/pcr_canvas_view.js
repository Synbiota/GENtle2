import Backbone from 'backbone';
import template from '../templates/pcr_canvas_view.hbs';
import Gentle from 'gentle';
import SequenceCanvas from '../../../sequence/lib/sequence_canvas';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import _ from 'underscore';
import Styles from '../../../styles.json';

var LineStyles = Styles.sequences.lines;
var featuresColors = LineStyles.features.color;
var defaultColor = LineStyles.complements.text.color;
var colors = {
  default: {
    text: defaultColor
  },
  annealingRegion: {
    fill: (featuresColors['type-annealing_region'] && featuresColors['type-annealing_region'].fill) || featuresColors._default.fill
  },
  stickyEnd: {
    fill: (featuresColors['type-sticky_end'] && featuresColors['type-sticky_end'].fill) || defaultColor
  }
};

export default Backbone.View.extend({
  manage: true,
  template: template,

  initialize: function() {
    _.bindAll(this, 'getSequenceColour');
    this.listenTo(Gentle, 'resize', function() {
      this.trigger('resize');
    });
  },

  getSequenceColour: function(base, pos, defaultColor) {
    defaultColor = defaultColor || colors.default.text;

    if(!this.product) return defaultColor;

    let forwardPrimer = this.product.get('forwardPrimer');
    let reversePrimer = this.product.get('reversePrimer');
    if(pos > forwardPrimer.range.to && pos <= reversePrimer.range.to) {
      return defaultColor;
    } else if(pos >= forwardPrimer.annealingRegion.range.from && pos <= reversePrimer.annealingRegion.range.from){
      return colors.annealingRegion.fill;
    } else {
      return colors.stickyEnd.fill;
    }
  },

  setProduct: function(product) {
    this.setSequence(product);
    this.product = product;
  },

  //TODO refactor this
  setSequence: function(sequence) {
    sequence = TemporarySequence.ensureTemporary(sequence);
    sequence.setStickyEndFormat('full');
    this.model = sequence;
  },

  afterRender: function() {
    if(!this.model) return;
    var sequenceCanvas = this.sequenceCanvas = new SequenceCanvas({
      view: this,
      $canvas: this.$('.sequence-canvas-container canvas').first(),
      lines: {
        topSeparator: ['Blank', { height: 5 }],
        position: ['Position', {
          height: 15,
          baseLine: 15,
          textFont: '10px Monospace',
          textColour: '#005',
          transform: _.formatThousands,
        }],
        dna: ['DNA', {
          height: 15,
          baseLine: 15,
          textFont: '15px Monospace',
          textColour: this.getSequenceColour,
          selectionColour: 'red',
          selectionTextColour: 'white',
        }],
        complements: ['DNA', {
          height: 15,
          baseLine: 15,
          textFont: LineStyles.complements.text.font,
          textColour: this.getSequenceColour,
          getSubSeq: this.model.getComplements,
        }],
        features: ['Feature', {
          unitHeight: 15,
          baseLine: 10,
          textFont: '10px Monospace',
          topMargin: 3,
          textPadding: 2,
          margin: 2,
          lineSize: 2,
          textColour: function(type) {
            var colors = LineStyles.features.color;
            type = 'type-'+type.toLowerCase();
            return (colors[type] && colors[type].color) || colors._default.color;
          },
          colour: function(type) {
            var colors = LineStyles.features.color;
            type = 'type-'+type.toLowerCase();
            return (colors[type] && colors[type].fill) || colors._default.fill;
          },
        }],
        bottomSeparator: ['Blank', { height: 5 }],
      },
    });
    
    sequenceCanvas.refresh();
  }
});