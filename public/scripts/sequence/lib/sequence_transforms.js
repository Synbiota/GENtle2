/**
@class SequenceTransform
@module Sequence
@submodule SequenceCanvas
@static
**/
import SynbioData from '../../common/lib/synbio_data';
import _ from 'underscore';

var iupacToBases, toComplementsMap,
    codonToAALongMap, codonToAAShortMap,
    SequenceTransforms;

SequenceTransforms = SequenceTransforms || {};

toComplementsMap = {'A': 'T', 'C': 'G', 'T': 'A', 'G': 'C'};

export default {

  /**
  @method codonToAALong
  @params {String} codon
  @returns {String} long-form amino acid
  **/
  codonToAALong: function(codon) {
    if(codonToAALongMap === undefined) {
      codonToAALongMap = [];
      _.each(SynbioData.aa, (aa) => {
        _.each(aa.codons, (codon) => {
          codonToAALongMap[codon] = aa.long || '   ';
        });
      });
    }
    return codonToAALongMap[codon];
  },

  /**
  @method codonToAAShort
  @params {String} codon
  @returns {String} short-form amino acid
  **/
  codonToAAShort: function(codon) {
    if(codonToAAShortMap === undefined) {
      codonToAAShortMap = [];
      _.each(SynbioData.aa, function(aa) {
        _.each(aa.codons, function(codon) {
          codonToAAShortMap[codon] = (aa.short || ' ') + '  ';
        });
      });
    }
    return codonToAAShortMap[codon];
  },

  /**
  @method toComplements
  @params {String} sequence
  @returns {String} sequence complement
  **/
  toComplements: function(sequence) {
    var map = toComplementsMap;
    return _.map(sequence.split(''), (base) => map[base] || ' ').join('');
  },

  toReverseComplements: function(sequence) {
    var o = '';
    for (var i = sequence.length - 1; i >= 0; i--)
      o += toComplementsMap[sequence[i]];
    return o;
  },

  iupacToBases: _.memoize(function(sequence) {
    var output = sequence;
    iupacToBases = iupacToBases || _.invert(SynbioData.bases2iupac);
    _.each(iupacToBases, function(bases, iupac) {
      output = output.replace(new RegExp(iupac, 'gi'), bases);
    });
    return output;
  })
};