import Line from './line';
import _ from 'underscore';

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
class DNA extends Line {

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

  getLineHighlightColour(base) {
    return this.lineHighlightColor(base);
  };

  draw(y, baseRange) {
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

    if(subSequence) {
      for(k = 0; k < lh.basesPerRow; k++){
        if(!subSequence[k]) break;

        if (_.isFunction(this.lineHighlightColor)) {          
          let lhc = this.getLineHighlightColour(subSequence[k]); 

          artist.rect(
            x, 
            y + 2, 
            ls.basePairDims.width, 
            this.height+4, 
            {fillStyle: lhc}
          );
        }
        
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

        x += ls.basePairDims.width;
        if ((k + 1) % ls.basesPerBlock === 0) x += ls.gutterWidth;
      }
    }
            
  };
}
export default DNA;