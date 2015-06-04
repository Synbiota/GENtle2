import _ from 'underscore';
import Q from 'q';

import PrimerCalculation from '../../pcr/lib/primer_calculation';
import {getAllPrimersAndProductsHelper, GARBAGE_SEQUENCE_DNA} from '../lib/sequencing_primers_design';
import idtMeltingTemperatureStub from '../../pcr/tests/idt_stub';

import errors from '../lib/errors';


var checkResult = function(expectedPrimersAndProducts, calculatedPrimersAndProducts) {
  expect(calculatedPrimersAndProducts.length).toEqual(expectedPrimersAndProducts.length);

  var productFields = ['from', 'to', 'name'];
  var primerFields = ['from', 'to', 'name', 'sequence', 'meltingTemperature', 'gcContent'];
  var failed = false;

  // console.log(JSON.stringify(calculatedPrimersAndProducts,null,2))

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


var getAllPrimersAndProducts_TestFactory = function(sequenceBases, expectedPrimersAndProducts) {
  return getAllPrimersAndProductsHelper(sequenceBases)
  .then(function(calculatedPrimersAndProducts) {
    checkResult(expectedPrimersAndProducts, calculatedPrimersAndProducts);
  })
  .catch(function(e) {
    console.error(e);
    expect('Ensure tests fail on error').toEqual(false);
  });
};


var sequence863 = ('AAAAAAATGATTAAAAATTTATTGGCAATTTTAGATTTAAAATCTTTAG' +
  'TACTCAATGCAATAAATTATTGGGGTCCTAAA' +
  'AATAATAATGGCATACAGGGTGGTG' +  // reverse primer 2
  'ATTTTGGTTACCC' +
  'TATATCAGAAAAACAAATAGATACGTCTATTATAACTTCTACTCATCCTCGTTTAATTCCACATGATTTA' +
  'ACAATTCCTCAAAATTTAGAAACTATTTTTACTACAACTCAAGTATTAACAAATAATACAGATTTACAAC' +
  'AAAGTCAAACTGTTTCTTTTGCTAAAAAAACAACGACAACAACTTCAACTTCAACTACAAATGGTTGGAC' +
  'AGAAGGTGGGAAAATTTCAGATACATTAGAAGAAAAAGTAAGTGTATCTATTCC' +
  'TTTTATTGGAGAGGGAGGAGGA' +  // forward primer 1
  'AAAAACAGTACAACTATAGAAGCTAATTTTGCACATAACTCTAGTACTACTACTTTTCAACAGG' +
  'CTTCAACTGATATAGAGTGGAATATTTCACA' +
  'ACCAGTATTGGTTCCCCCAC' +  // reverse primer 1
  'GTAAACAAGTTGTAGCAAC' +
  'ATTAGTTATTATGGGAGGTAATTTTACTATTCCTATGGATTTGATGACTACTATAGATTCTACAGAACAT' +
  'TATAGTGGTTATCCAATATTAACATGGATATCGAGCCCCGATAATAGTTATAATGGTCCATTTATGAGTT' +
  'GGTATTTTGCAAATTGGCCCAATTTACCATCGGGGTTTGGTCCTTTAAATTCAGATAATACGGTCACTTA' +
  'TACAGGTTCTGTTGTAAGTCAAGTATCAGCTGGTGTATAT' +
  'GCCACTGTACGATTTGATCAATATG' +  // forward primer 2
  'ATATACACAATTTAAGGACAATTGAAAAAACTT' +
  'GGTATGCACGACATGCATTAGTTA' + // primer 3
  'TTATGGGAGGTAATTTTACTATTCCTATGGATTTGATGACTACTATAGA'
);


var expected863Primers = [
{
    "name": "Fwd-1",
    "from": 81,
    "to": 580,
    "primer": {
      "name": "Fwd-1 primer",
      "sequence": "AATAATAATGGCATACAGGGTGGTG",
      "from": 81,
      "to": 105,
      "meltingTemperature": 63.1,
      "gcContent": 0.4,
      "antisense": false
    },
    "antisense": false
  },
  {
    "name": "Fwd-2",
    "from": 506,
    "to": 919,
    "primer": {
      "name": "Fwd-2 primer",
      "sequence": "ATTGGTTCCCCCACGTAAAC",
      "from": 506,
      "to": 525,
      "meltingTemperature": 62.4,
      "gcContent": 0.5,
      "antisense": false
    },
    "antisense": false
  },
  {
    "name": "Rvs-1",
    "from": 519,
    "to": 19,
    "primer": {
      "name": "Rvs-1 primer",
      "sequence": "GTGGGGGAACCAATACTGGT",  // ACCAGTATTGGTTCCCCCAC
      "from": 519,
      "to": 499,
      "meltingTemperature": 63.7,
      "gcContent": 0.55,
      "antisense": true
    },
    "antisense": true
  },
  {
    "name": "Rvs-2",
    "from": 103,
    "to": -1,
    "primer": {
      "name": "Rvs-2 primer",
      "sequence": "CACCACCCTGTATGCCATTATTATT",  // AATAATAATGGCATACAGGGTGGTG
      "from": 103,
      "to": 78,
      "meltingTemperature": 63.1,
      "gcContent": 0.4,
      "antisense": true
    },
    "antisense": true
  }
];


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
    "name": "U-fwd",
    "from": 41,
    "to": 41+500-1,
    "primer": {
      "name": "U-fwd primer",
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
    "name": "Fwd-1",
    "from": 457,
    "to": 559,
    "primer": {
      "name": "Fwd-1 primer",
      "sequence": "CGTTCTGAACAAATCCAGATGGAG",
      "from": 457,
      "to": 480,
      "meltingTemperature": 63.3,
      "gcContent": 0.4583333333333333,
      "antisense": false,
    },
    "antisense": false,
  },
  {
    "name":"U-rvs",
    "from": 557,
    "to": 557-500,
    "primer": {
      "name":"U-rvs primer",
      "from": 557,
      "to": 539-1,
      "sequence": "AATACGCCCGGTAGTGATC",  // reverse compliment of: GATCACTACCGGGCGTATT
      "meltingTemperature": 61,
      "gcContent": 0.526,
    },
    "antisense": true,
  },
  {
    "name":"Rvs-2",
    "from": 139,
    "to": 0-1,
    "primer": {
      "name":"Rvs-2 primer",
      "from": 139,
      "to": 119-1,
      "sequence": "TTTTCCGAAGGTAACTGGCTT",  // reverse compliment of: AAGCCAGTTACCTTCGGAAAA
      "meltingTemperature": 62.2,
      "gcContent": 0.42857142857142855,
    },
    "antisense": true,
  }
];


