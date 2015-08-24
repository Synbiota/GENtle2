/* eslint-env jasmine */
// runs the calls to registerAssociation
import plugin from '../plugin';

import _ from 'underscore';
import SequenceTransforms from 'gentle-sequence-transforms';
import {getPcrProductAndPrimers, calculatePcrProduct} from '../lib/pcr_primer_design';
import Primer from '../lib/primer';
import PcrPrimer from '../lib/pcr_primer';
import PcrProductSequence from '../lib/product';
import SequenceModel from '../../../sequence/models/sequence';
import SequenceRange from '../../../library/sequence-model/range';
// import RdpTypes from 'gentle-rdp/rdp_types';

import idtMeltingTemperatureStub from './idt_stub';
import {stubCurrentUser} from '../../../common/tests/stubs';
import {stubOutIDTMeltingTemperature, restoreIDTMeltingTemperature} from '../lib/primer_calculation';


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


// var reverseComplement = SequenceTransforms.toReverseComplements(reverse);
var reverseAnnealingRegionSequenceReverseComplement = SequenceTransforms.toReverseComplements(reverseAnnealingRegionSequence);
var remainingSequenceReverseComplement = SequenceTransforms.toReverseComplements(remainingSequence);
var reversePrimerReverseComplement = remainingSequenceReverseComplement + reverseAnnealingRegionSequenceReverseComplement;


