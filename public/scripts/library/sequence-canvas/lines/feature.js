import Line from './line';
import _ from 'underscore';
import switchSequenceContext from './_switch_sequence_context';
import drawAnnotation from './_feature_draw_annotation';
import drawPrimer from './_feature_draw_primer';
import SVG from 'svg.js';
import tooltip from 'tooltip';
import tooltipTemplate from './_feature_tooltip_template.html';


function onMouseOver(sequenceCanvas, featureClass, name, rangeFrom, rangeTo) {
  SVG.select('.'+featureClass).addClass('active');
  tooltip.show(tooltipTemplate({
    name,
    from: _.formatThousands(rangeFrom + 1),
    to: _.formatThousands(rangeTo + 1),
    size: _.formatThousands(rangeTo - rangeFrom + 1)
  }));
  sequenceCanvas.highlightBaseRange(rangeFrom, rangeTo);
}

function onMouseLeave(sequenceCanvas, featureClass) {
  SVG.select('.'+featureClass).removeClass('active');
  tooltip.hide();
  sequenceCanvas.highlightBaseRange();
}

function onMouseDown(sequenceCanvas, rangeFrom, rangeTo, id, event) {
  event.stopPropagation();
  sequenceCanvas.select(rangeFrom, rangeTo);
  sequenceCanvas.scrollBaseToVisibility(rangeTo).then(function() {
    sequenceCanvas.displayCaret(rangeTo+1);
  });
  sequenceCanvas.trigger('feature:click', {featureId: id});
}

/**
Line class for displaying bases on SequenceCanvas. 
Options are: 

- `this.height`: line height.
- `this.baseLine`: text baseline.
- `this.textColour`: colour of the text. can be a function taking the character as argument.
- `this.textFont`: font style of the text. 
- `this.textPadding`
- `this.colour`: colour of the feature 
- `this.margin`
- `this.lineSize`
@class Lines.DNA
@module Sequence
@submodule SequenceCanvas
@extends Lines.Line
**/
class Feature extends Line {
  constructor(sequenceCanvas, options) {
    super(sequenceCanvas, options);
    this.memoize('maxNbFeaturesPerRow', 'change:features')
  }

  /**
  Returns the value by which to sort features. (i.e. lowest range starting base).
  Use with _.sortBy.
  @method featureSortedBy
  @param {object} feature
  @returns {integer}
  **/
  featureSortedBy(feature) {
    return _.min(_.pluck(feature.ranges, 'from'));
  }

  /**
  Checks whether two features overlap

  *Not used*

  @method featuresOverlap
  @param {object} feature1
  @param {object} feature2
  @returns {boolean}
  **/
  // featuresOverlap(feature1, feature2) {
  //   if(feature1 == feature2) return false;
  //   return _.some(feature1.ranges, function(range1) {
  //     return _.some(feature2.ranges, function(range2) {
  //       return range2.to >= range1.from && range2.from <= range1.to;
  //     });
  //   });
  // };
  

  /**
  Checks whether one of the ranges of a feature ends in a give base range

  *Not used*

  @method featureEndInRange
  @param {object} feature
  @param {integer} startBase
  @param {integer} endBase
  @returns {boolean}
  **/
  // featureEndInRange(feature, startBase, endBase) {
  //   return _.some(feature.ranges, function(range) {
  //     return range.from <= startBase && range.to <= endBase;
  //   });

  // };

  /**
  Returns the max number of ranges to be found in one row for the entire sequence

  @method maxNbFeaturesPerRange
  @returns {integer}
  **/
  maxNbFeaturesPerRow() {
    var nbFeatures      = [],
        sequenceCanvas  = this.sequenceCanvas,
        sequence        = sequenceCanvas.sequence,
        basesPerRow     = sequenceCanvas.layoutHelpers.basesPerRow;

    for(var i = 0; i <= Math.floor(sequence.getLength() / basesPerRow); i++) {
      nbFeatures.push(this.nbFeaturesInRange(i * basesPerRow, (i+1) * basesPerRow - 1));
    }
    return nbFeatures.length ? _.max(nbFeatures) : 0;

  }

  /**
  Sets the `this.height` attribute based on the max nb of features pe row
  @method calculateHeight
  **/
  calculateHeight() {
    this.height = this.unitHeight * this.maxNbFeaturesPerRow() + (this.topMargin || 0);
  }

  /**
  Draws the featuresf or a given range
  @method draw
  @param {integer} y Start y position
  @param {array} baseRange 
  **/
  draw(y, baseRange) {
    var sequenceCanvas = this.sequenceCanvas;
    var {layoutSettings, svg} = sequenceCanvas;
    var baseWidth = layoutSettings.basePairDims.width;
    var row = sequenceCanvas.getAbsRowFromYPos(y);

    var featuresRowClass = `${sequenceCanvas.id}-features-${this.lineName}-row-${row}`;
    if(document.getElementsByClassName(featuresRowClass).length) return;

    var features = _(this.featuresInRange(baseRange[0], baseRange[1])).sortBy(this.featureSortedBy);

    if(features.length === 0) sequenceCanvas.addChildrenPlaceholder(featuresRowClass);

    y += (this.topMargin || 0) + sequenceCanvas.layoutHelpers.yOffset;

    _.each(features, (feature, i) => {
      // Features can have multiple ranges
      var ranges = this.filterRanges(baseRange[0], baseRange[1], feature.ranges);
      _.each(ranges, (range) => {

        var frm = range.from;
        var to = range.to;

        if(range.from > range.to) {
          frm = range.to + 1;
          to = range.from;
        }

        var startX = sequenceCanvas.getXPosFromBase(Math.max(frm, baseRange[0]));
        var endX   = sequenceCanvas.getXPosFromBase(Math.min(to, baseRange[1]));
        var deltaX = endX - startX + 1 + baseWidth;

        var groupId = `svg-feature-${feature._id}-${baseRange[0]}-${baseRange[1]}`;

        if(SVG.get(groupId)) return null;

        var featureClass = `svg-feature-${feature._id}`;
        var shape = svg.group().addClass(
          `feature ${featuresRowClass} feature-type-${feature._type} ${featureClass}`
        ).attr('id', groupId);

        var currentY = y + i*this.unitHeight;

        var drawFunction = feature._type === 'primer' ? drawPrimer : drawAnnotation;
        var eventRegion = drawFunction(this, shape, {
          feature, range, row, startX, deltaX, i, baseRange, 
          y: currentY,
          rangeFrom: frm,
          rangeTo: to
        });

        eventRegion.addClass('event-region');

        eventRegion.on('mouseover', _.partial(
          onMouseOver, 
          sequenceCanvas, featureClass, feature.name, range.from, range.to
        ));

        eventRegion.on('mouseleave', _.partial(
          onMouseLeave, 
          sequenceCanvas, featureClass
        ));

        eventRegion.on('mousedown', _.partial(
          onMouseDown, 
          sequenceCanvas, range.from, range.to, feature._id
        ));

      });

    });

  }
}



Feature.prototype.featuresInRange = switchSequenceContext('featuresInRange');
Feature.prototype.nbFeaturesInRange = switchSequenceContext('nbFeaturesInRange');
Feature.prototype.filterRanges = switchSequenceContext('filterRanges');

export default Feature;