import Line from './line';
import RestrictionEnzymes from 'gentle-restriction-enzymes';
import {each} from 'underscore';
import tracedLog from '../../../common/lib/traced_log';

class RestrictionEnzymeSites extends Line {

  getBaseX(base, baseRange, isStart) {
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
  }

  draw(y, baseRange) {
    var sequenceCanvas = this.sequenceCanvas,
        artist = sequenceCanvas.artist,
        sequence = sequenceCanvas.sequence,
        layoutSettings = sequenceCanvas.layoutSettings,
        layoutHelpers = sequenceCanvas.layoutHelpers,
        dnaY = layoutHelpers.lineOffsets.dna,
        complementsY = layoutHelpers.lineOffsets.complements,
        complementsHeight = sequenceCanvas.lines.complements.height,
        displaySettings = sequence.get('displaySettings.rows.res') || {},
        // enzymeOptions = {
        //   length: displaySettings.lengths || [],
        //   customList: displaySettings.custom || [],
        //   hideNonPalindromicStickyEndSites: displaySettings.hideNonPalindromicStickyEndSites || false
        // },
        enzymeOptions = {
          customList: displaySettings.custom || []
        },
        subSeqPadding = RestrictionEnzymes.maxLength(),
        expandedSubSeq = sequence.getSubSeq(
          baseRange[0] - subSeqPadding,
          baseRange[1] + subSeqPadding
        ),
        baseRangeLength = baseRange[1] - baseRange[0] + 1,
        enzymes = RestrictionEnzymes.getAllInSeq(expandedSubSeq, enzymeOptions),
        x, x2, initPosition, points, negativeOffset, basesLength,
        _this = this;


    if(_.keys(enzymes).length) console.log(y, layoutHelpers.yOffset)
    y -= 2; // Styling
    y += layoutHelpers.yOffset;

    var row = sequenceCanvas.getAbsRowFromYPos(y);
    var rowClass = `res-sites-row-${row}`;
    if(document.getElementsByClassName(rowClass).length) return;

    // artist.updateStyle({
    //   strokeStyle: '#59955C',
    //   lineWidth: 1
    // });
    // 
    var i = -1;

    each(enzymes, function(enzymes_, position) {
      i++;
      position = +position - (baseRange[0] === 0 ? 0 : subSeqPadding);
      initPosition = position;

      each(enzymes_, function(enzyme) {

        if(!sequence.isRangeEditable(
          position + baseRange[0],
          position + baseRange[0] + enzyme.seq.length
        )) return;

        points = [];
        negativeOffset = enzyme.offset < 0;
        basesLength = enzyme.seq.length ;
        position = negativeOffset ? initPosition + basesLength : initPosition;

        // Line above DNA
        if(enzyme.cut > 0 && position <= baseRangeLength && position + enzyme.cut > 0) {
          points.push(
            [_this.getBaseX(position, baseRange, !negativeOffset), y + dnaY],
            [_this.getBaseX(initPosition + enzyme.cut, baseRange, negativeOffset), y + dnaY]
          );
        }

        // First cut
        position = (negativeOffset ? initPosition : position) + enzyme.cut;
        if(position >= 0 && position < baseRangeLength) {
          x = _this.getBaseX(position, baseRange, !negativeOffset && enzyme.cut === 0);
          points.push(
            [x, y + dnaY],
            [x, y + complementsY]
          );
        }

        // Line below DNA
        if((negativeOffset && position > 0 && position + enzyme.offset <= baseRangeLength) || position <= baseRangeLength && position + enzyme.offset > 0) {
          points.push(
            [_this.getBaseX(position, baseRange, !negativeOffset && enzyme.cut === 0), y + complementsY],
            [_this.getBaseX(position + enzyme.offset, baseRange), y + complementsY]
          );
        }

        // Second cut
        position += enzyme.offset;
        if(position >= 0 && position < baseRangeLength) {
          x = _this.getBaseX(position, baseRange);
          points.push(
            [x, y + complementsY],
            [x, y + complementsY + complementsHeight]
          );
        }

        // Line below complements
        if(position < baseRangeLength && initPosition + enzyme.seq.length > 0) {
          x = _this.getBaseX(position, baseRange);
          x2 = _this.getBaseX(negativeOffset ? initPosition : initPosition + enzyme.seq.length, baseRange);
          if(x !== x2) {
            points.push(
              [_this.getBaseX(position, baseRange), 
                            y + complementsY + complementsHeight],
              [_this.getBaseX(negativeOffset ? initPosition : initPosition + enzyme.seq.length, baseRange), 
                            y + complementsY + complementsHeight]
            );
          }
        }

        var resClass = `res-${initPosition + baseRange[0]}`;
        
        sequenceCanvas.svg.polyline(points).addClass(`res-site ${rowClass} ${resClass}`);

      });
    });

  }
}

export default RestrictionEnzymeSites;