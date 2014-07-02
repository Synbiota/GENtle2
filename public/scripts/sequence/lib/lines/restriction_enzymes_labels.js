define(function(require) {
  var Line = require('./line'),
      RestrictionEnzymes = require('../restriction_enzymes'),
      RestrictionEnzymesSites = require('./restriction_enzymes_sites'),
      RestrictionEnzymesLabels;

  RestrictionEnzymesLabels = function(sequenceCanvas, options) {
    this.type = 'restrictionEnzymesLabels';
    this.cache = {};
    this.sequenceCanvas = sequenceCanvas;
    this.sequenceCanvas.sequence.on('change:sequence', this.clearCache, this);
    this.cachedProperties = ['visible', 'maxNbRESPerRow'];
    _.extend(this, options);
  };
  _.extend(RestrictionEnzymesLabels.prototype, Line.prototype);

  RestrictionEnzymesLabels.prototype.calculateHeight = function() {
    this.height = this.unitHeight * this.maxNbRESPerRow();
  },

  RestrictionEnzymesLabels.prototype.maxNbRESPerRow = _.memoize2(function() {
    var nbRES           = [],
        sequenceCanvas  = this.sequenceCanvas,
        sequence        = sequenceCanvas.sequence,
        basesPerRow     = sequenceCanvas.layoutHelpers.basesPerRow,
        subSeqPadding   = RestrictionEnzymes.maxBaseLength(),
        subSeq, enzymes, countEnzymes, i;

    for(i = 0; i <= Math.floor(sequence.length() / basesPerRow); i++) {
      subSeq = sequence.getSubSeq(
        i * basesPerRow - subSeqPadding,
        (i+1) * basesPerRow - 1 + subSeqPadding
      );
      enzymes = RestrictionEnzymes.getAllInSeq(subSeq);
      nbRES.push(_.keys(this.onlyVisibleEnzymes(enzymes, i, subSeqPadding)).length);
    }

    return nbRES.length ? _.max(nbRES) : 0;
  });

  RestrictionEnzymesLabels.prototype.getBaseX = RestrictionEnzymesSites.prototype.getBaseX;

  RestrictionEnzymesLabels.prototype.onlyVisibleEnzymes = function(enzymes, firstBase, subSeqPadding) {
    var basesPerRow = this.sequenceCanvas.layoutHelpers.basesPerRow,
        adjustedPosition, areVisibleRES,
        output = {};

    _.each(enzymes, function(enzymes_, position) {
      adjustedPosition = position - (firstBase === 0 ? 0 : subSeqPadding);
      areVisibleRES = _.some(enzymes_, function(enzyme) {
        return adjustedPosition < basesPerRow && adjustedPosition >= 0;
      });
      if(areVisibleRES) {
        output[position] = enzymes_;
      }
    });

    return output;
  };

  RestrictionEnzymesLabels.prototype.draw = function(y, baseRange) {
    var sequenceCanvas = this.sequenceCanvas,
        artist = sequenceCanvas.artist,
        layoutSettings = sequenceCanvas.layoutSettings,
        layoutHelpers = sequenceCanvas.layoutHelpers,
        subSeqPadding = RestrictionEnzymes.maxBaseLength(),
        expandedSubSeq = sequenceCanvas.sequence.getSubSeq(
          baseRange[0] - subSeqPadding,
          baseRange[1] + subSeqPadding
        ),
        enzymes = RestrictionEnzymes.getAllInSeq(expandedSubSeq),
        _this = this,
        initY = y,
        x, text;

    enzymes = this.onlyVisibleEnzymes(enzymes, baseRange[0], subSeqPadding);

    y += this.height - _.keys(enzymes).length * this.unitHeight;

    artist.updateStyle({
      fillStyle: this.textColour,
      font: this.textFont,
      lineHeight: this.baseLine === undefined ? this.height : this.baseLine,
      height: this.unitHeight - (this.margin || 0),
    });

    artist.setLineDash([2,2]);

    _.each(enzymes, function(enzymes_, position) {
      position -= baseRange[0] === 0 ? 0 : subSeqPadding;
      x = _this.getBaseX(position, baseRange);
      artist.text(_.pluck(enzymes_, 'name').join(', '), x - 1, y + _this.unitHeight);
      artist.path(
        x, y + _this.unitHeight + 3, 
        x, initY + layoutHelpers.lineOffsets.dna - layoutHelpers.lineOffsets.restrictionEnzymesLabels
      );
      y += _this.unitHeight;
    });

    artist.setLineDash([]);
    
  };

  return RestrictionEnzymesLabels;
});