/**
Blank line for SequenceCanvas. Nothing is drawn.
Options are: 

- `this.height`: line height
@class Lines.Blank
@extends Lines.Line
@module Sequence
@submodule SequenceCanvas
**/
// define(function(require) {
  var Line = require('./line'),
      Blank;

  Blank = function(sequenceCanvas, options) {
    this.type = 'blank';
    this.cache = {};
    this.cachedProperties = ['visible'];
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  };
  _.extend(Blank.prototype, Line.prototype);
export default Blank;
  // return Blank;
// });