describe('calculating PCR primers', function() {
  class TestWipPcrSequenceModel extends SequenceModel {
  }

  var wipPcrSequenceModel;
  var makeTestWipPcrSequenceModel = function(attributes={}) {
    _.defaults(attributes, {sequence});
    wipPcrSequenceModel = new TestWipPcrSequenceModel(attributes);
  };

  beforeAll(function() {
    stubCurrentUser();
    stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
  });

  afterAll(function() {
    restoreIDTMeltingTemperature();
  });

  describe('errors', function() {
    beforeEach(function(done) {
      done();
    });

    var testPresenceOfError = function(done, options, expectation) {
      makeTestWipPcrSequenceModel();
      getPcrProductAndPrimers(wipPcrSequenceModel, options)
      .then(function() {
        // We should not get here.
        expect(true).toEqual(undefined);
        done();
      })
      .catch(function(e) {
        expect(e.toString()).toMatch(expectation);
        done();
      })
      .done();
    };

    it('on frm being < to', function(done) {
      var options = {
        primerAnnealingFrm: 10,
        primerAnnealingTo: 9,
      };
      var expectation = '`opts.primerAnnealingFrm` must be <= `opts.primerAnnealingTo`';
      testPresenceOfError(done, options, expectation);
    });

    it('on `to - frm` being too small', function(done) {
      var options = {
        primerAnnealingFrm: 10,
        primerAnnealingTo: 18, // remember `to` is inclusive
      };
      var expectation = /`sequenceOptions.frm` is too large or sequence is too short to leave enough sequence length to find the primer$/;
      testPresenceOfError(done, options, expectation);
    });
  });

  describe('prependBases', function() {
    var pcrProductPromise;
    var pcrProduct;
    var forwardPrimer;
    var reversePrimer;
    var forwardAnnealingRegion;
    var reverseAnnealingRegion;

    var makePcrProductPromise = function(prependBases) {
      var opts = {
        primerAnnealingFrm: 9,  // inclusive
        primerAnnealingTo: 150,  // exclusive
        targetMeltingTemperature: 65,
        minPrimerLength: 10,
        maxPrimerLength: 40,
        meltingTemperatureTolerance: 1.5,
        targetGcContent: 0.5,
        useIDT: true,
        prependBases,
      };

      makeTestWipPcrSequenceModel({
        name: "Violacein A",
        shortName: "VioA",
        stickyEnds: {}
      });
      pcrProductPromise = getPcrProductAndPrimers(wipPcrSequenceModel, opts)
      .then(function(pcrProductInstance) {
        pcrProduct = pcrProductInstance;
        forwardPrimer = pcrProduct.get('forwardPrimer');
        reversePrimer = pcrProduct.get('reversePrimer');
        forwardAnnealingRegion = forwardPrimer.annealingRegion;
        reverseAnnealingRegion = reversePrimer.annealingRegion;
      })
      .catch(function(e) {
        // We should not get here.
        throw e;
      });
    };

    var itShouldHaveTheCorrectInstances = function(done) {
      pcrProductPromise.then(function() {
        // models and child models/associations
        expect(pcrProduct instanceof PcrProductSequence).toEqual(true);
        expect(forwardPrimer instanceof PcrPrimer).toEqual(true);
        expect(reversePrimer instanceof PcrPrimer).toEqual(true);
        expect(forwardPrimer.range instanceof SequenceRange).toEqual(true);
        expect(reversePrimer.range instanceof SequenceRange).toEqual(true);
        expect(forwardAnnealingRegion instanceof Primer).toEqual(true);
        expect(reverseAnnealingRegion instanceof Primer).toEqual(true);
        expect(forwardAnnealingRegion.range instanceof SequenceRange).toEqual(true);
        expect(reverseAnnealingRegion.range instanceof SequenceRange).toEqual(true);

        done();
      }).catch(done);
    };

    var itShouldHaveTheCorrectFeatures = function(done, expectedSequence) {
      pcrProductPromise.then(function() {
        // Test Features
        // TODO, use new SequenceRange class:  range objects are old objects where
        // from can be > to and to
        // is inclusive, except when it's not (i.e. `to < from` which means the
        // range is a reverse strand range))
        var features = pcrProduct.getFeatures(pcrProduct.STICKY_END_FULL);
        expect(features.length).toEqual(5);

        expect(features[0].name).toEqual('VioA');
        expect(features[0]._type).toEqual('misc');
        expect(features[0].ranges[0].from).toEqual(0);
        expect(features[0].ranges[0].to).toEqual(expectedSequence.length - 1);  // inclusive

        var prependedForwardSequenceLength = forwardAnnealingRegion.range.from;

        // Forward Annealing region
        expect(features[1].name).toEqual("Annealing region");
        expect(features[1]._type).toEqual("annealing_region");
        expect(features[1].ranges[0].from).toEqual(prependedForwardSequenceLength);
        expect(features[1].ranges[0].to).toEqual(prependedForwardSequenceLength+19 - 1);  // inclusive
        // Reverse Annealing region
        expect(features[2].name).toEqual("Annealing region");
        expect(features[2]._type).toEqual("annealing_region");
        expect(features[2].ranges[0].from).toEqual(prependedForwardSequenceLength+19+105+17 - 1);
        expect(features[2].ranges[0].to).toEqual(prependedForwardSequenceLength+19+105 - 2);  // exclusive as in reverse
        // Forward Primer
        expect(features[3].name).toEqual("Forward primer");
        expect(features[3]._type).toEqual("primer");
        expect(features[3].ranges[0].from).toEqual(0);
        expect(features[3].ranges[0].to).toEqual(prependedForwardSequenceLength+19 - 1);  // inclusive
        // Reverse Primer
        expect(features[4].name).toEqual("Reverse primer");
        expect(features[4]._type).toEqual("primer");
        expect(features[4].ranges[0].from).toEqual(expectedSequence.length - 1);
        expect(features[4].ranges[0].to).toEqual(prependedForwardSequenceLength+19+105 - 2);  // exclusive as in reverse

        done();
      }).catch(done);
    };

    describe('(without them)', function() {
      beforeAll(function() {
        makePcrProductPromise(false);
      });

      afterAll(function() {
        pcrProductPromise.done();
      });

      beforeEach(function(done) {
        done();
      });

      var expectedPcrProductSequence = (forwardAnnealingRegionSequence + interveningSequence + reverseAnnealingRegionSequence);

      it('should have the correct instances', function(done) {
        itShouldHaveTheCorrectInstances(done);
      });

      it('should have the correct sequences', function(done) {
        pcrProductPromise.then(function() {
          expect(forwardAnnealingRegion.getSequence()).toEqual(forwardAnnealingRegionSequence);
          expect(reverseAnnealingRegion.getSequence()).toEqual(reverseAnnealingRegionSequenceReverseComplement);
          expect(forwardPrimer.getSequence()).toEqual(forwardAnnealingRegionSequence);
          expect(reversePrimer.getSequence()).toEqual(reverseAnnealingRegionSequenceReverseComplement);
          expect(pcrProduct.getSequence(pcrProduct.STICKY_END_FULL)).toEqual(expectedPcrProductSequence);

          done();
        }).catch(done);
      });

      it('should have the correct ranges', function(done) {
        pcrProductPromise.then(function() {
          expect(forwardAnnealingRegion.range.from).toEqual(0);
          expect(forwardPrimer.range.from).toEqual(0);
          expect(forwardAnnealingRegion.range.to).toEqual(19);  // exclusive
          expect(forwardPrimer.range.to).toEqual(19);  // exclusive
          expect(reverseAnnealingRegion.range.from).toEqual(19+105);
          expect(reversePrimer.range.from).toEqual(19+105);
          expect(reverseAnnealingRegion.range.to).toEqual(19+105+17);  // exclusive
          expect(reversePrimer.range.to).toEqual(19+105+17);  // exclusive
          expect(pcrProduct.getLength(pcrProduct.STICKY_END_FULL)).toEqual(expectedPcrProductSequence.length);

          done();
        }).catch(done);
      });

      it('should have the correct features', function(done) {
        itShouldHaveTheCorrectFeatures(done, expectedPcrProductSequence);
      });
    });

    describe('(with them)', function() {
      beforeAll(function() {
        makePcrProductPromise(true);
      });

      afterAll(function() {
        pcrProductPromise.done();
      });

      beforeEach(function(done) {
        done();
      });

      it('should have the correct instances', function(done) {
        itShouldHaveTheCorrectInstances(done);
      });

      it('should have the correct sequences', function(done) {
        pcrProductPromise.then(function() {
          expect(forwardAnnealingRegion.getSequence()).toEqual(forwardAnnealingRegionSequence);
          expect(reverseAnnealingRegion.getSequence()).toEqual(reverseAnnealingRegionSequenceReverseComplement);
          expect(forwardPrimer.getSequence()).toEqual(startOffsetSequence + forwardAnnealingRegionSequence);
          expect(reversePrimer.getSequence()).toEqual(reversePrimerReverseComplement);
          expect(pcrProduct.getSequence(pcrProduct.STICKY_END_FULL)).toEqual(sequence);

          done();
        }).catch(done);
      });

      it('should have the correct ranges', function(done) {
        pcrProductPromise.then(function() {
          expect(forwardAnnealingRegion.range.from).toEqual(9);
          expect(forwardPrimer.range.from).toEqual(0);
          expect(forwardAnnealingRegion.range.to).toEqual(9+19);  // exclusive
          expect(forwardPrimer.range.to).toEqual(9+19);  // exclusive
          expect(reverseAnnealingRegion.range.from).toEqual(9+19+105);
          expect(reversePrimer.range.from).toEqual(9+19+105);
          expect(reverseAnnealingRegion.range.to).toEqual(9+19+105+17);  // exclusive
          expect(reversePrimer.range.to).toEqual(9+19+105+17+25);  // exclusive
          expect(pcrProduct.getLength(pcrProduct.STICKY_END_FULL)).toEqual(sequence.length);

          done();
        }).catch(done);
      });

      it('should have the correct features', function(done) {
        itShouldHaveTheCorrectFeatures(done, sequence);
      });
    });
  });
});


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
