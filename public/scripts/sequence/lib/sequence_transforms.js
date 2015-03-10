/**
@class SequenceTransform
@module Sequence
@submodule SequenceCanvas
@static
**/
import SynbioData from '../../common/lib/synbio_data';
import _ from 'underscore';

var iupacToBasesMap, toComplementsMap,
    codonToAALongMap, codonToAAShortMap,
    SequenceTransforms;

SequenceTransforms = SequenceTransforms || {};

toComplementsMap = {
  'A': 'T', 
  'C': 'G', 
  'T': 'A', 
  'G': 'C',
  'N': 'N',
  'R': 'Y',
  'Y': 'R',
  'S': 'S',
  'W': 'W',
  'K': 'M',
  'M': 'K',
  'B': 'V',
  'V': 'B',
  'D': 'H'
};

/**
@method codonToAALong
@params {String} codon
@returns {String} long-form amino acid
**/
var codonToAALong = function(codon) {
  if(codonToAALongMap === undefined) {
    codonToAALongMap = [];
    _.each(SynbioData.aa, (aa) => {
      _.each(aa.codons, (codon) => {
        codonToAALongMap[codon] = aa.long || '   ';
      });
    });
  }
  return codonToAALongMap[codon];
};

/**
@method codonToAAShort
@params {String} codon
@returns {String} short-form amino acid
**/
var codonToAAShort = function(codon) {
  if(codonToAAShortMap === undefined) {
    codonToAAShortMap = [];
    _.each(SynbioData.aa, function(aa) {
      _.each(aa.codons, function(codon) {
        codonToAAShortMap[codon] = (aa.short || ' ') + '  ';
      });
    });
  }
  return codonToAAShortMap[codon];
};

/**
@method toComplements
@params {String} sequence
@returns {String} sequence complement
**/
var toComplements = function(sequence) {
  var map = toComplementsMap;
  return _.map(sequence.split(''), (base) => map[base] || ' ').join('');
};

var toReverseComplements = function(sequence) {
  var o = '';
  for (var i = sequence.length - 1; i >= 0; i--)
    o += toComplementsMap[sequence[i]];
  return o;
};

var iupacToBases = _.memoize(function(sequence) {
  var output = sequence;
  iupacToBasesMap = iupacToBasesMap || _.invert(SynbioData.bases2iupac);
  _.each(iupacToBasesMap, function(bases, iupac) {
    output = output.replace(new RegExp(iupac, 'gi'), bases);
  });
  return output;
});

var isPalindromic = function(sequence) {
  return sequence == toReverseComplements(sequence);
};

export default {
  codonToAALong: codonToAALong,
  codonToAAShort: codonToAAShort,
  toComplements: toComplements,
  iupacToBases: iupacToBases,
  toReverseComplements: toReverseComplements,
  isPalindromic: isPalindromic
};