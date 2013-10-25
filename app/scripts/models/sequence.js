if (typeof define !== 'function') { var define = require('amdefine')(module) }
/**
Generic class for handling DNA sequences
@class Sequence
@constructor
**/
define(function() {

  /**
  @method Sequence
  **/
  function Sequence(sequence, withBuffer) {
    /**
    Sequence stored as a String
    @property {String} sequence
    **/
    this.sequence = sequence;

    /**
    Sequence stored as an ArrayBuffer. Only populated if `withBuffer` argument is true
    @property {ArrayBuffer} sequenceBuffer
    **/
    if(withBuffer === true)
      this.sequenceBuffer = this.stringToArrayBuffer(sequence);
  }

  /**
  Utility method used to convert `String` into `ArrayBuffer`.
  @method stringToArrayBuffer
  @param {String} str
  returns {ArrayBuffer}
  **/
  Sequence.prototype.stringToArrayBuffer = function(str) {
    var buffer = new ArrayBuffer(str.length*2);
    var bufferView = new Uint16Array(buffer);
    for(var i = 0; i<str.length; i++)
      bufferView[i] = str.charCodeAt(i);
    return buffer;
  }

  /**
  Utility method used to convert `ArrayBuffer` into `String`
  @method arrayBufferToString
  @param {ArrayBuffer} buffer
  @returns {String}
  **/
  Sequence.prototype.ArrayBufferToString = function(buffer) {
    var bufferView = new Uint16Array(buffer);
    return String.fromCharCode.apply(null, bufferView);
  }

  /**
  Returns a sub-sequence of the main sequence. Bases are indexed from 0.
  @method getFromString
  @param {Integer} startBase Start position of the requested sub-sequence in the main sequence. If no `endBase` is provided, this method will only return the base at the `startBase` position.
  @param {Integer} [endBase] End position of the requested sub-sequence in the main sequence.
  @returns {String} Requested sub-sequence
  **/
  Sequence.prototype.getFromString = function(startBase, endBase) {
    if(endBase === undefined) endBase = startBase;
    else endBase = Math.min(this.length()-1, endBase)
    startBase = Math.min(Math.max(0,startBase), this.length()-1);
    return this.sequence.substr(startBase, endBase-startBase+1);
  };

  /**
  Returns sub-sequence from buffer. Experimental.
  @method getFromBuffer
  @param {Integer} startBase Start position of the requested sub-sequence in the main sequence. If no `endBase` is provided, this method will only return the base at the `startBase` position.
  @param {Integer} [endBase] End position of the requested sub-sequence in the main sequence.
  @returns {String} Requested sub-sequence
  **/
  Sequence.prototype.getFromBuffer = function(startBase, endBase) {
    if(this.sequenceBuffer !== undefined) {
      if(endBase === undefined) endBase = startBase;
      else endBase = Math.min(this.length()-1, endBase)
      startBase = Math.min(Math.max(0,startBase), this.length()-1);
      return this.arrayBufferToString(this.sequenceBuffer.slice(startBase*2, (endBase-startBase+1)*2));
    } else {
      return this.getFromString(startBase, endBase);
    }
  };

  /**
  Alias for {{#crossLink "Sequence/getFromString:method"}}{{/crossLink}}
  @method get
  @param {Integer} startBase 
  @param {Integer} [endBase]
  @returns {String}
  **/
  Sequence.prototype.get = Sequence.prototype.getFromString;

  /**
  @method length
  @returns {Integer} Total length of the sequence
  **/
  Sequence.prototype.length = function() {
    return this.sequence.length;
  };

  return Sequence;
});