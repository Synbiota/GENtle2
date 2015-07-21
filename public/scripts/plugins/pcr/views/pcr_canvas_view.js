import Backbone from 'backbone';
import template from '../templates/pcr_canvas_view.hbs';
import Gentle from 'gentle';
import SequenceCanvas from 'gentle-sequence-canvas';
import _ from 'underscore';
import Styles from '../../../styles.json';
import RdpOligoSequence from 'gentle-rdp/rdp_oligo_sequence';


var LineStyles = Styles.sequences.lines;
var featuresColors = LineStyles.features.color;
var defaultColor = LineStyles.complements.text.color;
const StickyEndsStyles = Styles.rdp_parts.sticky_ends;
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
    _.bindAll(this, 'makeSequenceColourGetter');
    this.listenTo(Gentle, 'resize', function() {
      this.trigger('resize');
    });
  },

  makeSequenceColourGetter: function(reverseStrand) {
    var getSequenceColour = (base, pos, defaultColor) => {
      defaultColor = defaultColor || colors.default.text;
      var color = defaultColor;

      if(this.model instanceof RdpOligoSequence) {
        var stickyEnds = this.model.getStickyEnds(false);
        var len = this.model.getLength(this.model.STICKY_END_FULL);
        var white = '#FFF';
        var stickyEnd;

        if(pos < stickyEnds.start.size) {
          stickyEnd = stickyEnds.start;
        } else if(pos >= (len - stickyEnds.end.size)) {
          stickyEnd = stickyEnds.end;
        }
        if(stickyEnd) {
          if(stickyEnd.reverse !== reverseStrand) {
            color = white;
          } else {
            if(!~stickyEnd.name.indexOf('X')) {
              color = StickyEndsStyles.X.color;
            } else if (!~stickyEnd.name.indexOf('Z')) {
              color = StickyEndsStyles.Z.color;
            }
          }
        }
      } else {
        var forwardPrimer = this.model.get('forwardPrimer');
        var reversePrimer = this.model.get('reversePrimer');
        var black = 'black';

        if(!forwardPrimer || !reversePrimer) {
          if(pos < this.from || pos > this.to) {
            color = '#ddd';
          } else if(reverseStrand) {
            color = defaultColor;
          } else {
            color = black;
          }
        } else if(pos >= forwardPrimer.range.to && pos < reversePrimer.range.from) {
           color = defaultColor;
        } else if(pos >= forwardPrimer.annealingRegion.range.from && pos < reversePrimer.annealingRegion.range.to){
          color = colors.annealingRegion.fill;
        } else {
          color = colors.stickyEnd.fill;
        }
      }

      return color;
    };
    return getSequenceColour;
  },

  setProduct: function(product) {
    this.setSequence(product);
    this.product = product;
  },

  updateHighlight: function(frm = 0, to = this.model.getLength()) {
    this.from = frm;
    this.to = to;

    if(this.sequenceCanvas) {
      this.sequenceCanvas.refresh();
    }
  },

  setSequence: function(sequence) {
    sequence.setStickyEndFormat('full');
    this.model = sequence;
  },

  afterRender: function() {
    var sequence = this.model;
    if(!sequence) return;

    var lines = {
      topSeparator: ['Blank', { height: 5 }],
      position: ['Position', {
        height: 15,
        baseLine: 15,
        textFont: '10px Monospace',
        textColour: '#005',
        transform: _.formatThousands
      }],
      dna: ['DNA', {
        height: 15,
        baseLine: 15,
        textFont: '15px Monospace',
        textColour: this.makeSequenceColourGetter(false),
        selectionColour: 'red',
        selectionTextColour: 'white'
      }],
      complements: ['DNA', {
        height: 15,
        baseLine: 15,
        textFont: LineStyles.complements.text.font,
        textColour: this.makeSequenceColourGetter(true),
        getSubSeq: this.model.getComplements
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
        }
      }],
      bottomSeparator: ['Blank', { height: 5 }]
    };

    var sequenceCanvas = this.sequenceCanvas = new SequenceCanvas({
      sequence: sequence,
      container: this.$('.sequence-canvas-outlet').first(),
      lines: lines,
      selectable: false,
      editable: false
    });
    
    sequenceCanvas.refresh();
  }
});
