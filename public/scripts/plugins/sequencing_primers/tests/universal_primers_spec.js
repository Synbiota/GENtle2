import {findPrimers, universalPrimers} from '../lib/universal_primers';
import {sequenceFromMike} from './test_sequences';

describe('finding universal primers', function() {
  it('finds forward and reverse primers for sequence from Mike', function() {
    var {forwardSequencePrimer, reverseSequencePrimer} = findPrimers(sequenceFromMike, universalPrimers());

    expect(forwardSequencePrimer.from).toEqual(41);
    expect(forwardSequencePrimer.to).toEqual(60);
    expect(forwardSequencePrimer.antisense).toEqual(false);

    expect(reverseSequencePrimer.from).toEqual(8829);
    expect(reverseSequencePrimer.to).toEqual(8810);
    expect(reverseSequencePrimer.antisense).toEqual(true);
  });
});
