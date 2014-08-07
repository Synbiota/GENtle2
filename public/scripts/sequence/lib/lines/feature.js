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
define(function(require) {
  var Line = require('sequence/lib/lines/line'),
      _    = require('underscore.mixed'),
      Feature;

  Feature = function(sequenceCanvas, options) {
    var _this = this;
    this.type = 'Feature';
    this.sequenceCanvas = sequenceCanvas;
    this.sequenceCanvas.sequence.on('change:features', this.clearCache, this);
    _.extend(this, options);
    this.featureStack = [];
    this.cachedProperties = ['visible', 'maxNbFeaturesPerRow'];
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
    return _.min(_.pluck(feature.ranges, 'from'));
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
    return _.some(feature1.ranges, function(range1) {
      return _.some(feature2.ranges, function(range2) {
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
    return _.some(feature.ranges, function(range) {
      return range.from <= startBase && range.to <= endBase;
    });

  };

  /**
  Returns the max number of ranges to be found in one row for the entire sequence

  @method maxNbFeaturesPerRange
  @returns {integer}
  **/
  Feature.prototype.maxNbFeaturesPerRow = _.memoize2(function() {
    var nbFeatures      = [],
        sequenceCanvas  = this.sequenceCanvas,
        sequence        = sequenceCanvas.sequence,
        basesPerRow     = sequenceCanvas.layoutHelpers.basesPerRow;

    for(var i = 0; i <= Math.floor(sequence.length() / basesPerRow); i++) {
      nbFeatures.push(sequence.nbFeaturesInRange(i * basesPerRow, (i+1) * basesPerRow - 1));
    }
    return nbFeatures.length ? _.max(nbFeatures) : 0;

  }),

  /**
  Sets the `this.height` attribute based on the max nb of features pe row
  @method calculateHeight
  **/
  Feature.prototype.calculateHeight = function() {
    this.height = this.unitHeight * this.maxNbFeaturesPerRow() + (this.topMargin || 0);
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
        artist          = sequenceCanvas.artist,
        basesPerBlock   = layoutSettings.basesPerBlock,
        baseWidth       = layoutSettings.basePairDims.width,
        gutterWidth     = layoutSettings.gutterWidth,
        features, startX, endX, deltaX, textWidth, backgroundFillStyle;

    features = _(sequence.featuresInRange(baseRange[0], baseRange[1])).sortBy(this.featureSortedBy);
    y += (this.topMargin || 0);

    for(var i = 0; i < features.length; i++) {
      var feature = features[i],
          j = 0;

      // Features can have multiple ranges
      for(j = 0; j < feature.ranges.length; j++) {
        var range = feature.ranges[j];
        if(range.from > baseRange[1] || range.to < baseRange[0]) return;

        startX = sequenceCanvas.getXPosFromBase(Math.max(range.from, baseRange[0]));
        endX   = sequenceCanvas.getXPosFromBase(Math.min(range.to, baseRange[1]));
        deltaX = endX - startX + 1 + baseWidth;

        backgroundFillStyle = _.isFunction(this.colour) ? this.colour(feature._type) : this.colour;
        textColour  = _.isFunction(this.textColour) ? this.textColour(feature._type) : this.textColour;

        artist.rect(startX, 
                    y + this.margin + i*this.unitHeight, 
                    deltaX, 
                    this.lineSize, 
                    {
                      fillStyle: backgroundFillStyle,
                      mousemove:{
                      eventFunc: function(event, featureInfo) {  
                            _this.featureInfo(event, featureInfo);
                       },
                       featureInfo: 
                       {
                              Name: feature.name,
                              from: feature.ranges[0].from+1,
                              to:   feature.ranges[0].to+1,
                              Type: feature._type,
                              Description: feature.desc,
                              Id:   feature._id,
                              fillStyle: backgroundFillStyle
                       }
                       }
                    });

        artist.text(feature.name, 
                    startX, 
                    y + this.margin + i * this.unitHeight,
                    {
                      font: this.textFont,
                      fillStyle: textColour,
                      lineHeight: this.baseLine === undefined ? this.height : this.baseLine,
                      height: this.unitHeight - this.margin,
                      textPadding: this.textPadding,
                      backgroundFillStyle: backgroundFillStyle
                    });
        
      }

    }

  };

  return Feature;
});