/**
@class SequenceTransform
@module Sequence
@submodule SequenceCanvas
@static
**/
define(function(require) {
  var SynbioData = require('common/lib/synbio_data'),
      SequenceTransforms;

  SequenceTransforms = SequenceTransforms || {};

  return {
    /**
    @method codonToAALong
    @params {String} codon
    @returns {String} long-form amino acid
    **/
    codonToAALong: function(codon) {
      var map = SequenceTransforms.codonToAALong;
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

    /**
    @method codonToAAShort
    @params {String} codon
    @returns {String} short-form amino acid
    **/
    codonToAAShort: function(codon) {
      var map = SequenceTransforms.codonToAAShort;
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

    /**
    @method toComplements
    @params {String} sequence
    @returns {String} sequence complement
    **/
    toComplements: function(sequence) {
      var map = SequenceTransforms.toComplements;
      map = map || {'A': 'T', 'C': 'G', 'T': 'A', 'G': 'C'};
      return _.map(sequence.split(''), function(base) { return map[base] || ' '; }).join('');
    }
  };
});