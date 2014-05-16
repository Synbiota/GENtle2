/**
Blank line for SequenceCanvas. Nothing is drawn.
Options are: 

- `this.height`: line height
@class Lines.Blank
@extends Lines.Line
**/
define(function(require) {
  var Line = require('sequence/lib/lines/line'),
      Blank;

  Blank = function(sequenceCanvas, options) {
    this.type = 'blank';
    this.cache = {};
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  };
  _.extend(Blank.prototype, Line.prototype);

  return Blank;
});