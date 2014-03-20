define(function(require) {
  var SynbioData = require('lib/synbio_data'),
      _          = require('underscore'),
      SequenceTransforms;

  SequenceTransforms = SequenceTransforms || {};

  return {
    codonsToAALong: function(codon) {
      var map = SequenceTransforms.codonsToAALong;
      if(map === undefined) {
        map = [];
        _.each(SynbioData.aa, function(aa) {
          _.each(aa.codons, function(codon) {
            map[codon] = aa.long || '   ';
          });
        });
      }
      return map[codon];
    },

    codonsToAAShort: function(codon) {
      var map = SequenceTransforms.codonsToAAShort;
      if(map === undefined) {
        map = [];
        _.each(SynbioData.aa, function(aa) {
          _.each(aa.codons, function(codon) {
            map[codon] = (aa.short || ' ') + '  ';
          });
        });
      }
      return map[codon];
    },
    toComplements: function(sequence) {
      var map = SequenceTransforms.toComplements;
      map = map || {'A': 'T', 'C': 'G', 'T': 'A', 'G': 'C'};
      return _.map(sequence.split(''), function(base) { return map[base] || ' '; }).join('');
    }
  };
});