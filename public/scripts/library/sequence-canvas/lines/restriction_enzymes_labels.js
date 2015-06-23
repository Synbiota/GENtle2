import RestrictionEnzymesSites from './restriction_enzymes_sites';
import RestrictionEnzymes from 'gentle-restriction-enzymes';
import _ from 'underscore';
import $ from 'jquery';
import SVG from 'svg.js';

function onMouseEnter(sequenceCanvas, selector, baseFrom, baseTo) {
  $('.' + selector).addClass('active');
  SVG.select('.' + selector).addClass('active');
  sequenceCanvas.highlightBaseRange(baseFrom, baseTo);
}

function onMouseLeave(sequenceCanvas, selector) {
  $('.' + selector).removeClass('active');
  SVG.select('.' + selector).removeClass('active');
  sequenceCanvas.highlightBaseRange();
}

function onMouseDown(sequenceCanvas, baseFrom, baseTo, event) {
  event.stopPropagation();
  sequenceCanvas.select(baseFrom, baseTo);
}

class RestrictionEnzymesLabels extends RestrictionEnzymesSites {
  constructor(sequenceCanvas, options) {
    super(sequenceCanvas, options);
    this.memoize('maxNbRESPerRow', 'change:sequence');
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
    var sequenceCanvas = this.sequenceCanvas;
    var {$childrenContainer, sequence, layoutHelpers} = sequenceCanvas;
    var subSeqPadding = RestrictionEnzymes.maxLength(),
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

    var row = sequenceCanvas.getAbsRowFromYPos(y);
    var rowClass = `res-label-row-${row}`;

    if(document.getElementsByClassName(rowClass).length) return;

    enzymes = this.onlyVisibleEnzymes(enzymes, baseRange[0], subSeqPadding);

    var count = _.keys(enzymes).length;

    y += this.height - count * this.unitHeight - 5;

    var i = -1;

    _.each(enzymes, (enzymes_, position) => {
      i++;
      position -= baseRange[0] === 0 ? 0 : subSeqPadding;

      enzymes_ = _.filter(enzymes_, function(enzyme) {
        return sequence.isRangeEditable(
          position + baseRange[0],
          position + baseRange[0] + enzyme.seq.length
        );
      });

      if(enzymes_.length === 0) return;

      x = _this.getBaseX(position, baseRange, true);

      var top = y + _this.unitHeight + layoutHelpers.yOffset;
      var lineHeight = initY + layoutHelpers.lineOffsets.dna - layoutHelpers.lineOffsets.restrictionEnzymesLabels - y - 2 * this.unitHeight;

      var baseFrom = baseRange[0] + position;
      var baseTo = baseFrom - 1 + _.max(_.map(enzymes_, (enzyme) => {
        return enzyme.seq.length;
      }));

      var $line = $('<div/>')
        .addClass('res-label-line')
        .css({height: lineHeight});

      var $label = $('<div/>')
        .addClass('res-label')
        .text(_.pluck(enzymes_, 'name').join(', '));

      var resClass = `res-${baseFrom}`;
      var $container = $('<div/>')
        .addClass(`res-label-container ${rowClass} ${resClass}`) 
        .css({top, left: x})
        .append($label, $line);

      $childrenContainer.append($container);

      $label.on('mouseenter', _.partial(
        onMouseEnter, 
        sequenceCanvas, resClass, baseFrom, baseTo
      ));

      $label.on('mouseleave', _.partial(
        onMouseLeave, 
        sequenceCanvas, resClass
      ));

      $label.on('mousedown', _.partial(
        onMouseDown, 
        sequenceCanvas, baseFrom, baseTo
      ));

      y += _this.unitHeight;

      return;
    });
    
  }
}

export default RestrictionEnzymesLabels;