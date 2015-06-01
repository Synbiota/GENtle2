// define(function(require) {
  var Blank     = require('./lines/blank'),
      Position  = require('./lines/position'),
      DNA       = require('./lines/dna'),
      Feature   = require('./lines/feature'),
      RestrictionEnzymeSites 
                = require('./lines/restriction_enzymes_sites'),
      RestrictionEnzymeLabels
                = require('./lines/restriction_enzymes_labels'),
      OldFeature = require('./lines/old_feature');

  export default {
    Blank: Blank,
    Position: Position,
    DNA: DNA,
    Feature: Feature,
    RestrictionEnzymeSites: RestrictionEnzymeSites,
    RestrictionEnzymeLabels: RestrictionEnzymeLabels,
    OldFeature
  };
// });