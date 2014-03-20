define(function(require) {
  var Position;

  Position = function(sequenceCanvas, options) {
    this.type = 'position';
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  };

  Position.prototype.draw = function(y, baseRange) {
    var ls          = this.sequenceCanvas.layoutSettings,
        sequence    = this.sequenceCanvas.sequence,
        context     = this.sequenceCanvas.artist.context,
        k, x;

    context.fillStyle = this.textColour;
    context.font = this.textFont;
    
    x = ls.pageMargins.left;
    for(k = baseRange[0]; k <= baseRange[1]; k += ls.basesPerBlock){
      context.fillText(k+1, x, y + (this.baseLine === undefined ? this.height : this.baseLine));
      x += ls.basesPerBlock*ls.basePairDims.width + ls.gutterWidth;
    }
  };

  return Position;
});