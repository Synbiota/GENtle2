import Backbone from 'backbone.mixed';
import template from '../templates/pcr_canvas_view.hbs';
import Gentle from 'gentle';
import SequenceCanvas from '../../../sequence/lib/sequence_canvas';
import Sequence from '../../../sequence/models/sequence';
import _ from 'underscore.mixed';
import Styles from '../../../styles.json';

var LineStyles = Styles.sequences.lines;

Gentle = Gentle();

export default Backbone.View.extend({
  manage: true,
  template: template,

  initialize: function() {
    _.bindAll(this, 'getSequenceColour');
  },

  getStickyEndOffsets: function() {
    var product = this.product;
    return !product.stickyEnds ? [0, 0] : [
      product.stickyEnds.start.length,
      -product.stickyEnds.end.length
    ];
  },

  getSequenceColour: function(base, pos, defaultColor) {
    var stickyEndOffsets = this.getStickyEndOffsets();
    var featuresColors = LineStyles.features.color;
    var sequenceLength = this.model.length();
    var startPrimerLength = this.product.startPrimer.sequence.length;
    var endPrimerLength = this.product.endPrimer.sequence.length;

    defaultColor = defaultColor || LineStyles.complements.text.color;

    if(pos < stickyEndOffsets[0] || pos > sequenceLength + stickyEndOffsets[1] -1) {
      return (featuresColors.sticky_end && featuresColors.sticky_end.fill) || defaultColor;
    } else if(pos < stickyEndOffsets[0] + startPrimerLength || pos >= sequenceLength + stickyEndOffsets[1] - endPrimerLength){
      return (featuresColors.primer && featuresColors.primer.fill) || defaultColor;
    } else {
      return defaultColor;
    }
  },

  setProduct: function(product) {
    this.product = product;
    var sequence = Gentle.currentSequence.get('sequence');
    var stickyEndOffsets = this.getStickyEndOffsets();
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
      name: 'Primer',
      _type: 'primer',
      ranges: [{
        from: 0,
        to: product.startPrimer.to + stickyEndOffsets[0],
      }]
    },{
      name: 'Primer',
      _type: 'primer',
      ranges: [{
        from: sequence.length - product.endPrimer.sequence.length + stickyEndOffsets[1],
        to: sequence.length - 1
      }]
    }]);

    this.model = new Sequence({
      sequence: sequence,
      name: product.name,
      features: features
    });

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