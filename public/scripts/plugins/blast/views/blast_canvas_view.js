import Backbone from 'backbone';
import template from '../templates/blast_canvas_view.hbs';
import Gentle from 'gentle';
import SequenceCanvas from '../../../sequence/lib/sequence_canvas';

export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'click .next-mismatch': 'nextMismatch'
  },

  initialize: function() {
    this.mismatches = [];

    this.listenTo(Gentle, 'resize', function() {
      this.trigger('resize');
    });

    _.bindAll(this,
      'getHitDnaSeq', 'transformHitPosition', 'getMidLine',
      'getHitDnaColour'
    );
  },

  serialize: function() {
    return {
      result: this.result,
      hsp: this.hsp,
      mismatchCount: this.mismatches.length
    };
  },

  beforeRender: function() {
    var parentView = this.parentView();
    var mismatchRegexp = new RegExp('[^'+String.fromCharCode(124)+']+', 'g')
    var mismatches = this.mismatches = [];
    var match;

    this.currentMismatch = undefined;

    if(parentView) {
      this.blastRequest = this.blastRequest || parentView.blastRequest;
      this.result = _.find(this.blastRequest.results, {id: parentView.resultId});
      this.model = Gentle.currentSequence;

      if(this.result) {
        var hsp = this.hsp = _.find(this.result.hsps, {id: parentView.hspId});

        while ((match = mismatchRegexp.exec(hsp.midline)) !== null) {
          mismatches.push({
            from: hsp.queryFrom + match.index,
            to: hsp.queryFrom + match.index + match[0].length
          });
        }
      }
    }
  },

  nextMismatch: function(event) {
    event.preventDefault();
    this.scrollToNextMismatch();
  },

  scrollToNextMismatch: function(reverse) {
    var step = reverse ? -1 : 1;
    var sequenceCanvas = this.sequenceCanvas;

    if(_.isUndefined(this.currentMismatch)) {
      this.currentMismatch = 0;
    } else {
      this.currentMismatch = (this.currentMismatch + step) % this.mismatches.length;
    }

    var currentMismatch = this.mismatches[this.currentMismatch];

    sequenceCanvas.highlightBaseRange(currentMismatch.from, currentMismatch.to);

    sequenceCanvas.afterNextRedraw(function() {
      sequenceCanvas.scrollBaseToVisibility(currentMismatch.from);
    });


  },

  getHitDnaSeq: function(queryStart, queryEnd, useMidLine) {
    useMidLine = useMidLine || false;

    var hitStart = this.hsp.queryFrom;
    var hitEnd = this.hsp.queryTo;
    var output = '';

    if(queryEnd >= hitStart && queryStart <= hitEnd) {
      if(queryStart < hitStart)
        output += Array(hitStart - queryStart + 1).join(' ');

      output += (useMidLine ? this.hsp.midline : this.hsp.hseq).substr(
        Math.max(0, queryStart-hitStart),
        queryEnd - queryStart + 1
      );
    }

    return output;
  },

  getMidLine: function(queryStart, queryEnd) {
    return this.getHitDnaSeq(queryStart, queryEnd, true);
  },

  getHitDnaColour: function(base, pos) {
    var hitStart = this.hsp.queryFrom;
    var hitEnd = this.hsp.queryTo;

    // console.log(hitStart, hitEnd, pos, this.hsp.hseq.charCodeAt(pos - hitStart))
    //this.hsp.hseq.charCodeAt(pos - hitStart)
    if(hitStart <= pos && hitEnd >= pos) {
      if(this.hsp.midline.charCodeAt(pos - hitStart) != 124) {
        return 'red';
      } else {
        return '#ccc';
      }
    } else {
      return 'white';
    }
  },

  transformHitPosition: function(queryPosition) {
    var hitStart = this.hsp.queryFrom;
    var hitEnd = this.hsp.queryTo;
    if(queryPosition >= hitStart && queryPosition <= hitEnd) {
      return _.formatThousands(queryPosition - hitStart + this.hsp.hitFrom);
    } else {
      return '';
    }
  },

  initAlignCanvas: function() {
    var queryFrom = this.hsp.queryFrom;
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
          textColour: 'black',
          selectionColour: 'red',
          selectionTextColour: 'white'
        }],
        midLine: ['DNA', {
          height: 13,
          baseLine: 12,
          leftMargin: 1.5,
          textFont: '10px Monospace',
          textColour: '#ccc',
          getSubSeq: this.getMidLine
        }],
        hitDna: ['DNA', {
          height: 15,
          baseLine: 15,
          textFont: '15px Monospace',
          getSubSeq: this.getHitDnaSeq,
          textColour: this.getHitDnaColour
        }],
        features: ['Feature', {
          unitHeight: 15,
          baseLine: 10,
          textFont: '10px Monospace',
          topMargin: 3,
          features: [{
            id: 'matchSequence',
            name: 'Matched sequence',
            ranges: [{from: queryFrom, to: this.hsp.queryTo}]
          }],
          textColour: '#000',
          textPadding: 2,
          margin: 2,
          lineSize: 2,
          colour: '#ddd',
        }],
        hitPosition: ['Position', {
          height: 15,
          baseLine: 13,
          textFont: '10px Monospace',
          textColour: 'blue',
          transform: this.transformHitPosition,
        }],
        bottomSeparator: ['Blank', { height: 5 }],
      },
      stickyEndFormat: "full",
    });

    sequenceCanvas.refresh();

    sequenceCanvas.afterNextRedraw(function() {
      sequenceCanvas.scrollToBase(queryFrom);
    });
  },

  initDefaultCanvas: function() {
    var sequenceCanvas = this.sequenceCanvas = new SequenceCanvas({
      view: this,
      $canvas: this.$('.sequence-canvas-container canvas').first(),
      lines: {
        topSeparator: ['Blank', { height: 5 }],
        position: ['Position', {
          height: 15,
          baseLine: 15,
          textFont: '10px Monospace',
          textColour: '#bbb',
          transform: _.formatThousands,
        }],
        dna: ['DNA', {
          height: 15,
          baseLine: 15,
          textFont: '15px Monospace',
          textColour: '#bbb',
          selectionColour: 'red',
          selectionTextColour: 'white'
        }],
        bottomSeparator: ['Blank', { height: 5 }],
      },
    });

    sequenceCanvas.refresh();
  },

  afterRender: function() {
    if(this.result) {
      this.initAlignCanvas();
    } else {
      this.initDefaultCanvas();
    }
  }
});
