/* eslint-env jasmine */
import {
  // checkForPolyN,
  // deltaEnthalpy,
  // deltaEntropy,
  // saltCorrection,
  // correctedDeltaEntropy,
  // meltingTemperature2,
  // meltingTemperature,
  // gcContent,
  // molecularWeight,
  // nearestNeighborsCalculator,
  // dnaTextColour,
  longestCommonSubsequence,
  selfDimers
} from '../sequence_calculations';
import _ from 'underscore';


describe('sequence calculations: ', function() {
  describe('longestCommonSubsequence', function() {
    describe('comparing to sequences without common bases', function() {
      it('should return null', function() {
        var result = longestCommonSubsequence('TTT', 'AAA');
        expect(result).toEqual(null);
      });
    });

    describe('comparing identical sequences', function() {
      it('should return the entire sequence', function() {
        var result = longestCommonSubsequence('AAA', 'AAA');
        expect(result).toEqual({
          subSeq: 'AAA',
          size: 3,
          index: 0
        });
      });
    });

    describe('comparing sequences with multiple common subsequences of different sizes', function() {
      it('should return the longest common subsequence', function() {
        var result = longestCommonSubsequence(
          'TTTATCCATCCGATTCGA', 
          'AAAATGGATCGGTAACGACCG'
        );
        expect(result).toEqual({
          subSeq: 'ATC',
          size: 3,
          index: 7
        });
      });
    });

    describe('comparing sequences with multiple common subsequences of identical size', function() {
      it('should return the first common subsequence', function() {
        var result = longestCommonSubsequence(
          'AAATTTAGGGACCCAATCG', 
          'TTTTTTGGGGGCCC'
        );
        expect(result).toEqual({
          subSeq: 'TTT',
          size: 3,
          index: 3
        });
      });
    });

    describe('when using a threshold > 0', function() {
      const threshold = 4;
      it('should return no subsequences shorter than the threshold', function() {
        var result = longestCommonSubsequence(
          'AAATTTAGGGACCCAATCG', 
          'TTTTTTGGGGGCCC',
          threshold
        );

        expect(result).toEqual(null);
      });

      it('should still return the relevant subsequence if longer than the threshold', function() {
        var result = longestCommonSubsequence(
          'AAATTTAGGGGACCCAATCG', 
          'TTTTTTGGGGGCCCC',
          threshold
        );

        expect(result).toEqual({
          subSeq: 'GGGG',
          size: 4,
          index: 7
        });

        var result2 = longestCommonSubsequence(
          'AAATTTAGGGGGACTCCAATCG', 
          'TTTTTTGGGGGGACCCC',
          threshold
        );

        expect(result2).toEqual({
          subSeq: 'GGGGGAC',
          size: 7,
          index: 7
        });
      });
    });
  });

  const primerDimers = {
    'CGTGGTAGCTTGACCCTGAG': [
      {index: 6, offset: -4, size: 4, subSeq: 'AGCT'}, 
      {index: 3, offset: -2, size: 3, subSeq: 'GGT'}],
    'TGCTGGGATAAGGTCTCTCAT': [],
    'CGTGAGCAAGACTGGGTCACCCAAAGCGACGCGTCTAA': [
      {subSeq: 'GTGA', index: 1, size: 4, offset: -17},
      {subSeq: 'GAC', index: 9, size: 3, offset: -11},
      {subSeq: 'CGT', index: 0, size: 3, offset: -7},
      {subSeq: 'TGGGT', index: 12, size: 5, offset: -3},
      {subSeq: 'AGAC', index: 2, size: 4, offset: 6},
      {subSeq: 'GTC', index: 8, size: 3, offset: 7},
      {subSeq: 'GCG', index: 6, size: 3, offset: 19},
      {subSeq: 'GACGCGTC', index: 3, size: 8, offset: 24}
    ]
  };

  describe('selfDimers', function() {
    describe('using known primers', function() {
      it('should find the correct self-diming locations', function() {
        _.each(primerDimers, function(results, primer) {
          expect(selfDimers(primer, 3)).toEqual(results);
        });
      });
    });
  });
});