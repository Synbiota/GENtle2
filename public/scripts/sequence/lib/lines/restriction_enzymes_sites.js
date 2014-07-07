define(function(require) {
  var Line = require('./line'),
      RestrictionEnzymes = require('../restriction_enzymes'),
      RestrictionEnzymeSites;

  RestrictionEnzymeSites = function(sequenceCanvas, options) {
    this.type = 'restrictionEnzymeSites';
    this.cache = {};
    this.sequenceCanvas = sequenceCanvas;
    this.cachedProperties = ['visible'];
    _.extend(this, options);
  };

  _.extend(RestrictionEnzymeSites.prototype, Line.prototype);

  RestrictionEnzymeSites.prototype.getBaseX = function(base, baseRange, isStart) {
    var layoutSettings = this.sequenceCanvas.layoutSettings,
        layoutHelpers = this.sequenceCanvas.layoutHelpers,
        basesPerBlock = layoutSettings.basesPerBlock,
        relativeBase, x;

    relativeBase = Math.max(0, Math.min(baseRange[1]+1, base + baseRange[0]) - baseRange[0]);
    x = layoutSettings.pageMargins.left + relativeBase * layoutSettings.basePairDims.width;
    x += layoutSettings.gutterWidth * Math.floor(Math.max(0, relativeBase - 1) / basesPerBlock);
    
    if(!!isStart && relativeBase % basesPerBlock === 0 && relativeBase != layoutHelpers.basesPerRow && relativeBase !== 0) {
      x += layoutSettings.gutterWidth;
    }

    return x;
  };

  RestrictionEnzymeSites.prototype.draw = function(y, baseRange) {
    var sequenceCanvas = this.sequenceCanvas,
        artist = sequenceCanvas.artist,
        layoutSettings = sequenceCanvas.layoutSettings,
        layoutHelpers = sequenceCanvas.layoutHelpers,
        dnaY = layoutHelpers.lineOffsets.dna,
        complementsY = layoutHelpers.lineOffsets.complements,
        complementsHeight = layoutSettings.lines.complements.height,
        displaySettings = this.sequenceCanvas.sequence.get('displaySettings.rows.res') || {},
        enzymeOptions = {
          length: displaySettings.lengths || [],
          customList: displaySettings.custom || []
        },
        subSeqPadding = RestrictionEnzymes.maxLength(),
        expandedSubSeq = sequenceCanvas.sequence.getSubSeq(
          baseRange[0] - subSeqPadding,
          baseRange[1] + subSeqPadding
        ),
        baseRangeLength = baseRange[1] - baseRange[0] + 1,
        enzymes = RestrictionEnzymes.getAllInSeq(expandedSubSeq, enzymeOptions),
        x, x2, initPosition, points, negativeOffset, basesLength,
        _this = this;

    y -= 2; // Styling

    artist.updateStyle({
      strokeStyle: '#59955C',
      lineWidth: 1
    });

    _.each(enzymes, function(enzymes_, position) {
      position = +position - (baseRange[0] === 0 ? 0 : subSeqPadding);
      initPosition = position;

      _.each(enzymes_, function(enzyme) {

        points = [];
        negativeOffset = enzyme.offset < 0;
        basesLength = enzyme.seq.length ;
        position = negativeOffset ? initPosition + basesLength : initPosition;

        // Line above DNA
        if(enzyme.cut > 0 && position <= baseRangeLength && position + enzyme.cut > 0) {
          points = points.concat([
            _this.getBaseX(position, baseRange, !negativeOffset), y + dnaY,
            _this.getBaseX(initPosition + enzyme.cut, baseRange, negativeOffset), y + dnaY
          ]);
        }

        // First cut
        position = (negativeOffset ? initPosition : position) + enzyme.cut;
        if(position >= 0 && position < baseRangeLength) {
          x = _this.getBaseX(position, baseRange, !negativeOffset && enzyme.cut === 0);
          points = points.concat(
            x, y + dnaY,
            x, y + complementsY
          );
        }

        // Line below DNA
        if((negativeOffset && position > 0 && position + enzyme.offset <= baseRangeLength) || position <= baseRangeLength && position + enzyme.offset > 0) {
          points = points.concat(
            _this.getBaseX(position, baseRange, !negativeOffset && enzyme.cut === 0), y + complementsY,
            _this.getBaseX(position + enzyme.offset, baseRange), y + complementsY
          );
        }

        // Second cut
        position += enzyme.offset;
        if(position >= 0 && position < baseRangeLength) {
          x = _this.getBaseX(position, baseRange);
          points = points.concat(
            x, y + complementsY,
            x, y + complementsY + complementsHeight
          );
        }

        // Line below complements
        if(position < baseRangeLength && initPosition + enzyme.seq.length > 0) {
          x = _this.getBaseX(position, baseRange);
          x2 = _this.getBaseX(negativeOffset ? initPosition : initPosition + enzyme.seq.length, baseRange);
          if(x !== x2) {
            points = points.concat(
              _this.getBaseX(position, baseRange), 
              y + complementsY + complementsHeight,
              _this.getBaseX(negativeOffset ? initPosition : initPosition + enzyme.seq.length, baseRange), 
              y + complementsY + complementsHeight
            );
          }
        }

        if(points.length) artist.path.apply(artist, points);

      });
    });

  };

  return RestrictionEnzymeSites;
});