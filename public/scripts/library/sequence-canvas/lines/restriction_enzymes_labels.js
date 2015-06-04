import RestrictionEnzymesSites from './restriction_enzymes_sites';
import RestrictionEnzymes from 'gentle-restriction-enzymes';
import _ from 'underscore';

class RestrictionEnzymesLabels extends RestrictionEnzymesSites {
  constructor(sequenceCanvas, options) {
    super(sequenceCanvas, options);
    this.smartMemoize('maxNbRESPerRow', 'change:sequence');
  }

  calculateHeight() {
    this.height = this.unitHeight * this.maxNbRESPerRow();
  }

  maxNbRESPerRow() {
    var nbRES           = [],
        sequenceCanvas  = this.sequenceCanvas,
        sequence        = sequenceCanvas.sequence,
        basesPerRow     = sequenceCanvas.layoutHelpers.basesPerRow,
        subSeqPadding   = RestrictionEnzymes.maxLength(),
        displaySettings = this.sequenceCanvas.sequence.get('displaySettings.rows.res') || {},
        enzymeOptions = {
          // length: displaySettings.lengths || [],
          customList: displaySettings.custom || [],
          // hideNonPalindromicStickyEndSites: displaySettings.hideNonPalindromicStickyEndSites || false
        },
        subSeq, enzymes;

    for(let i = 0; i <= Math.floor(sequence.getLength() / basesPerRow); i++) {
      subSeq = sequence.getSubSeq(
        sequence.ensureBaseIsEditable(i * basesPerRow - subSeqPadding),
        sequence.ensureBaseIsEditable((i+1) * basesPerRow - 1 + subSeqPadding)
      );
      enzymes = RestrictionEnzymes.getAllInSeq(subSeq, enzymeOptions);
      nbRES.push(_.keys(this.onlyVisibleEnzymes(enzymes, i, subSeqPadding)).length);
    }

    return nbRES.length ? _.max(nbRES) : 0;
  }

  onlyVisibleEnzymes(enzymes, firstBase, subSeqPadding) {
    var basesPerRow = this.sequenceCanvas.layoutHelpers.basesPerRow,
        adjustedPosition, areVisibleRES,
        output = {};

    _.each(enzymes, function(enzymes_, position) {
      adjustedPosition = position - (firstBase === 0 ? 0 : subSeqPadding);
      areVisibleRES = _.some(enzymes_, function() {
        return adjustedPosition < basesPerRow && adjustedPosition >= 0;
      });
      if(areVisibleRES) {
        output[position] = enzymes_;
      }
    });

    return output;
  }

  draw(y, baseRange) {
    var sequenceCanvas = this.sequenceCanvas,
        artist = sequenceCanvas.artist,
        sequence = sequenceCanvas.sequence,
        layoutHelpers = sequenceCanvas.layoutHelpers,
        subSeqPadding = RestrictionEnzymes.maxLength(),
        displaySettings = sequence.get('displaySettings.rows.res') || {},
        enzymeOptions = {
          // length: displaySettings.lengths || [],
          customList: displaySettings.custom || '',
          // hideNonPalindromicStickyEndSites: displaySettings.hideNonPalindromicStickyEndSites || false
        },
        expandedSubSeq = sequence.getSubSeq(
          baseRange[0] - subSeqPadding,
          baseRange[1] + subSeqPadding
        ),
        enzymes = RestrictionEnzymes.getAllInSeq(expandedSubSeq, enzymeOptions),
        _this = this,
        initY = y,
        x;

    enzymes = this.onlyVisibleEnzymes(enzymes, baseRange[0], subSeqPadding);

    y += this.height - _.keys(enzymes).length * this.unitHeight;

    artist.updateStyle({
      fillStyle: this.textColour,
      font: this.textFont,
      lineHeight: this.baseLine === undefined ? this.height : this.baseLine,
      height: this.unitHeight - (this.margin || 0),
    });

    artist.setLineDash([1.5,3]);

    _.each(enzymes, function(enzymes_, position) {
      position -= baseRange[0] === 0 ? 0 : subSeqPadding;

      enzymes_ = _.filter(enzymes_, function(enzyme) {
        return sequence.isRangeEditable(
          position + baseRange[0],
          position + baseRange[0] + enzyme.seq.length
        );
      });

      if(enzymes_.length === 0) return;


      x = _this.getBaseX(position, baseRange, true);
      artist.text(_.pluck(enzymes_, 'name').join(', '), x - 1, y + _this.unitHeight);
      artist.path(
        x, y + _this.unitHeight + 3, 
        x, initY + layoutHelpers.lineOffsets.dna - layoutHelpers.lineOffsets.restrictionEnzymesLabels
      );
      y += _this.unitHeight;
    });

    artist.setLineDash([]);
    
  }
}

export default RestrictionEnzymesLabels;