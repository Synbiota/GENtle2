/**
POJO used for namespacing lines classes used by SequenceCanvas.
@class Lines
**/

define(function(require) {
  var Blank     = require('lib/sequence_canvas/lines/blank'),
      Position  = require('lib/sequence_canvas/lines/position'),
      DNA       = require('lib/sequence_canvas/lines/dna'),
      Feature   = require('lib/sequence_canvas/lines/feature');

  return {
    Blank: Blank,
    Position: Position,
    DNA: DNA,
    Feature: Feature
  };
});