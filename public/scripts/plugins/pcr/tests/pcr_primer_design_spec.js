// TODO add dependency on underscore.mixin
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import {calculatePcrProductFromPrimers, getSequencesToSearch} from '../lib/pcr_primer_design';
import PcrPrimerModel from '../lib/primer';


var startOffsetSequence = 'AGAGCAAGA';
var forwardAnnealingRegionSequence = 'GCTGAGCCATTCCCCTTCA';
var interveningSequence = 'GATTTTGACCCGTCGG' +
'CGGCCGCGCCGCCGGCGGGTGTCGATTGAATGAACCAAGGAATTTCGTGATGAAGCACTCTTCGGATATT' +
'GCGCCGGAATCAGCGGCTA';
var reverseAnnealingRegionSequence = 'TGAGCTGCGCGACGTAT';
var remainingSequence = 'TTGCTGGAATCGCCCGCCTGCCGCG' +
'GCGGATTTTCGACATGCAGACGGAGGCGGGGGGACGCATCCGCTCGAAAAACCTGGACGGCAAGGCCGCG' +
'ATAGAGCTGGGTGCCGGCCGCTACTCGCCGCAACTGCACCCGCAGTTCCAGAGCGTGATGCAAAGCTACA' +
'GCCAGCGCAGCGAACGCTATCCCTTCACCCAGCTGAAATTCAAGAACCGCGTCCAGCAAACGCTGAAAAG';

var sequence = (
  startOffsetSequence +
  forwardAnnealingRegionSequence +
  interveningSequence +
  reverseAnnealingRegionSequence +
  remainingSequence
);

var frm = 9;
var to = 149;

var opts;
var pcrProduct;
var reverseAnnealingRegionSequenceComplement;
var forwardPrimer;
var reversePrimer;

var forwardAnnealingRegion = function() {
  return new PcrPrimerModel({
    sequence: forwardAnnealingRegionSequence,
    from: 0,
    to: 18,
    meltingTemperature: 64.1,
    gcContent: 0.5789473684210527,
    id: "1426877294103-16080",
    name: "Sequence 1426877294103-16080",
    ourMeltingTemperature: 64.77312154400113,
  });
};

var reverseAnnealingRegion = function() {
  return new PcrPrimerModel({
    sequence: reverseAnnealingRegionSequenceComplement,
    from: 0,
    to: 16,
    meltingTemperature: 63.5,
    gcContent: 0.5882352941176471,
    id: "1426877290866-1893c",
    name: "Sequence 1426877290866-1893c",
  });
};


describe('calculating PCR product from primers', function() {
  beforeEach(function() {
    if(!pcrProduct) {
      reverseAnnealingRegionSequenceComplement = SequenceTransforms.toReverseComplements(reverseAnnealingRegionSequence);
      opts = {
        from: frm,
        to: to,
        name: "vioA",
        targetMeltingTemperature: 65,
        stickyEnds: {
          start: {
            sequence: 'CCTGCAGTCAGTGGTCTCTAGAG',
            reverse: false,
            offset: 19,
            size: 4,
            name: "X",
          },
          end: {
            sequence: 'GAGATGAGACCGTCAGTCACGAG',
            reverse: true,
            offset: 19,
            size: 4,
            name: "Z'",
          }
        },
        minPrimerLength: 10,
        maxPrimerLength: 40,
        meltingTemperatureTolerance: 1.5,
        targetGcContent: 0.5,
        useIDT: true,
      };

      pcrProduct = calculatePcrProductFromPrimers(sequence, opts, forwardAnnealingRegion(), reverseAnnealingRegion());
      pcrProduct = pcrProduct.getBaseSequenceModel();
      forwardPrimer = pcrProduct.forwardPrimer;
      reversePrimer = pcrProduct.reversePrimer;
    }
  });

  it('correct other attributes', function() {
    expect(pcrProduct.to).toEqual(to);
    expect(pcrProduct.from).toEqual(frm);
    expect(pcrProduct.name).toEqual('vioA');
    expect(pcrProduct.sequence).toEqual(
      forwardPrimer.sequence +
      interveningSequence +
      SequenceTransforms.toReverseComplements(reversePrimer.sequence)
    );
    expect(pcrProduct.meltingTemperature).toBeGreaterThan(91.0);
    expect(pcrProduct.meltingTemperature).toBeLessThan(91.1);
  });

  it('correct forward Annealing Region', function() {
    var forwardAnnealingRegionPrimerModel = pcrProduct.forwardAnnealingRegionPrimerModel;
    expect(forwardAnnealingRegionPrimerModel.sequence).toEqual(forwardAnnealingRegionSequence);
    expect(forwardAnnealingRegionPrimerModel.from).toEqual(23);
    expect(forwardAnnealingRegionPrimerModel.to).toEqual(41);
  });

  it('correct reverse Annealing Region', function() {
    var reverseAnnealingRegionPrimerModel = pcrProduct.reverseAnnealingRegionPrimerModel;
    expect(reverseAnnealingRegionPrimerModel.sequence).toEqual(reverseAnnealingRegionSequenceComplement);
    expect(reverseAnnealingRegionPrimerModel.from).toEqual((
      opts.stickyEnds.start.sequence.length +
      forwardAnnealingRegionSequence.length +
      interveningSequence.length +
      reverseAnnealingRegionSequence.length - 1)
    );
    expect(reverseAnnealingRegionPrimerModel.to).toEqual((
      reverseAnnealingRegionPrimerModel.from -
      reverseAnnealingRegionSequence.length)
    );
  });

  it('correct forward Primer', function() {
    expect(forwardPrimer.sequence).toEqual(opts.stickyEnds.start.sequence + forwardAnnealingRegionSequence);
    expect(forwardPrimer.from).toEqual(0);
    expect(forwardPrimer.to).toEqual(41);
  });

  it('correct reverse Primer', function() {
    expect(reversePrimer.sequence).toEqual(SequenceTransforms.toReverseComplements(opts.stickyEnds.end.sequence) + reverseAnnealingRegionSequenceComplement);
    expect(reversePrimer.from).toEqual(pcrProduct.sequence.length - 1);
    expect(reversePrimer.to).toEqual(reversePrimer.from - reversePrimer.sequence.length);
  });
});


describe('getSequencesToSearch', function() {
  it('correct sequences', function() {
    var {
      forwardSequenceToSearch: forwardSequenceToSearch,
      reverseSequenceToSearch: reverseSequenceToSearch
    } = getSequencesToSearch(sequence, opts);
    expect(forwardSequenceToSearch.indexOf(forwardAnnealingRegionSequence)).toEqual(0);
    expect(reverseSequenceToSearch.indexOf(reverseAnnealingRegionSequenceComplement)).toEqual(0);
  });
});