describe('finding Sequencing Primers', function() {
  beforeEach(function(done) {
    PrimerCalculation.stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
    done();
  });

  it('find primers for sequence863', function(done) {
    getAllPrimersAndProducts_TestFactory(sequence863, expected863Primers)
    .then(done)
    .done();
  });

  it('find forward primers for sequence from Mike', function(done) {
    getAllPrimersAndProducts_TestFactory(shortSequence, expectedShortSequencePrimers)
    .then(done)
    .done();
  });

  it('expect notice of warning to find forwardUniversal primer', function(done) {
    var spacerBases = _.times(GARBAGE_SEQUENCE_DNA, () => 'A').join('');
    var onlyContainingReverseUniversalPrimer = 'GATCACTACCGGGCGTATT' + 'AAA' + spacerBases + 'GATCACTACCGGGCGTATT';
    var deferredProducts = Q.defer();
    var deferredNotification = Q.defer();

    getAllPrimersAndProductsHelper(onlyContainingReverseUniversalPrimer)
    .then(function(val) {
      // console.log('then...', val)
      deferredProducts.resolve(val);
    })
    .catch(function(val) {
      // We should never get here.
      console.error("ERROR : ", val);
      expect(val).toBeUndefined();
      done();
    })
    .progress(function(val) {
      // console.log('progress...', val)
      deferredNotification.resolve(val);
    })
    .done();

    Q.all([deferredProducts.promise, deferredNotification.promise])
    .then(function(args) {
      var [calculatedProductsAndPrimers, notification] = args;
      expect(calculatedProductsAndPrimers.length).toEqual(2);
      expect(calculatedProductsAndPrimers[0].primer.sequence).toEqual('GATCACTACCGGGCGTATTAAAA');
      expect(calculatedProductsAndPrimers[1].primer.sequence).toEqual('AATACGCCCGGTAGTGATC');
      expect(notification.level).toEqual('warn');
      expect(notification.error).toEqual(errors.UNIVERSAL_FORWARD_PRIMER_NOT_FOUND);
      done();
    });

  });

  it('finally: teardown', function(done) {
    PrimerCalculation.restoreIDTMeltingTemperature();
    done();
  });
});
