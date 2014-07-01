define(function(require) {
  var SynbioData = require('common/lib/synbio_data'),
      SequenceTransforms = require('./sequence_transforms'),
      iupacToBases,
      restrictionEnzymes,
      restrictionEnzymesByBases,
      restrictionEnzymesByLength,
      RestrictionEnzymes;

  iupacToBases = SequenceTransforms.iupacToBases;

  RestrictionEnzymes = {};

  RestrictionEnzymes.all = function() {
    restrictionEnzymes = restrictionEnzymes || (function() {
      return _.map(SynbioData.restriction_enzymes, function(enzyme) {
        return _.extend(enzyme, {
          bases: iupacToBases(enzyme.seq)
        });
      });
    })();

    return restrictionEnzymes;
  };

  RestrictionEnzymes.byBases = function() {
    restrictionEnzymesByBases = restrictionEnzymesByBases || (function() {
      var output = {};
      _.each(RestrictionEnzymes.all(), function(enzyme) {
        var bases = enzyme.bases;
        output[bases] = output[bases] || [];
        output[bases].push(enzyme);
      });
      return output;
    })();
    return restrictionEnzymesByBases;
  };

  RestrictionEnzymes.byLength = function() {
    restrictionEnzymesByLength = restrictionEnzymesByLength || (function() {
      var output = {};
      _.each(RestrictionEnzymes.all(), function(enzyme) {
        var length = enzyme.seq.length,
            bases = enzyme.bases;
        output[length] = output[length] || {};
        output[length][bases] = output[length][bases] || [];
        output[length][bases].push(enzyme);
      });
      return output;
    })();
    return restrictionEnzymesByLength;
  };

  RestrictionEnzymes.getAllInSeq = function(seq, options) {
    var matches = {},
        checkAndAddMatch;
    options = options || {}; 

    checkAndAddMatch = function(enzymes, bases) {
      var idx = seq.indexOf(bases);
      if(~idx) {
        matches[idx] = (matches[idx] || []).concat(enzymes);
      }
    };

    if(options.length) {
      if(!_.isArray(options.length)) options.length = [options.length];
      _.each(options.length, function(length) {
        _.each(RestrictionEnzymes.byLength()[length], checkAndAddMatch);
      });
    } else {
      _.each(RestrictionEnzymes.byBases(), checkAndAddMatch);
    }

    return matches;
  };

  RestrictionEnzymes.maxLength = _.memoize(function() {
    return _.max(_.map(RestrictionEnzymes.all(), function(enzyme) {
      return enzyme.seq.length;
    }));
  });

  RestrictionEnzymes.maxBaseLength = _.memoize(function() {
    return _.max(_.map(RestrictionEnzymes.all(), function(enzyme) {
      return enzyme.bases.length;
    }));
  });

  window.re = RestrictionEnzymes;

  return RestrictionEnzymes;
});