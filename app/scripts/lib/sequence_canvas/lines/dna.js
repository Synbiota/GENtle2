/**
Line class for displaying bases on SequenceCanvas. 
Options are: 

- `this.height`: line height.
- `this.baseLine`: text baseline.
- `this.textColour`: colour of the text. can be a function taking the character as argument.
- `this.textFont`: font style of the text. 
- `this.transform` _(optional)_: function tranforming the character into another (e.g. complement..)
@class Lines.DNA
**/
define(function(require) {
  var DNA;

  DNA = function(sequenceCanvas, options) {
    this.type = 'dna';
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  };

  DNA.prototype.draw = function(y, baseRange) {
    var ls          = this.sequenceCanvas.layoutSettings,
        lh          = this.sequenceCanvas.layoutHelpers,
        sequence    = this.sequenceCanvas.sequence,
        context     = this.sequenceCanvas.artist.context,
        k, x, subSequence, character;

    // Text colour is defined later if this.textColour is a function
    if(typeof this.textColour != 'function') context.fillStyle = this.textColour;
    context.font = this.textFont;
    x = ls.pageMargins.left;
    
    subSequence = (typeof this.getSubSeq == 'function' ? this.getSubSeq : sequence.getSubSeq).apply(sequence, baseRange); 
    if(subSequence) {
      for(k = 0; k < lh.basesPerRow; k++){
        if(!subSequence[k]) break;

        // Applying transformations if necessary
        character = typeof this.transform == 'function' ? this.transform(subSequence[k]) : subSequence[k];
        if(typeof this.textColour == 'function') context.fillStyle = this.textColour(character);

        context.fillText(character, x, y + (this.baseLine === undefined ? this.height : this.baseLine));

        x += ls.basePairDims.width;
        if ((k + 1) % ls.basesPerBlock === 0) x += ls.gutterWidth;
      }
    }
            
  };

  return DNA;
});