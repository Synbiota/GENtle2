/**
Line class for displaying bases on SequenceCanvas.
Options are:

- `this.height`: line height.
- `this.baseLine`: text baseline.
- `this.textColour`: colour of the text. can be a function taking the character as argument.
- `this.textFont`: font style of the text.
- `this.transformUnit` _(optional, default: `base`)_: argument passed to the `transform` function. Either `base` or `codon`.
- `this.transform` _(optional)_: function transforming a `transformUnit` into another (e.g. complement..)
@class Lines.DNA
@module Sequence
@submodule SequenceCanvas
@extends Lines.Line
**/
// define(function(require) {
  var Line = require('./line'),
      DNA;

  DNA = function(sequenceCanvas, options) {
    this.type = 'dna';
    this.sequenceCanvas = sequenceCanvas;
    this.cachedProperties = ['visible'];
    _.extend(this, options);
  };
  _.extend(DNA.prototype, Line.prototype);

  DNA.prototype.setTextColour = function(base, pos) {
    var artist = this.sequenceCanvas.artist;
    if(_.isFunction(this.textColour)) {
      artist.updateStyle({fillStyle: this.textColour(base, pos)});
    } else {
      artist.updateStyle({fillStyle: this.textColour});
    }
  };

  DNA.prototype.getHighlightColour = function(base, pos) {
    return this.highlightColour && this.highlightColour(base, pos);
  };

  DNA.prototype.draw = function(y, baseRange) {
    var sequenceCanvas  = this.sequenceCanvas,
        ls              = sequenceCanvas.layoutSettings,
        lh              = sequenceCanvas.layoutHelpers,
        sequence        = sequenceCanvas.sequence,
        artist          = sequenceCanvas.artist,
        selection       = sequenceCanvas.selection,
        k, x, subSequence, character;

    artist.updateStyle({font: this.textFont});
    x = ls.pageMargins.left + (this.leftMargin || 0);

    subSequence = (_.isFunction(this.getSubSeq) ?
      this.getSubSeq :
      sequence.getSubSeq
    ).apply(sequence, baseRange);

    var peaks = sequence.get('chromatogramPeaks')
    var peakSubSequence = peaks.slice(baseRange[0], baseRange[1]+1);

    if(subSequence) {
      for(k = 0; k < lh.basesPerRow; k++){
        if(!subSequence[k]) break;

        var diff = peakSubSequence[k] - (peakSubSequence[k-1] || 0);

        x += diff - ls.basePairDims.width/2;

        // console.log(subSequence[k], peakSubSequence[k] - (peakSubSequence[k-1] || 0));

        character = _.isFunction(this.transform) ?
          this.transform.call(sequence, k+baseRange[0]) :
          subSequence[k];



        if( this.selectionColour &&
            selection &&
            k+baseRange[0] <= selection[1] &&
            k+baseRange[0] >= selection[0]) {

          artist.rect(x, y+3, ls.basePairDims.width, this.height, {
            fillStyle: this.selectionColour
          });

          if(this.selectionTextColour) {
            artist.updateStyle({fillStyle: this.selectionTextColour});
          } else {
            this.setTextColour(character, k+baseRange[0]);
          }

        } else {
          var highlightColour = this.getHighlightColour(character, k + baseRange[0]);
          if(highlightColour) {
            artist.rect(x, y+3, ls.basePairDims.width, this.height, {
              fillStyle: highlightColour
            });
          }

          this.setTextColour(character, k+baseRange[0]);
        }

        artist.text(_.isObject(character) ? character.sequence[character.position] : character, x, y + (this.baseLine === undefined ? this.height : this.baseLine));

        x += ls.basePairDims.width/2;
        if ((k + 1) % ls.basesPerBlock === 0) x += ls.gutterWidth;
      }
    }

  };
export default DNA;
  // return DNA;
// });
