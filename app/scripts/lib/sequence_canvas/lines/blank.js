/**
Blank line for SequenceCanvas. Nothing is drawn.
Options are: 

- `this.height`: line height
@class Lines.Blank
**/
define(function(require) {
  var Blank;

  Blank = function(sequenceCanvas, options) {
    this.type = 'blank';
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  };

  Blank.prototype.draw = function() {};

  return Blank;
});