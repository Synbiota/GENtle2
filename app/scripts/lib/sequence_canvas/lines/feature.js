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
@extends Lines.Line
**/
define(function(require) {
  var Line = require('lib/sequence_canvas/lines/line'),
      _    = require('underscore'),
      Feature;

  Feature = function(sequenceCanvas, options) {
    var _this = this;
    this.type = 'Feature';
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
    this.featureStack = [];
  };
  _.extend(Feature.prototype, Line.prototype);

  /**
  Returns the value by which to sort features. (i.e. lowest range starting base).
  Use with _.sortBy.
  @method featureSortedBy
  @param {object} feature
  @returns {integer}
  **/
  Feature.prototype.featureSortedBy = function(feature) {
    return _.min(_.pluck(feature._range, 'from'));
  };

  /**
  Checks whether two features overlap

  *Not used*

  @method featuresOverlap
  @param {object} feature1
  @param {object} feature2
  @returns {boolean}
  **/
  Feature.prototype.featuresOverlap = function(feature1, feature2) {
    if(feature1 == feature2) return false;
    return _.some(feature1._range, function(range1) {
      return _.some(feature2._range, function(range2) {
        return range2.to >= range1.from && range2.from <= range1.to;
      });
    });
  };

  /**
  Checks whether one of the ranges of a feature ends in a give base range

  *Not used*

  @method featureEndInRange
  @param {object} feature
  @param {integer} startBase
  @param {integer} endBase
  @returns {boolean}
  **/
  Feature.prototype.featureEndInRange = function(feature, startBase, endBase) {
    return _.some(feature._range, function(range) {
      return range.from <= startBase && range.to <= endBase;
    });

  };

  /**
  Returns the max number of ranges to be found in one row for the entire sequence

  @method maxNbFeaturesPerRange
  @returns {integer}
  **/
  Feature.prototype.maxNbFeaturesPerRow = function() {
    var nbFeatures      = [],
        sequenceCanvas  = this.sequenceCanvas,
        sequence        = sequenceCanvas.sequence,
        basesPerRow     = sequenceCanvas.layoutHelpers.basesPerRow,
        _maxNb;

    _maxNb = function(_basesPerRow) {
      for(var i = 0; i < Math.floor(sequence.length() / _basesPerRow); i++) {
        nbFeatures.push(sequence.nbFeaturesInRange(i * _basesPerRow, (i+1) * _basesPerRow - 1));
      }
      return _.max(nbFeatures);
    };

    if(this._maxNbFeaturesPerRow === undefined) {
      this._maxNbFeaturesPerRow = _.memoize2(_maxNb);
      sequence.on('change:features', this._maxNbFeaturesPerRow.clearCache);
    }

    return this._maxNbFeaturesPerRow(basesPerRow);
  },

  /**
  Sets the `this.height` attribute based on the max nb of features pe row
  @method calculateHeight
  **/
  Feature.prototype.calculateHeight = function() {
    this.height = this.unitHeight * this.maxNbFeaturesPerRow();
  },

  /**
  Draws the featuresf or a given range
  @method draw
  @param {integer} y Start y position
  @param {array} baseRange 
  **/
  Feature.prototype.draw = function(y, baseRange) {
    var sequenceCanvas  = this.sequenceCanvas,
        layoutSettings  = sequenceCanvas.layoutSettings,
        layoutHelpers   = sequenceCanvas.layoutHelpers,
        sequence        = sequenceCanvas.sequence,
        context         = sequenceCanvas.artist.context,
        basesPerBlock   = layoutSettings.basesPerBlock,
        baseWidth       = layoutSettings.basePairDims.width,
        gutterWidth     = layoutSettings.gutterWidth,
        features, startX, endX, deltaX, textWidth;

    features = _(sequence.featuresInRange(baseRange[0], baseRange[1])).sortBy(this.featureSortedBy);
    for(var i = 0; i < features.length; i++) {
      var feature = features[i],
          j = 0;

      // Features can have multiple ranges
      for(j = 0; j < feature._range.length; j++) {
        var range = feature._range[j];
        if(range.from > baseRange[1] || range.to < baseRange[0]) return;

        startX = sequenceCanvas.getXPosFromBase(Math.max(range.from, baseRange[0]));
        endX   = sequenceCanvas.getXPosFromBase(Math.min(range.to, baseRange[1]));
        deltaX = endX - startX + 1 + baseWidth;

        context.font = this.textFont;
        textWidth = Math.min(context.measureText(feature.name).width + 2 * this.textPadding, deltaX);

        context.fillStyle = _.isFunction(this.colour) ? 
          this.colour(feature._type) : 
          this.colour;
        context.fillRect(startX, y + this.margin + i*this.unitHeight, textWidth, this.unitHeight - this.margin);
        context.fillRect(startX, y + this.margin + i*this.unitHeight, deltaX, this.lineSize);

        context.fillStyle = this.textColour;
        context.fillText(feature.name, startX + this.textPadding, y + (this.baseLine === undefined ? this.height : this.baseLine) + this.margin + i*this.unitHeight);
        
      }

    }

  };

  return Feature;
});