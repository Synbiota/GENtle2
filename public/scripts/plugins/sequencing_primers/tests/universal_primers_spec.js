import {stubCurrentUser} from '../../../common/tests/stubs';

import {findUniversalPrimersHelper} from '../lib/universal_primers';
import TemporarySequenceModel from '../../../sequence/models/temporary_sequence';


stubCurrentUser();

describe('finding universal primers', function() {
  it('finds reverse primer', function() {
    var onlyContainingReverseUniversalPrimer = 'GATCACTACCGGGCGTATT' + 'AAAAAAAAAA' + 'GATCACTACCGGGCGTATT';
    var sequenceModel = new TemporarySequenceModel({sequence: onlyContainingReverseUniversalPrimer});
    var {forwardSequencePrimer, reverseSequencePrimer} = findUniversalPrimersHelper(sequenceModel);

    expect(forwardSequencePrimer).toBeUndefined();

    expect(reverseSequencePrimer.range.from).toEqual(29);
    expect(reverseSequencePrimer.range.size).toEqual(19);
    expect(reverseSequencePrimer.range.reverse).toEqual(true);
    expect(reverseSequencePrimer.range.to).toEqual(48);
  });

  it('finds forward primer', function() {
    var onlyContainingForwardUniversalPrimer = 'TGCCACCTGACGTCTAAGAA' + 'AAAAAAAAAA' + 'TGCCACCTGACGTCTAAGAA';
    var sequenceModel = new TemporarySequenceModel({sequence: onlyContainingForwardUniversalPrimer});
    var {forwardSequencePrimer, reverseSequencePrimer} = findUniversalPrimersHelper(sequenceModel);

    expect(forwardSequencePrimer.range.from).toEqual(0);
    expect(forwardSequencePrimer.range.size).toEqual(20);
    expect(forwardSequencePrimer.range.reverse).toEqual(false);
    expect(forwardSequencePrimer.range.to).toEqual(20);

    expect(reverseSequencePrimer).toBeUndefined();
  });

  it('finds forward and reverse primers for sequence', function() {
    var shortSequence = ('TTATGACAACTTGACGGCTACATCATTCACTTTTTCTTCAC' +           // 41:   0- 40  (41)
      'TGCCACCTGACGTCTAAGAA' +  // forward universal primer v1                   // 20:  41- 60  (61)
      'AACCGG' + 'CACTAACTACGGCTACACTAGAAGGACAGTATTTGGTATCTGCGCTCTGCTG' +        // 58:  61-118  (119)
      'AAGCCAGTTACCTTCGGAAAAAGAGTTGGTAGCTCTTGATCCGGCAAACAAACCACCGCTGGTAGCGGTG' + // 70: 119-188  (189)
      'GTTTTTTTGTTTGCAAGCAGCAGATTACGCGCAGAAAAAAAGGATCTCAAGAAGATCCTTTGATCTTTTC' + // 70: 189-258  (259)
      'TACGGGGTCTGACGCTCAGTGGAACGAAAACTCACGTTAAGGGATTTTGGTCATGAGATTATCAAAAAGG' + // 70: 259-328  (329)
      'ATCTTCACCTAGATCCTTTTAAATTAAAAATGAAGTTTTAAATCAATCTAAAGTATATATGAGTAAACTT' + // 70: 329-398  (399)
      'GGTCTGACAGCTCGAGGCTTGGATTCTCACCAATAAAAAACGCCCGGCGGCAACCGAGCGTTCTGAACAA' + // 70: 399-468  (469)
      'ATCCAGATGGAGTTCTGAGGTCATTACTGGATCTATCAACAGGAGTCCAAGCGAGCTCGATATCAAATTA' + // 70: 469-538  (539)
      'GATCACTACCGGGCGTATT' +  // reverse universal primer v1                    // 19: 539-557  (558)
      'CG'                                                                       //  2: 558-559  (560)
    );
    var sequenceModel = new TemporarySequenceModel({sequence: shortSequence});
    var {forwardSequencePrimer, reverseSequencePrimer} = findUniversalPrimersHelper(sequenceModel);

    expect(forwardSequencePrimer.range.from).toEqual(41);
    expect(forwardSequencePrimer.range.size).toEqual(20);
    expect(forwardSequencePrimer.range.reverse).toEqual(false);
    expect(forwardSequencePrimer.range.to).toEqual(61);

    expect(reverseSequencePrimer.range.from).toEqual(539);
    expect(reverseSequencePrimer.range.size).toEqual(19);
    expect(reverseSequencePrimer.range.reverse).toEqual(true);
    expect(reverseSequencePrimer.range.to).toEqual(558);
  });
});
