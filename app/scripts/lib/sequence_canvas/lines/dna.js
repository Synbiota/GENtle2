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
        k, x, subSequence;

    context.fillStyle = this.textColour;
    context.font = this.textFont;
    x = ls.pageMargins.left;
    
    subSequence = sequence.getSubSeq(baseRange[0], baseRange[1]);
    if(subSequence) {
      for(k = 0; k < lh.basesPerRow; k++){
        if(!subSequence[k]) break;
        context.fillText(subSequence[k], x, y + (this.baseLine === undefined ? this.height : this.baseLine));
        x += ls.basePairDims.width;
        if ((k + 1) % ls.basesPerBlock === 0) x += ls.gutterWidth;
      }
    }
            
  };

  return DNA;
});