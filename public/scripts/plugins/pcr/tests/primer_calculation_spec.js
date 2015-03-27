import idtMeltingTemperatureStub from './idt_stub';
import {stubOutIDTMeltingTemperature, restoreIDTMeltingTemperature} from '../lib/primer_calculation';
import {defaultSequencingPrimerOptions, defaultPCRPrimerOptions} from '../lib/primer_defaults';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import {optimalPrimer4} from '../lib/primer_calculation';


var setup;
var bothEndsSequence;
var sequence1;
var sequence1Reversed;
var sequence2;
var sequence2Reversed;
var polyASequence;

var micro = 1e-6;


var checkResult = function(primer, expectations={}) {
  expectations = _.defaults(expectations, {
    gcContentGreaterThan: 0.3,
    gcContentLessThan: 0.7,
    minimumMeltingTemperature: 62,
    maximumMeltingTemperature: 65,
    optimal: true,
  });
  // console.log(`Testing with primer:`, primer);
  expect(primer.meltingTemperature).toBeGreaterThan(expectations.minimumMeltingTemperature - micro);
  expect(primer.meltingTemperature).toBeLessThan(expectations.maximumMeltingTemperature + micro);
  expect(primer.gcContent).toBeGreaterThan(expectations.gcContentGreaterThan - micro);
  expect(primer.gcContent).toBeLessThan(expectations.gcContentLessThan + micro);
  expect(primer.optimal).toEqual(expectations.optimal);

  var fieldsToCheck = [
    ['expectedSequence', 'sequence'],
    ['expectedFrom', 'from'],
    ['expectedTo', 'to'],
  ];
  _.each(fieldsToCheck, function(fieldPair) {
    var expectation = expectations[fieldPair[0]];
    var field = fieldPair[1];
    var actual = primer[field];
    if(expectation) {
      expect(actual).toEqual(expectation);
    }
  });
};


var optimalPrimer4_TestFactory = function(done, sequence, expectations, options={}) {
  // console.log(`Set up optimalPrimer4 test`);
  optimalPrimer4(sequence, options)
  .then(function(primer) {
    // console.log(`Got optimalPrimer4 results, primer:`, primer);
    checkResult(primer, expectations);
  })
  .finally(done).done();
};


