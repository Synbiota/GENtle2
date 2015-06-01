// define(function(require) {
  var Blank     = require('./lines/blank'),
      Position  = require('./lines/position'),
      DNA       = require('./lines/dna'),
      DNA_XY    = require('./lines/dna_xy'),
      Feature   = require('./lines/feature'),
      RestrictionEnzymeSites
                = require('./lines/restriction_enzymes_sites'),
      RestrictionEnzymeLabels
                = require('./lines/restriction_enzymes_labels');
  var Chromatogram = require('./lines/chromatogram');

  export default {
    Blank: Blank,
    Position: Position,
    DNA: DNA,
    DNA_XY: DNA_XY,
    Feature: Feature,
    RestrictionEnzymeSites: RestrictionEnzymeSites,
    RestrictionEnzymeLabels: RestrictionEnzymeLabels,
    Chromatogram
  };
// });
