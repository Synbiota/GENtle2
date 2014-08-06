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
  var Line = require('sequence/lib/lines/line'),
      DNA;

  DNA = function(sequenceCanvas, options) {
    this.type = 'dna';
    this.sequenceCanvas = sequenceCanvas;
    this.cachedProperties = ['visible'];
    _.extend(this, options);
  };
  _.extend(DNA.prototype, Line.prototype);

  DNA.prototype.setTextColour = function(base) {
    var artist = this.sequenceCanvas.artist;
    if(_.isFunction(this.textColour)) {
      artist.updateStyle({fillStyle: this.textColour(base)});
    } else {
      artist.updateStyle({fillStyle: this.textColour});
    }
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

          artist.rect(x, y+3, ls.basePairDims.width, this.height, {
            fillStyle: this.selectionColour,
            mousemove: function(event){ console.log('comming from dna.js'); }
          });

          if(this.selectionTextColour) {
            artist.updateStyle({fillStyle: this.selectionTextColour});
          } else {
            this.setTextColour(character);
          }
        } else {
          this.setTextColour(character);
        }

        artist.text(_.isObject(character) ? character.sequence[character.position] : character, x, y + (this.baseLine === undefined ? this.height : this.baseLine),{mousemove: function(event){console.log('coming from text in dna.js');}});

        x += ls.basePairDims.width;
        if ((k + 1) % ls.basesPerBlock === 0) x += ls.gutterWidth;
      }
    }
            
  };

  return DNA;
});