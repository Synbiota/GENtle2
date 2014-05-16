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
@extends Lines.Line
**/
define(function(require) {
  var Line = require('sequence/lib/lines/line'),
      DNA;

  DNA = function(sequenceCanvas, options) {
    this.type = 'dna';
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  };
  _.extend(DNA.prototype, Line.prototype);

  DNA.prototype.setTextColour = function(base) {
    var context = this.sequenceCanvas.artist.context;
    if(_.isFunction(this.textColour)) {
      context.fillStyle = this.textColour(base);
    } else {
      context.fillStyle = this.textColour;
    }
  };

  DNA.prototype.draw = function(y, baseRange) {
    var sequenceCanvas  = this.sequenceCanvas,
        ls              = sequenceCanvas.layoutSettings,
        lh              = sequenceCanvas.layoutHelpers,
        sequence        = sequenceCanvas.sequence,
        context         = sequenceCanvas.artist.context,
        selection       = sequenceCanvas.selection,
        k, x, subSequence, character;

    context.font = this.textFont;
    x = ls.pageMargins.left;
    
    subSequence = (_.isFunction(this.getSubSeq) ? 
      this.getSubSeq : 
      sequence.getSubSeq
    ).apply(sequence, baseRange); 

    if(subSequence) {
      for(k = 0; k < lh.basesPerRow; k++){
        if(!subSequence[k]) break;

        character = _.isFunction(this.transform) ?
          this.transform.call(sequence, k+baseRange[0]) :
          subSequence[k];

        if( this.selectionColour && 
            selection && 
            k+baseRange[0] <= selection[1] && 
            k+baseRange[0] >= selection[0]) {

          context.fillStyle = this.selectionColour;
          context.fillRect(x, y+3, ls.basePairDims.width, this.height);

          if(this.selectionTextColour) {
            context.fillStyle = this.selectionTextColour;
          } else {
            this.setTextColour(character);
          }
        } else {
          this.setTextColour(character);
        }

        context.fillText(_.isObject(character) ? character.sequence[character.position] : character, x, y + (this.baseLine === undefined ? this.height : this.baseLine));

        x += ls.basePairDims.width;
        if ((k + 1) % ls.basesPerBlock === 0) x += ls.gutterWidth;
      }
    }
            
  };

  return DNA;
});