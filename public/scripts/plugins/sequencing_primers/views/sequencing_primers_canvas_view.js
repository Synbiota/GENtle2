import Backbone from 'backbone.mixed';
import template from '../templates/sequencing_primers_canvas_view.hbs';
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
    this.listenTo(Gentle, 'resize', function() {
      this.trigger('resize');
    });
  },

  setSequence: function() {
    this.model = this.parentView().getSequence();
    this.afterSet();
  },

  afterSet: function() {
    if(this.model) {
      this.model.save = _.noop;
      this.getComplements = _.partial(this.model.getTransformedSubSeq, 'complements', {});
    }
  },

  afterRender: function() {
    this.setSequence();
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
          textColour: '#bbb',
        }],
        complements: ['DNA', {
          height: 15,
          baseLine: 15,
          textFont: LineStyles.complements.text.font,
          textColour: '#bbb',
          // getSubSeq: this.getComplements,
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