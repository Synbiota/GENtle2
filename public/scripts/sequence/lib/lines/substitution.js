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
define(function(require) {
  var Line = require('./line'),
      DNA;

  SUBSTITUTION = function(sequenceCanvas, options) {
    this.type = 'substitution';
    this.sequenceCanvas = sequenceCanvas;
    this.cachedProperties = ['visible'];
    _.extend(this, options);
  };
  _.extend(DNA.prototype, Line.prototype);

  SUBSTITUTION.prototype.setTextColour = function(base, pos) {
    var artist = this.sequenceCanvas.artist;
    if(_.isFunction(this.textColour)) {
      artist.updateStyle({fillStyle: this.textColour(base, pos)});
    } else {
      artist.updateStyle({fillStyle: this.textColour});
    }
  };

  SUBSTITUTION.prototype.getHighlightColour = function(base, pos) {
    return this.highlightColour && this.highlightColour(base, pos);
  };

  SUBSTITUTION.prototype.draw = function(y, baseRange) {
    var sequenceCanvas  = this.sequenceCanvas,
        ls              = sequenceCanvas.layoutSettings,
        lh              = sequenceCanvas.layoutHelpers,
        sequence        = sequenceCanvas.sequence,
        artist          = sequenceCanvas.artist,
        selection       = sequenceCanvas.selection,
        k, x, subSequence, character;

    artist.updateStyle({font: this.textFont});

    // Set x position to far left of page
    x = ls.pageMargins.left + (this.leftMargin || 0);


    subSequence = (_.isFunction(this.getSubSeq) ?
      this.getSubSeq :
      sequence.getSubSeq
    ).apply(sequence, baseRange);

    if(subSequence) {
      for(k = 0; k < lh.basesPerRow; k++){
        if(!subSequence[k]) break;
        if (!this.drawSingleStickyEnds || !sequence.isBeyondStickyEnd(k+baseRange[0], this.isComplement)){
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
        }
        // Advance cursor. Skip over gutter length if we have finished our block.
        x += ls.basePairDims.width;
        if ((k + 1) % ls.basesPerBlock === 0) x += ls.gutterWidth;
      }
    }

  };

  return SUBSTITUTION;
});
