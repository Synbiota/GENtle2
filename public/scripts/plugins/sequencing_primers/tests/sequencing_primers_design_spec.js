import _ from 'underscore';
import Q from 'q';

import PrimerCalculation from '../../pcr/lib/primer_calculation';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';
import {getAllPrimersAndProductsHelper} from '../lib/sequencing_primers_design';
import Primer from '../../pcr/lib/primer';

import idtMeltingTemperatureStub from '../../pcr/tests/idt_stub';
import {universalPrimers, findPrimers} from '../lib/universal_primers';
import {sequence863, sequenceFromMike} from './test_sequences';
import {expected863Primers, expectedMikeForwardPrimers} from './test_expected_primers';


var checkResult = function(expectedPrimersAndProducts, calculatedPrimersAndProducts) {
  expect(calculatedPrimersAndProducts.length).toEqual(expectedPrimersAndProducts.length);

  var productFields = ['from', 'to', 'name'];
  var primerFields = ['from', 'to', 'name', 'sequence', 'meltingTemperature', 'gcContent'];
  var failed = false;

  _.every(calculatedPrimersAndProducts, function(calculatedProductAndPrimer, i) {
    _.each(productFields, function(productField) {
      var calculated = calculatedProductAndPrimer[productField];
      var expected = expectedPrimersAndProducts[i][productField];
      expect(calculated).toEqual(expected);
      failed = failed || calculated != expected;
    });
    _.each(primerFields, function(primerField) {
      var calculated = calculatedProductAndPrimer.primer[primerField];
      var expected = expectedPrimersAndProducts[i].primer[primerField];
      expect(calculated).toEqual(expected);
      failed = failed || calculated != expected;
    });
    // karma / jasmine / phantomjs take a long time to report all the errors so
    // we break early if we get a single error
    return !failed;
  });
};


var getAllPrimersAndProducts_TestFactory = function(sequence, options, expectedPrimersAndProducts) {
  var val = getAllPrimersAndProductsHelper(sequence, options);

  expect(val.error).toBeUndefined();
  if(val.error) return Q.reject(val.error);

  return val.promise
  .then(function(calculatedPrimersAndProducts) {
    // console.log(`getAllPrimersAndProducts returned '${calculatedPrimersAndProducts.length}' results:`, JSON.stringify(calculatedPrimersAndProducts,null,2));
    checkResult(expectedPrimersAndProducts, calculatedPrimersAndProducts);
  }).catch(function(e) {
    console.error(e);
    expect('Ensure tests fail on error').toEqual(false);
  });
};


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


var expectedShortSequencePrimers = [
  {
    "name": "Product 1 (forward)",
    "from": 41,
    "to": 41+500-1,
    "primer": {
      "name": "Product 1 (forward) - primer",
      "sequence": "TGCCACCTGACGTCTAAGAA",
      "from": 41,
      "to": 60,
      "meltingTemperature": 63,
      "gcContent": 0.5,
      "antisense": false,
    },
    "antisense": false,
  },
  {
    "name": "Product 2 (forward)",
    "from": 457,
    "to": 559,
    "primer": {
      "name": "Product 2 (forward) - primer",
      "sequence": "CGTTCTGAACAAATCCAGATGGA",
      "from": 457,
      "to": 479,
      "meltingTemperature": 62.8,
      "gcContent": 0.43478260869565216,
      "antisense": false,
    },
    "antisense": false,
  },
  {
    "name":"Product 1 (reverse)",
    "from": 557,
    "to": 557-500,
    "primer": {
      "name":"Product 1 (reverse) - primer",
      "from": 557,
      "to": 539-1,
      "sequence": "AATACGCCCGGTAGTGATC",  // reverse compliment of:  GATCACTACCGGGCGTATT
      "meltingTemperature": 61,
      "gcContent": 0.526,
    },
  },
  {
    "name":"Product 2 (reverse)",
    "from": 144,
    "to": 0-1,
    "primer": {
      "name":"Product 2 (reverse) - primer",
      "from": 144,
      "to": 119,
      "sequence": "CTAATTTGATATCGAGCTCGCTTGG",  // reverse compliment of:  CCAAGCGAGCTCGATATCAAATTAG
      "meltingTemperature": 63.4,
      "gcContent": 0.44,
    },
  }
];



describe('finding Sequencing Primers', function() {
  beforeEach(function(done) {
    PrimerCalculation.stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
    done();
  });

  // it('find primers for sequence863', function(done) {
  //   var testSequence863 = getAllPrimersAndProducts_TestFactory(sequence863,
  //   defaultSequencingPrimerOptions(), expected863Primers);

  //   testSequence863.then(done).done();
  // });

  it('find forward primers for sequence from Mike', function(done) {
    getAllPrimersAndProducts_TestFactory(
      shortSequence,
      defaultSequencingPrimerOptions(),
      expectedShortSequencePrimers
    )
    .then(done);
  });

  // it('find reverse primers for sequence from Mike', function(done) {
  //   var {reverseSequencePrimer} = findPrimers(sequenceFromMike, universalPrimers());
  //   var options = defaultSequencingPrimerOptions();
  //
  //   getAllPrimersAndProducts_TestFactory(
  //     sequenceFromMike,
  //     options,
  //     reverseSequencePrimer,
  //     expectedMikeReversePrimers
  //   )
  //   .then(done);
  // });

  it('finally: teardown', function(done) {
    PrimerCalculation.restoreIDTMeltingTemperature();
    done();
  });
});
