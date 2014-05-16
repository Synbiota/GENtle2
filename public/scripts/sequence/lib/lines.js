/**
POJO used for namespacing lines classes used by SequenceCanvas.
@class Lines
**/

define(function(require) {
  var Blank     = require('sequence/lib/lines/blank'),
      Position  = require('sequence/lib/lines/position'),
      DNA       = require('sequence/lib/lines/dna'),
      Feature   = require('sequence/lib/lines/feature');

  return {
    Blank: Blank,
    Position: Position,
    DNA: DNA,
    Feature: Feature
  };
});