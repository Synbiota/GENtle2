import Backbone from 'backbone.mixed';
import template from '../templates/pcr_canvas_view.hbs';
import Gentle from 'gentle';
import SequenceCanvas from '../../../sequence/lib/sequence_canvas';
import _ from 'underscore.mixed';
import Styles from '../../../styles.json';

var LineStyles = Styles.sequences.lines;

Gentle = Gentle();

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
    defaultColor = defaultColor || LineStyles.complements.text.color;

    if(!this.product) return defaultColor;

    var stickyEndOffsets = this.parentView().getStickyEndOffsets(this.product);
    var featuresColors = LineStyles.features.color;
    var sequenceLength = this.model.length();
    var forwardPrimerLength = this.product.forwardPrimer.sequence.length;
    var reversePrimerLength = this.product.reversePrimer.sequence.length;

    if(pos < stickyEndOffsets[0] || pos > sequenceLength + stickyEndOffsets[1] -1) {
      return (featuresColors.sticky_end && featuresColors.sticky_end.fill) || defaultColor;
    } else if(pos < forwardPrimerLength + stickyEndOffsets[0] || pos >= sequenceLength - reversePrimerLength + stickyEndOffsets[1]){
      return (featuresColors.annealing_region && featuresColors.annealing_region.fill) || featuresColors._default.fill;
    } else {
      return defaultColor;
    }
  },

  setProduct: function(product) {
    this.product = product;
    this.model = this.parentView().getSequenceFromProduct(product);
    this.afterSet();
  },

  setSequence: function(sequence) {
    this.model = sequence;
    this.afterSet();
  },

  afterSet: function() {
    this.model.save = _.noop;
    this.getComplements = _.partial(this.model.getTransformedSubSeq, 'complements', {});
  },

  afterRender: function() {
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
        }],
        complements: ['DNA', {
          height: 15,
          baseLine: 15,
          textFont: LineStyles.complements.text.font,
          textColour: this.getSequenceColour,
          getSubSeq: this.getComplements,
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
            type = type.toLowerCase();
            return (colors[type] && colors[type].color) || colors._default.color;
          },
          colour: function(type) {
            var colors = LineStyles.features.color;
            type = type.toLowerCase();
            return (colors[type] && colors[type].fill) || colors._default.fill;
          },
        }],
        bottomSeparator: ['Blank', { height: 5 }],
      },
    });
    
    sequenceCanvas.refresh();
  }
});