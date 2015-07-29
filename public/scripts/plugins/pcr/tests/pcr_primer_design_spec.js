/* eslint-env jasmine */
// runs the calls to registerAssociation
import plugin from '../plugin';

import SequenceTransforms from 'gentle-sequence-transforms';
import {getPcrProductAndPrimers, calculatePcrProductFromPrimers} from '../lib/pcr_primer_design';
import Primer from '../lib/primer';
import PcrPrimer from '../lib/pcr_primer';
import PcrProductSequence from '../lib/product';
import SequenceModel from '../../../sequence/models/sequence';
import SequenceRange from '../../../library/sequence-model/range';
import RdpTypes from 'gentle-rdp/rdp_types';
import WipRdpPcrSequence from '../lib/wip_rdp_pcr_sequence';

import idtMeltingTemperatureStub from './idt_stub';
import {stubCurrentUser} from '../../../common/tests/stubs';
import {stubOutIDTMeltingTemperature, restoreIDTMeltingTemperature} from '../lib/primer_calculation';





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

var opts = {
  from: frm,
  to: to,
  name: "vioA",
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
  targetMeltingTemperature: 65,
  minPrimerLength: 10,
  maxPrimerLength: 40,
  meltingTemperatureTolerance: 1.5,
  targetGcContent: 0.5,
  useIDT: true,
};


let forward = opts.stickyEnds.start.sequence + forwardAnnealingRegionSequence;
let reverse = reverseAnnealingRegionSequence + opts.stickyEnds.end.sequence;

var expectedPcrProductSequence = forward + interveningSequence + reverse;

let reverseComplement = SequenceTransforms.toReverseComplements(reverse);
var reverseAnnealingRegionSequenceComplement = SequenceTransforms.toReverseComplements(reverseAnnealingRegionSequence);


