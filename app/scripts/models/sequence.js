/**
Generic class for handling DNA sequences
@class Sequence
@constructor
**/
define(['jquery'], function($) {

  /**
  @method Sequence
  **/
  function Sequence(sequence) {
    this.sequence = sequence;
  }

  /**
  Returns a sub-sequence of the main sequence. Bases are indexed from 0.
  @method get
  @param {Integer} startBase Start position of the requested sub-sequence in the main sequence. If no `endBase` is provided, `get` will only return the base at the `startBase` position.
  @param {Integer} [endBase] End position of the requested sub-sequence in the main sequence.
  @returns {String} Requested sub-sequence
  **/
  Sequence.prototype.get = function(startBase, endBase) {
    if(endBase === undefined) endBase = startBase;
    else endBase = Math.min(this.length()-1, endBase)
    startBase = Math.min(Math.max(0,startBase), this.length()-1)
    return this.sequence.substr(startBase, endBase-startBase+1);
  };

  /**
  @method length
  @returns {Integer} Total length of the sequence
  **/
  Sequence.prototype.length = function() {
    return this.sequence.length;
  };

  return Sequence;
});