describe('finding optimal primers', function() {
  beforeEach(function(done) {
    if(!setup) {
      setup = true;
      bothEndsSequence = 'ATTGATTACGTACAGCACGTATGG' + 'AAAAAA' + 'GTGTATCTATTCCTTTTATTGGAGAGGGAG';
      sequence1 = 'AAAAAAATGATTTTTTTGGCAATTTTAGATTTAAAATCTTTAGTACTCAATGCAATAAATTATTGGGGTCCTAAAAATAATAATGGCATACAGGGTGGTGATTTTGGTTACCCTATATCAGAAAAACAAATAGATACGTCTATTATAACTTCTACTCATCCTCGTTTAATTCCACATGATTTAACAATTCCTCAAAATTTAGAAACTATTTTTACTACAACTCAAGTATTAACAAATAATACAGATTTACAACAAAGTCAAACTGTTTCTTTTGCTAAAAAAACAACGACAACAACTTCAACTTCAACTACAAATGGTTGGACAGAAGGTGGGAAAATTTCAGATACATTAGAAGAAAAAGTAAGTGTATCTATTCCTTTTATTGGAGAGGGAGGAGGAAAAAACAGTACAACTATAGAAGCTAATTTTGCACATAACTCTAGT';
      sequence1Reversed = SequenceTransforms.toReverseComplements(sequence1);
      sequence2 = 'ATAGAAGCTAATTTTGCACATAACTCTAGTACTACTACTTTTCAACAGGCTTCAACTGATATAGAGTGGAATATTTCACAACCAGTATTGGTTCCCCCACGTAAACAAGTTGTAGCAACATTAGTTATTATGGGAGGTAATTTTACTATTCCTATGGATTTGATGACTACTATAGATTCTACAGAACATTATAGTGGTTATCCAATATTAACATGGATATCGAGCCCCGATAATAGTTATAATGGTCCATTTATGAGTTGGTATTTTGCAAATTGGCCCAATTTACCATCGGGGTTTGGTCCTTTAAATTCAGATAATACGGTCACTTATACAGGTTCTGTTGTAAGTCAAGTATCAGCTGGTGTATATGCCACTGTACGATTTGATCAATATGATATACACAATTTAAGGACAATTGAAAAAACTTGGTATGCACGACATGC';
      sequence2Reversed = SequenceTransforms.toReverseComplements(sequence2);
      polyASequence = 'GAAAGAAGAAGAAGAAGAAGAAGAAGAAAAAAA';

      stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
    }
    done();
  });

  /*********************
   * Sequencing primer
   *********************/
  it('should find sequencing primer for bothEndsSequence', function(done) {
    optimalPrimer4_TestFactory(done, bothEndsSequence,
      {expectedSequence: 'ATTGATTACGTACAGCACGTATGG', expectedFrom: 0, expectedTo: 23},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: false})
    );
  });

  it('optimalPrimer4 for Sequencing primer with bothEndsSequence', function(done) {
    optimalPrimer4_TestFactory(done, bothEndsSequence,
      {expectedSequence: 'GTGTATCTATTCCTTTTATTGGAGAGGGAG', expectedFrom: 30, expectedTo: 59},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: true})
    );
  });

  it('optimalPrimer4 for Sequencing primer with sequence1', function(done) {
    optimalPrimer4_TestFactory(done, sequence1,
      {expectedSequence: 'AATAATAATGGCATACAGGGTGGTG'},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: false})
    );
  });

  it('optimalPrimer4 for Sequencing primer with sequence1', function(done) {
    optimalPrimer4_TestFactory(done, sequence1,
      {expectedSequence: 'TATCTATTCCTTTTATTGGAGAGGGAGGAG'},
      defaultSequencingPrimerOptions()
    );
  });

  it('optimalPrimer4 for Sequencing primer with sequence2', function(done) {
    optimalPrimer4_TestFactory(done, sequence2,
      {expectedSequence: 'CTCTAGTACTACTACTTTTCAACAGGC'},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: false})
    );
  });

  it('optimalPrimer4 for Sequencing primer with sequence2', function(done) {
    optimalPrimer4_TestFactory(done, sequence2,
      {expectedSequence: 'ACTTGGTATGCACGACATGC'},
      defaultSequencingPrimerOptions()
    );
  });

  /**************
   * PCR primers
   **************/
  it('optimalPrimer4 for PCR primer with sequence1 so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)', function(done) {
    optimalPrimer4_TestFactory(done, sequence1,
      {
        expectedSequence: 'AAAAAAATGATTTTTTTGGCAATTTTAG',
        gcContentGreaterThan: 0.1,
        minimumMeltingTemperature: 59.5,
        maximumMeltingTemperature: 60.5,
        optimal: false,
      },
      defaultPCRPrimerOptions()
    );
  });

  it('optimalPrimer4 for PCR primer with sequence1Reversed so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)', function(done) {
    optimalPrimer4_TestFactory(done, sequence1Reversed,
      {
        expectedSequence: 'ACTAGAGTTATGTGCAAAATTAGC',
        gcContentGreaterThan: 0.33,
        minimumMeltingTemperature: 59.6,
        maximumMeltingTemperature: 59.8,
        optimal: false,
      },
      defaultPCRPrimerOptions()
    );
  });

  it('optimalPrimer4 for PCR primer with sequence2 so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)', function(done) {
    optimalPrimer4_TestFactory(done, sequence2,
      {
        expectedSequence: 'ATAGAAGCTAATTTTGCACATAACT',
        gcContentGreaterThan: 0.28,
        minimumMeltingTemperature: 59.8,
        maximumMeltingTemperature: 60,
        optimal: false,
      },
      defaultPCRPrimerOptions()
    );
  });

  it('optimalPrimer4 for PCR primer with sequence2Reversed so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)', function(done) {
    optimalPrimer4_TestFactory(done, sequence2Reversed,
      {
        expectedSequence: 'GCATGTCGTGCATACCAAGT',
        gcContentGreaterThan: 0.49,
        minimumMeltingTemperature: 62.8,
        maximumMeltingTemperature: 63,
        optimal: false,
      },
      defaultPCRPrimerOptions()
    );
  });

  it('optimalPrimer4 for PCR primer with polyASequence so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)', function(done) {
    optimalPrimer4_TestFactory(done, polyASequence,
      {
        expectedSequence: 'GAAAGAAGAAGAAGAAGAAGAAGAAG',
        gcContentGreaterThan: 0.34,
        minimumMeltingTemperature: 60,
        maximumMeltingTemperature: 60.2,
        optimal: false,
      },
      defaultPCRPrimerOptions()
    );
  });

  it('Test ignoring `from` and `to` parameters', function(done) {
    optimalPrimer4_TestFactory(done, 'ATACGTCGCGCAGCTCAAGCCGCTGATTCCGGCGCAATAT',
      {
        expectedSequence: 'ATACGTCGCGCAGCTCA',
        gcContentGreaterThan: 0.34,
        minimumMeltingTemperature: 63.4,
        maximumMeltingTemperature: 63.6,
        optimal: true,
      },
      {
        "from":9,  // should be ignored.
        "to":149,  // should be ignored.
        "name":"vioA",
        "targetMeltingTemperature":65,
        "stickyEnds":{
          "name":"X-Z'",
          "startName":"X",
          "endName":"Z'",
          "start":"CCTGCAGTCAGTGGTCTCTAGAG",
          "end":"GAGATGAGACCGTCAGTCACGAG",
          "startOffset":19,
          "endOffset":-19
        },
        "minPrimerLength":10,
        "maxPrimerLength":40,
        "meltingTemperatureTolerance":1.5,
        "targetGcContent":0.5,
        "useIDT":true,
        "returnNearestIfNotBest":true,
        "allowShift":false,
        "findFrom3PrimeEnd":false,
        "maxPolyN":3,
        "targetGcContentTolerance":0.1,
        "IDTmeltingTemperatureProximity":0.5
      }
    );
  });

  it('teardown', function() {
    restoreIDTMeltingTemperature();
  });
});