describe('calculating PCR primers', function() {
  var wipRdpPcrSequence;

  beforeAll(function() {
    stubCurrentUser();
    stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
  });

  afterAll(function() {
    restoreIDTMeltingTemperature();
  });

  beforeEach(function() {
    wipRdpPcrSequence = new WipRdpPcrSequence({sequence, partType: RdpTypes.types.CDS});
  });

  it('errors on from being < to', function(done) {
    var options = {
      from: 10,
      to: 9,
    };
    getPcrProductAndPrimers(wipRdpPcrSequence, options)
    .then(function() {
      // We should not get here.
      expect(true).toEqual(undefined);
      done();
    })
    .catch(function(e) {
      expect(e.toString()).toEqual('`from` must be <= `to`');
      done();
    })
    .done();
  });

  it('errors on `to - from` being too small', function(done) {
    var options = {
      from: 10,
      to: 18, // remember `to` is inclusive
    };
    getPcrProductAndPrimers(wipRdpPcrSequence, options)
    .then(function() {
      // We should not get here.
      expect(true).toEqual(undefined);
      done();
    })
    .catch(function(e) {
      expect(/`sequenceOptions.from` is too large or sequence is too short to leave enough sequence length to find the primer$/.test(e.toString())).toEqual(true);
      done();
    })
    .done();
  });

  it('succeeds', function(done) {
    getPcrProductAndPrimers(wipRdpPcrSequence, opts)
    .then(function(pcrProduct) {
      // models and child models/associations
      expect(pcrProduct instanceof PcrProductSequence).toEqual(true);
      let forwardPrimer = pcrProduct.get('forwardPrimer');
      let reversePrimer = pcrProduct.get('reversePrimer');
      expect(forwardPrimer instanceof PcrPrimer).toEqual(true);
      expect(reversePrimer instanceof PcrPrimer).toEqual(true);
      expect(forwardPrimer.range instanceof SequenceRange).toEqual(true);
      expect(reversePrimer.range instanceof SequenceRange).toEqual(true);
      let forwardAnnealingRegion = forwardPrimer.annealingRegion;
      let reverseAnnealingRegion = reversePrimer.annealingRegion;
      expect(forwardAnnealingRegion instanceof Primer).toEqual(true);
      expect(reverseAnnealingRegion instanceof Primer).toEqual(true);
      expect(forwardAnnealingRegion.range instanceof SequenceRange).toEqual(true);
      expect(reverseAnnealingRegion.range instanceof SequenceRange).toEqual(true);

      // Sequences
      expect(forwardAnnealingRegion.getSequence()).toEqual(forwardAnnealingRegionSequence);
      expect(reverseAnnealingRegion.getSequence()).toEqual(reverseAnnealingRegionSequenceComplement);
      expect(forwardPrimer.getSequence()).toEqual(forward);
      expect(reversePrimer.getSequence()).toEqual(reverseComplement);
      expect(pcrProduct.getSequence(pcrProduct.STICKY_END_FULL)).toEqual(expectedPcrProductSequence);

      // Range (new SequenceRange class instances) & size
      expect(forwardAnnealingRegion.range.from).toEqual(23);
      expect(forwardPrimer.range.from).toEqual(0);
      expect(forwardAnnealingRegion.range.to).toEqual(23+19);  // exclusive
      expect(forwardPrimer.range.to).toEqual(23+19);  // exclusive
      expect(reverseAnnealingRegion.range.from).toEqual(23+19+105);
      expect(reversePrimer.range.from).toEqual(23+19+105);
      expect(reverseAnnealingRegion.range.to).toEqual(23+19+105+17);  // exclusive
      expect(reversePrimer.range.to).toEqual(23+19+105+17+23);  // exclusive
      expect(pcrProduct.getLength(pcrProduct.STICKY_END_FULL)).toEqual(expectedPcrProductSequence.length);
      let mid = forwardAnnealingRegionSequence + interveningSequence + reverseAnnealingRegionSequence;
      expect(pcrProduct.getLength(pcrProduct.STICKY_END_NONE)).toEqual(mid.length);

      // Test Features
      // TODO, use new SequenceRange class:  range objects are old objects where
      // from can be > to and to
      // is inclusive, except when it's not (i.e. `to < from` which means the
      // range is a reverse strand range))
      let features = pcrProduct.getFeatures(pcrProduct.STICKY_END_FULL);
      expect(features.length).toEqual(3);
      // Start stickyEnd
      expect(features[0].name).toEqual("X end");
      expect(features[0]._type).toEqual("sticky_end");
      expect(features[0].ranges[0].from).toEqual(0);
      expect(features[0].ranges[0].to).toEqual(23 - 1);  // inclusive
      // End stickyEnd
      expect(features[1].name).toEqual("Z' end");
      expect(features[1]._type).toEqual("sticky_end");
      expect(features[1].ranges[0].from).toEqual(23+19+105+17+23 - 1);
      expect(features[1].ranges[0].to).toEqual(23+19+105+17 - 2);  // exclusive as in reverse
      // // Forward Annealing region
      // expect(features[2].name).toEqual("Annealing region");
      // expect(features[2]._type).toEqual("annealing_region");
      // expect(features[2].ranges[0].from).toEqual(23);
      // expect(features[2].ranges[0].to).toEqual(23+19 - 1);  // inclusive
      // // Reverse Annealing region
      // expect(features[3].name).toEqual("Annealing region");
      // expect(features[3]._type).toEqual("annealing_region");
      // expect(features[3].ranges[0].from).toEqual(23+19+105+17 - 1);
      // expect(features[3].ranges[0].to).toEqual(23+19+105 - 2);  // exclusive as in reverse
      // // Forward Primer
      // expect(features[4].name).toEqual("Forward primer");
      // expect(features[4]._type).toEqual("primer");
      // expect(features[4].ranges[0].from).toEqual(0);
      // expect(features[4].ranges[0].to).toEqual(23+19 - 1);  // inclusive
      // // Reverse Primer
      // expect(features[5].name).toEqual("Reverse primer");
      // expect(features[5]._type).toEqual("primer");
      // expect(features[5].ranges[0].from).toEqual(23+19+105+17+23 - 1);
      // expect(features[5].ranges[0].to).toEqual(23+19+105 - 2);  // exclusive as in reverse

      // features = pcrProduct.getFeatures(pcrProduct.STICKY_END_NONE);
      // expect(features.length).toEqual(4);
      // // Forward Annealing region
      // expect(features[0].name).toEqual("Annealing region");
      // expect(features[0]._type).toEqual("annealing_region");
      // expect(features[0].ranges[0].from).toEqual(0);
      // expect(features[0].ranges[0].to).toEqual(19 - 1);  // inclusive
      // // Reverse Annealing region
      // expect(features[1].name).toEqual("Annealing region");
      // expect(features[1]._type).toEqual("annealing_region");
      // expect(features[1].ranges[0].from).toEqual(19+105+17 - 1);
      // expect(features[1].ranges[0].to).toEqual(19+105 - 2);  // exclusive as in reverse
      // // Forward Primer
      // expect(features[2].name).toEqual("Forward primer");
      // expect(features[2]._type).toEqual("primer");
      // expect(features[2].ranges[0].from).toEqual(0);
      // expect(features[2].ranges[0].to).toEqual(19 - 1);  // inclusive
      // // Reverse Primer
      // expect(features[3].name).toEqual("Reverse primer");
      // expect(features[3]._type).toEqual("primer");
      // expect(features[3].ranges[0].from).toEqual(19+105+17 - 1);
      // expect(features[3].ranges[0].to).toEqual(19+105 - 2);  // exclusive as in reverse


      done();
    })
    .catch(function(e) {
      // We should not get here.
      expect(e).toEqual(undefined);
      done();
    })
    .done();
    
  });
});


