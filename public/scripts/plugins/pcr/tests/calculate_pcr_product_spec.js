/* eslint-env jasmine */
import SequenceTransforms from 'gentle-sequence-transforms';
import {calculatePcrProduct} from '../lib/pcr_primer_design';
import Primer from '../lib/primer';
import SequenceModel from '../../../sequence/models/sequence';


var startOffsetSequence = 'AGAGCAAGA';                                     //   0 -   8
var forwardAnnealingRegionSequence = 'GCTGAGCCATTCCCCTTCA';                //   9 -  27
var interveningSequence = 'GATTTTGACCCGTCGG' +                             //  28 -  43
'CGGCCGCGCCGCCGGCGGGTGTCGATTGAATGAACCAAGGAATTTCGTGATGAAGCACTCTTCGGATATT' + //  44 - 113
'GCGCCGGAATCAGCGGCTA';                                                     // 114 - 132
var reverseAnnealingRegionSequence = 'TGAGCTGCGCGACGTAT';                  // 133 - 149
var remainingSequence = 'TTGCTGGAATCGCCCGCCTGCCGCG';                       // 150 - 174

var sequence = (
  startOffsetSequence +
  forwardAnnealingRegionSequence +
  interveningSequence +
  reverseAnnealingRegionSequence +
  remainingSequence
);

var reverseAnnealingRegionSequenceReverseComplement = SequenceTransforms.toReverseComplements(reverseAnnealingRegionSequence);


describe('calculating PCR product from primers', function() {
  var frm = 9;  // inclusive
  var to = 149;  // exclusive

  var opts = {
    primerAnnealingFrm: frm,
    primerAnnealingTo: to,
    // name: "Violacein A",
    // shortName: "VioA",
    // desc: "The Violacein A gene.",
    // stickyEnds: stickyEndsXZ(),
    targetMeltingTemperature: 65,
    minPrimerLength: 10,
    maxPrimerLength: 40,
    meltingTemperatureTolerance: 1.5,
    targetGcContent: 0.5,
    useIDT: true,
  };

  var pcrProduct;
  var forwardPrimer;
  var reversePrimer;

  var expectedPcrProductSequence = forwardAnnealingRegionSequence + interveningSequence + reverseAnnealingRegionSequence;

  beforeAll(function() {
    var sequenceModel = new SequenceModel({
      id: 1234,
      sequence,
      name: 'Violacein A',
      shortName: "X-VioA-Z'",
      desc: 'The Violacein A gene.',
    });

    var forwardAnnealingRegion = new Primer({
      parentSequence: sequenceModel,
      range: {
        from: 9,
        size: 19,
      },
      meltingTemperature: 64.1,
      gcContent: 0.5789473684210527,
    });

    var reverseAnnealingRegion = new Primer({
      parentSequence: sequenceModel,
      range: {
        from: 133,
        size: 17,
        reverse: true,
      },
      meltingTemperature: 63.5,
      gcContent: 0.5882352941176471,
    });

    pcrProduct = calculatePcrProduct(sequenceModel, forwardAnnealingRegion, reverseAnnealingRegion, opts.prependBases);
    forwardPrimer = pcrProduct.get('forwardPrimer');
    reversePrimer = pcrProduct.get('reversePrimer');
  });

  it('correct attributes', function() {
    expect(pcrProduct.get('id') !== 1234).toEqual(true, 'Previous `id` value should not be copied over.');
    expect(pcrProduct.get('name')).toEqual('Violacein A');
    expect(pcrProduct.get('shortName')).toEqual("X-VioA-Z'");
    expect(pcrProduct.get('desc')).toEqual('The Violacein A gene.');
    expect(pcrProduct.getSequence(pcrProduct.STICKY_END_FULL)).toEqual(expectedPcrProductSequence);
  });

  it('correct forward Primer', function() {
    expect(forwardPrimer.getSequence()).toEqual(forwardAnnealingRegionSequence);
    expect(forwardPrimer.range.from).toEqual(0);
    expect(forwardPrimer.range.to).toEqual(forwardAnnealingRegionSequence.length);
  });

  it('correct reverse Primer', function() {
    expect(reversePrimer.getSequence()).toEqual(reverseAnnealingRegionSequenceReverseComplement);
    expect(reversePrimer.range.from).toEqual(expectedPcrProductSequence.length - reverseAnnealingRegionSequence.length);
    expect(reversePrimer.range.to).toEqual(expectedPcrProductSequence.length);
  });

  it('correct forward Annealing Region', function() {
    var forwardAnnealingRegion = forwardPrimer.annealingRegion;
    expect(forwardAnnealingRegion.getSequence()).toEqual(forwardAnnealingRegionSequence);
    expect(forwardAnnealingRegion.range.from).toEqual(0);
    expect(forwardAnnealingRegion.range.to).toEqual(forwardAnnealingRegionSequence.length);
  });

  it('correct reverse Annealing Region', function() {
    var reverseAnnealingRegion = reversePrimer.annealingRegion;
    expect(reverseAnnealingRegion.getSequence()).toEqual(reverseAnnealingRegionSequenceReverseComplement);
    expect(reverseAnnealingRegion.range.from).toEqual((
      expectedPcrProductSequence.length -
      reverseAnnealingRegionSequence.length)
    );
    expect(reverseAnnealingRegion.range.to).toEqual((expectedPcrProductSequence.length));
  });
});
