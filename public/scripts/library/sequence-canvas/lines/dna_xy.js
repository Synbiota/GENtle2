import Line from './line';
import _ from 'underscore';

/**
Line class for displaying bases on SequenceCanvas.

DNA_XY allows a string of dna to be written at any [x,y] coordinate.

Options are:

- `this.height`: line height.
- `this.baseLine`: text baseline.
- `this.textColour`: colour of the text. can be a function taking the character as argument.
- `this.textFont`: font style of the text.
- `this.transformUnit` _(optional, default: `base`)_: argument passed to the `transform` function. Either `base` or `codon`.
- `this.transform` _(optional)_: function transforming a `transformUnit` into another (e.g. complement..)
@class Lines.DNA_XY
@module Sequence
@submodule SequenceCanvas
@extends Lines.Line
**/

export default class DNA_XY extends Line {

  constructor(sequenceCanvas, options = {}) {
    super(sequenceCanvas, options);
    _.extend(this, options);
  }

  setTextColour(base, pos) {
    var artist = this.sequenceCanvas.artist;
    if(_.isFunction(this.textColour)) {
      artist.updateStyle({fillStyle: this.textColour(base, pos)});
    } else {
      artist.updateStyle({fillStyle: this.textColour});
    }
  }

  getHighlightColour(base, pos) {
    return this.highlightColour && this.highlightColour(base, pos);
  }

  draw(x, y, baseRange) {

    var sequenceCanvas  = this.sequenceCanvas,
        ls              = sequenceCanvas.layoutSettings,
        lh              = sequenceCanvas.layoutHelpers,
        sequence        = this.sequence || sequenceCanvas.sequence,
        artist          = sequenceCanvas.artist,
        selection       = sequenceCanvas.selection,
        k, x, subSequence, character;

    artist.updateStyle({font: this.textFont});

    // x = x || ls.pageMargins.left + (this.leftMargin || 0);

    subSequence = (_.isFunction(this.getSubSeq) ?
      this.getSubSeq :
      sequence.getSubSeq
    ).apply(sequence, baseRange);

    // var peaks = sequence.get('chromatogramPeaks'),
    //     quality = sequence.get('chromatogramQuality');
    // var peakSubSequence = peaks.slice(baseRange[0], baseRange[1]+1);
    var _this = this;

    this.baseWidth = 10;

    if(subSequence) {

      _.each(subSequence, function(nucleotide, k){

        if(!subSequence[k]) return;

        var baseWidth = _.isFunction(_this.baseWidth) ?
                     _this.baseWidth(k) :
                     (_this.baseWidth || 0);

        var baseIndex = baseRange[0] + k;

        // baseWidth = peakSubSequence[k] - (peakSubSequence[k-1] || peaks[baseRange[0]+k-1] || 0);
        // baseWidth = ls.chromatographDims.width;

        // baseWidth is the width of the entire base (including padding)
        // basePairDims is the width of the actual letter.

        x += ls.basePairDims.width/2 - baseWidth/2;


        // x += baseWidth - ls.basePairDims.width/2;

        character = _.isFunction(_this.transform) ?
          _this.transform.call(sequence, k+baseRange[0]) :
          subSequence[k];



        if( _this.selectionColour &&
            selection &&
            k+baseRange[0] <= selection[1] &&
            k+baseRange[0] >= selection[0]) {

          artist.rect(x, y+3, ls.basePairDims.width, _this.height, {
            fillStyle: _this.selectionColour
          });

          if(_this.selectionTextColour) {
            artist.updateStyle({fillStyle: _this.selectionTextColour});
          } else {
            _this.setTextColour(character, k+baseRange[0]);
          }

        } else {
          var highlightColour = _this.getHighlightColour(character, k + baseRange[0]);
          if(highlightColour) {
            artist.rect(x, y+3, ls.basePairDims.width, _this.height, {
              fillStyle: highlightColour
            });
          }

          _this.setTextColour(character, k+baseRange[0]);
        }

        // if (quality[baseIndex] < 30) {
        //   artist.updateStyle({fillStyle: "red"});
        // }

        artist.text(_.isObject(character) ? character.sequence[character.position] : character,
                    x,
                    y + (_this.baseLine === undefined ? _this.height : _this.baseLine));

        // Debug printing value for quality scores.
        // artist.text(quality[baseIndex],
        //             x,
        //             y + (_this.baseLine === undefined ? _this.height : _this.baseLine) + 30);

        x += ls.basePairDims.width/2 + baseWidth/2;
        // x += ls.basePairDims.width/2;

        if ((k + 1) % ls.basesPerBlock === 0) x += ls.gutterWidth;
      });
    }
  };
}