describe('calculating PCR product from primers', function() {
  var pcrProduct;
  var forwardPrimer;
  var reversePrimer;

  beforeAll(function() {
    var sequenceModel = new SequenceModel({sequence});

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

    pcrProduct = calculatePcrProductFromPrimers(sequenceModel, opts, forwardAnnealingRegion, reverseAnnealingRegion);
    forwardPrimer = pcrProduct.get('forwardPrimer');
    reversePrimer = pcrProduct.get('reversePrimer');
  });

  it('correct attributes', function() {
    // expect(pcrProduct.get('meta.pcr.options.to')).toEqual(to);
    // expect(pcrProduct.get('meta.pcr.options.from')).toEqual(frm);
    expect(pcrProduct.get('name')).toEqual('vioA');
    expect(pcrProduct.getSequence(pcrProduct.STICKY_END_FULL)).toEqual(expectedPcrProductSequence);
  });

  it('correct forward Primer', function() {
    expect(forwardPrimer.getSequence()).toEqual(opts.stickyEnds.start.sequence + forwardAnnealingRegionSequence);
    expect(forwardPrimer.range.from).toEqual(0);
    expect(forwardPrimer.range.to).toEqual(42);
  });

  it('correct reverse Primer', function() {
    expect(reversePrimer.getSequence()).toEqual(SequenceTransforms.toReverseComplements(opts.stickyEnds.end.sequence) + reverseAnnealingRegionSequenceComplement);
    expect(reversePrimer.range.from).toEqual(expectedPcrProductSequence.length - opts.stickyEnds.end.sequence.length - reverseAnnealingRegionSequence.length);
    expect(reversePrimer.range.to).toEqual(expectedPcrProductSequence.length);
  });

  it('correct forward Annealing Region', function() {
    var forwardAnnealingRegion = forwardPrimer.annealingRegion;
    expect(forwardAnnealingRegion.getSequence()).toEqual(forwardAnnealingRegionSequence);
    expect(forwardAnnealingRegion.range.from).toEqual(23);
    expect(forwardAnnealingRegion.range.to).toEqual(42);
  });

  it('correct reverse Annealing Region', function() {
    var reverseAnnealingRegion = reversePrimer.annealingRegion;
    expect(reverseAnnealingRegion.getSequence()).toEqual(reverseAnnealingRegionSequenceComplement);
    expect(reverseAnnealingRegion.range.from).toEqual((
      expectedPcrProductSequence.length -
      opts.stickyEnds.end.sequence.length -
      reverseAnnealingRegionSequence.length)
    );
    expect(reverseAnnealingRegion.range.to).toEqual((
      expectedPcrProductSequence.length -
      opts.stickyEnds.end.sequence.length)
    );
  });
});
