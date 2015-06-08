import {findPrimers, universalPrimers} from '../lib/universal_primers';


describe('finding universal primers', function() {
  it('finds reverse primer', function() {
    var onlyContainingReverseUniversalPrimer = 'GATCACTACCGGGCGTATT' + 'AAAAAAAAAA' + 'GATCACTACCGGGCGTATT';
    var {forwardSequencePrimer, reverseSequencePrimer} = findPrimers(onlyContainingReverseUniversalPrimer, universalPrimers());

    expect(forwardSequencePrimer).toBeUndefined();

    expect(reverseSequencePrimer.from).toEqual(47);
    expect(reverseSequencePrimer.to).toEqual(28);
    expect(reverseSequencePrimer.reverse).toEqual(true);
  });

  it('finds forward primer', function() {
    var onlyContainingForwardUniversalPrimer = 'TGCCACCTGACGTCTAAGAA' + 'AAAAAAAAAA' + 'TGCCACCTGACGTCTAAGAA';
    var {forwardSequencePrimer, reverseSequencePrimer} = findPrimers(onlyContainingForwardUniversalPrimer, universalPrimers());

    expect(forwardSequencePrimer.from).toEqual(0);
    expect(forwardSequencePrimer.to).toEqual(19);
    expect(forwardSequencePrimer.reverse).toEqual(false);

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

    var {forwardSequencePrimer, reverseSequencePrimer} = findPrimers(shortSequence, universalPrimers());

    expect(forwardSequencePrimer.from).toEqual(41);
    expect(forwardSequencePrimer.to).toEqual(60);
    expect(forwardSequencePrimer.reverse).toEqual(false);

    expect(reverseSequencePrimer.from).toEqual(557);
    expect(reverseSequencePrimer.to).toEqual(538);
    expect(reverseSequencePrimer.reverse).toEqual(true);
  });
});
