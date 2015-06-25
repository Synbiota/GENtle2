import Backbone from 'backbone.mixed';
import template from '../templates/sequencing_primers_canvas_view.hbs';
import Gentle from 'gentle';
import SequenceCanvas from 'gentle-sequence-canvas';
import _ from 'underscore.mixed';
import Styles from '../../../styles.json';

var LineStyles = Styles.sequences.lines;

export default Backbone.View.extend({
  manage: true,
  template: template,

  initialize: function() {
    this.listenTo(Gentle, 'resize', function() {
      this.trigger('resize');
    });
    this.onScroll = _.throttle(_.bind(this.onScroll, this), 300);
    this._previousBaseRange = [];
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

  onScroll: function(event, data) {
    if(data && !_.isUndefined(data.yOffset) && !this._freezeScrolling) {
      let canvasHeight = this.$('canvas').height();

      let baseRange = [
        this.sequenceCanvas.getBaseRangeFromYPos(data.yOffset + 10)[0],
        this.sequenceCanvas.getBaseRangeFromYPos(data.yOffset + canvasHeight - 10)[1]
      ];

      if(baseRange[0] !== this._previousBaseRange[0] || baseRange[1] !== this._previousBaseRange[1]) {
        this.parentView().productsView.scrollToFirstProductInRange(baseRange);
      }

      this._previousBaseRange = baseRange;
    }
  },

  getFeatures: function(reverse = false) {
    return _.filter(this.model.getFeatures(), function(feature) {
      var isReverse = !feature.ranges[0].reverseComplement;
      return reverse ? !isReverse : isReverse;
    });
  },

  afterRender: function() {
    this.setSequence();
    var sequence = this.model;
    if(!sequence) return;

    var topFeatures = this.getFeatures();
    var bottomFeatures = this.getFeatures(true);
    var colors = LineStyles.features.color['type-primer'];

    var featuresConfig = {
      unitHeight: 14,
      baseLine: 10,
      textFont: '10px Monospace',
      topMargin: 3,
      textPadding: 3,
      margin: 2,
      lineSize: 2,
      textColour: colors.color,
      colour: colors.fill
    };

    var lines = {
      topSeparator: ['Blank', { height: 5 }],
      position: ['Position', {
        height: 15,
        baseLine: 15,
        textFont: '10px Monospace',
        textColour: '#005',
        transform: _.formatThousands
      }],
      topFeatures: ['Feature', _.extend({
        features: topFeatures
      }, featuresConfig)],
      dna: ['DNA', {
        height: 15,
        baseLine: 15,
        textFont: '15px Monospace',
        textColour: '#bbb',
        selectionColour: 'red',
        selectionTextColour: 'white'
      }],
      complements: ['DNA', {
        height: 15,
        baseLine: 15,
        textFont: LineStyles.complements.text.font,
        textColour: '#bbb',
        getSubSeq: this.getComplements
      }],
      bottomFeatures: ['Feature', _.extend({
        features: bottomFeatures
      }, featuresConfig)],
      bottomSeparator: ['Blank', { height: 5 }]
    };

    var sequenceCanvas = this.sequenceCanvas = new SequenceCanvas({
      sequence: sequence,
      container: this.$('.sequence-canvas-outlet').first(),
      lines: lines,
      editable: false
    });
    
    sequenceCanvas.on('scroll', this.onScroll);
    sequenceCanvas.on('feature:click', (event, data) => {
      this.trigger('feature:click', event, data);
    });
  },

  cleanup: function() {
    if(this.sequenceCanvas) this.sequenceCanvas.destroy();
  }
});
