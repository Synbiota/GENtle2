/**
Line class for displaying base position on SequenceCanvas. 
Options are: 

- `this.height`: line height.
- `this.baseLine`: text baseline.
- `this.textColour`: colour of the text. can be a function taking the character as argument.
- `this.textFont`: font style of the text. can be a function taking the character as argument.
- `this.transform` _(optional)_: function tranforming the position text into another (e.g. number formatting)
@class Lines.Position
@extends Lines.Line
@module Sequence
@submodule SequenceCanvas
**/
define(function(require) {
  var Line = require('sequence/lib/lines/line'),
      Position;

  Position = function(sequenceCanvas, options) {
    this.type = 'position';
    this.cache = {};
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  };
  _.extend(Position.prototype, Line.prototype);

  Position.prototype.draw = function(y, baseRange) {
    var ls          = this.sequenceCanvas.layoutSettings,
        sequence    = this.sequenceCanvas.sequence,
        artist      = this.sequenceCanvas.artist,
        k, x;
    
    x = ls.pageMargins.left;
    for(k = baseRange[0]; k <= baseRange[1]; k += ls.basesPerBlock){
      text = typeof this.transform == 'function' ? this.transform(k+1) : k+1;
      artist.text(text, x, y + (this.baseLine === undefined ? this.height : this.baseLine), {
        fillStyle: this.textColour,
        font: this.textFont
      });
      x += ls.basesPerBlock*ls.basePairDims.width + ls.gutterWidth;
    }
  };

  return Position;
});