import _ from 'underscore';
import Q from 'q';

import PrimerCalculation from '../../pcr/lib/primer_calculation';
import {getAllPrimersAndProductsHelper} from '../lib/sequencing_primers_design';
import idtMeltingTemperatureStub from '../../pcr/tests/idt_stub';
import TemporarySequenceModel from '../../../sequence/models/temporary_sequence';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';

import {stubCurrentUser} from '../../../common/tests/stubs';
import errors from '../lib/errors';


stubCurrentUser();


var checkResult = function(expectedPrimersAndProducts, calculatedPrimersAndProducts) {
  expect(calculatedPrimersAndProducts.length).toEqual(expectedPrimersAndProducts.length);

  // console.log(JSON.stringify(calculatedPrimersAndProducts,null,2))

  var fields = [
    'name', //'getSequence',
    'range.from', 'range.size', 'range.reverse',
    'primer.name', 'primer.getSequence', 'primer.meltingTemperature', 'primer.gcContent',
    'primer.range.from', 'primer.range.size', 'primer.range.reverse'
  ];

  let getValue = function(obj, field) {
    _.each(field.split('.'), function(fieldPart) {
      obj = _.result(obj, fieldPart);
    });
    return obj;
  };

  var failed = false;
  _.every(expectedPrimersAndProducts, function(expectedSerialised, i) {
    let calculatedProductAndPrimer = calculatedPrimersAndProducts[i];
    _.each(fields, function(field) {
      var calculated = getValue(calculatedProductAndPrimer, field);
      var expected = getValue(expectedSerialised, field);
      failed = failed || calculated != expected;
      if(calculated != expected) console.warn(i, field, 'calculated:', calculated, 'expected:', expected);
      expect(calculated).toEqual(expected);
    });
    // karma / jasmine / phantomjs take a long time to report all the errors so
    // we break early if we get a single error
    return true || !failed;
  });
};


var getAllPrimersAndProducts_TestFactory = function(sequenceModel, expectedPrimersAndProducts) {
  return getAllPrimersAndProductsHelper(sequenceModel)
  .then(function(calculatedPrimersAndProducts) {
    checkResult(expectedPrimersAndProducts, calculatedPrimersAndProducts);
  })
  .catch(function(e) {
    console.error(e);
    expect('Ensure tests fail on error').toEqual(false);
  });
};


var sequence863 = new TemporarySequenceModel({
  sequence: (
  'AAAAAAAAA' +
  'AAAATTTTATTGGAAGGGGAGGAGG' +  // forward primer 1
  'AAAAAAAATGATTAAAAATTTATTGGCAATTTTAGATTTAAAATCTTTAGTACTCAATGCAATAAATTAT' +
  'TGGGGTCCTAAA' +
  'AATAATAATGGCATACAGGGTGGTG' +  // reverse primer 3
  'ATTTTGGTTACCCTATATCAGAAAAACAAATAGATACGTCTATTATAACTTCTACTCATCCTCGTTTAAT' +
  'TCCACATGATTTAACAATTCCTCAAAATTTAGAAACTATTTTTACTACAACTCAAGTATTAACAAATAAT' +
  'ACAGATTTACAACAAAGTCAAACTGTTTCTTTTGCTAAAAAAACAACGACAACAACTTCAACTTCAACTA' +
  'CAAATGGTTGGACAGAAGGTGGGAAAATTTCAGATACATTAGAAGAAAAAGTAAGTGTAT' +
  'CTATTCCTTTTATTGGAGAGGGAGG' +  // forward primer 2
  'AGGAAAAAACAGTACAACTATAGAAGCTAATTTTGCACATAACTCTAGTACTACTACTTTTCAACAGGCT' +
  'TCAACTGATATAGAGTGGAATATT' +
  'TCACAACCAGTATTGGTTCCC' + 'C' +  // reverse primer 2
  'CACGTAAACAAGTTGTAGCAACATTAGTTATTATGGGAGGTAATTTTACTATTCCTATGGATTTGATGAC' +
  'TACTATAGATTCTACAGAACATTATAGTGGTTATCCAATATTAACATGGATATCGAGCCCCGATAATAGT' +
  'TATAATGGTCCATTTATGAGTTGGTATTTTGCAAATTGGCCCAATTTACCATCGGGGTTTGGTCCTTTAA' +
  'ATTCAGATAATACGGTCACTTATACAGGTTCTGTTGTAAGTCAAGTATCAGCTGGTGTATAT' +
  'GCCACTGTACGATTTGATCAATATG' +  // forward primer 3
  'ATATACACAATTTAAGGACAATTGAAAAAACTTGGTATGCACGACATGCATTAGTTATTATGGGAGGTAA' +
  'TTTTACTATTCCTATGGATTTGATGACTACT' +
  'ATAGATTTTATTGGAGAGAAGGGGG' +  // reverse primer 1
  'GAAA')
});


var expected863Primers = [
  {
    "name": "Fwd-1",
    "range": {
      "from": 9,
      "size": 500,
      "reverse": false,
    },
    "primer": {
      "name": "Fwd-1 primer",
      "range": {
        "from": 9,
        "size": 25,
        "reverse": false,
      },
      "getSequence": "AAAATTTTATTGGAAGGGGAGGAGG",
      "meltingTemperature": 63.3,
      "gcContent": 0.4,
    },
  },
  {
    "name": "Fwd-2",
    "range": {
      "from": 411,
      "size": 500,
      "reverse": false,
    },
    "primer": {
      "name": "Fwd-2 primer",
      "range": {
        "from": 411,
        "size": 25,
        "reverse": false,
      },
      "getSequence": "CTATTCCTTTTATTGGAGAGGGAGG",
      "meltingTemperature": 62.2,
      "gcContent": 0.44,
    },
  },
  {
    "name": "Fwd-3",
    "range": {
      "from": 824,
      "size": 155,
      "reverse": false,
    },
    "primer": {
      "name": "Fwd-3 primer",
      "range": {
        "from": 824,
        "size": 25,
        "reverse": false,
      },
      "getSequence": "GCCACTGTACGATTTGATCAATATG",
      "meltingTemperature": 62.1,
      "gcContent": 0.4,
    },
  },
  {
    "name": "Rvs-1",
    "range": {
      "from": 475,
      "size": 500,
      "reverse": true,
    },
    "primer": {
      "name": "Rvs-1 primer",
      "range": {
        "from": 950,
        "size": 25,
        "reverse": true,
      },
      "getSequence": "CCCCCTTCTCTCCAATAAAATCTAT",  // reverse complement of ATAGATTTTATTGGAGAGAAGGGGG
      "meltingTemperature": 62,
      "gcContent": 0.4,
    },
  },
  // {
  //   "name": "Rvs-2",
  //   "range": {
  //     "from": 52,
  //     "size": 500,
  //     "reverse": true,
  //   },
  //   "primer": {
  //     "name": "Rvs-2 primer",
  //     "range": {
  //       "from": 531,
  //       "size": 21,
  //       "reverse": true,
  //     },
  //     "getSequence": "GGGGAACCAATACTGGTTGTG",  // reverse complement of CACAACCAGTATTGGTTCCCC
  //     "meltingTemperature": 62.8,
  //     "gcContent": 0.5238095238095238,
  //   },
  // },
  {
    "name": "Rvs-2",
    "range": {
      "from": 51,
      "size": 500,
      "reverse": true,
    },
    "primer": {
      "name": "Rvs-2 primer",
      "range": {
        "from": 530,
        "size": 21,
        "reverse": true,
      },
      "getSequence": "GGGAACCAATACTGGTTGTGA",  // reverse complement of TCACAACCAGTATTGGTTCCC
      "meltingTemperature": 62.1,
      "gcContent": 0.47619047619047616,
    },
  },
  {
    "name": "Rvs-3",
    "range": {
      "from": 0,
      "size": 141,
      "reverse": true,
    },
    "primer": {
      "name": "Rvs-3 primer",
      "range": {
        "from": 116,
        "size": 25,
        "reverse": true,
      },
      "getSequence": "CACCACCCTGTATGCCATTATTATT",  // reverse complement of AATAATAATGGCATACAGGGTGGTG
      "meltingTemperature": 63.1,
      "gcContent": 0.4,
    },
  }
];


var shortSequence = new TemporarySequenceModel({
  sequence: (
  'TTATGACAACTTGACGGCTACATCATTCACTTTTTCTTCAC' +                              // 41:   0- 40  (41)
  'TGCCACCTGACGTCTAAGAA' +  // forward universal primer v1                   // 20:  41- 60  (61)
  'AACCGGCACTAACTACGGCTACACTAGAAGGACAGTATTTGGTATCTGCGCTCTGCTG' +             // 58:  61-118  (119)
  'AAGCCAGTTACCTTCGGAAAA' + 'AGAGTTGGTAGCTCTTGATCCGGCAAACAAACCACCGCTGGTAGCGGTG' + // 70: 119-188  (189)
  'GTTTTTTTGTTTGCAAGCAGCAGATTACGCGCAGAAAAAAAGGATCTCAAGAAGATCCTTTGATCTTTTC' + // 70: 189-258  (259)
  'TACGGGGTCTGACGCTCAGTGGAACGAAAACTCACGTTAAGGGATTTTGGTCATGAGATTATCAAAAAGG' + // 70: 259-328  (329)
  'ATCTTCACCTAGATCCTTTTAAATTAAAAATGAAGTTTTAAATCAATCTAAAGTATATATGAGTAAACTT' + // 70: 329-398  (399)
  'GGTCTGACAGCTCGAGGCTTGGATTCTCACCAATAAAAAACGCCCGGCGGCAACCGAGCGTTCTGAACAA' + // 70: 399-468  (469)
  'ATCCAGATGGAGTTCTGAGGTCATTACTGGATCTATCAACAGGAGTCCAAGCGAGCTCGATATCAAATTA' + // 70: 469-538  (539)
  'GATCACTACCGGGCGTATT' +  // reverse universal primer v1                    // 19: 539-557  (558)
  'CG')                                                                      //  2: 558-559  (560)
});


var expectedShortSequencePrimers = [
  {
    "name": "Fwd Anchor",
    "range": {
      "from": 41,
      "size": 500,
      "reverse": false,
    },
    "primer": {
      "name": "Fwd Anchor primer",
      "range": {
        "from": 41,
        "size": 20,
        "reverse": false,
      },
      "getSequence": "TGCCACCTGACGTCTAAGAA",
      "meltingTemperature": 63,
      "gcContent": 0.5,
    },
  },
  {
    "name": "Rvs Cap",
    "range": {
      "from": 58,
      "size": 500,
      "reverse": true,
    },
    "primer": {
      "name": "Rvs Cap primer",
      "range": {
        "from": 539,
        "size": 19,
        "reverse": true,
      },
      "getSequence": "AATACGCCCGGTAGTGATC",  // reverse complement of GATCACTACCGGGCGTATT
      "meltingTemperature": 61,
      "gcContent": 0.526,
    },
  },
  {
    "name": "Rvs-2",
    "range": {
      "from": 0,
      "size": 140,
      "reverse": true,
    },
    "primer": {
      "name": "Rvs-2 primer",
      "range": {
        "from": 119,
        "size": 21,
        "reverse": true,
      },
      "getSequence": "TTTTCCGAAGGTAACTGGCTT",  // reverse complement of AAGCCAGTTACCTTCGGAAAA
      "meltingTemperature": 62.2,
      "gcContent": 0.42857142857142855,
    },
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

  var onlyContainingReverseUniversalPrimer = function(numberOfSpacerBases) {
    var spacerBases = _.times(numberOfSpacerBases, () => 'A').join('');
    return 'GATCACTACCGGGCGTATT' + 'AAAA' + spacerBases + 'GATCACTACCGGGCGTATT';
  };

  it('expect notice of warning to find forwardUniversal primer', function(done) {
    let garbageLength = defaultSequencingPrimerOptions().garbageSequenceDna;
    let sequenceModel = new TemporarySequenceModel({
      sequence: onlyContainingReverseUniversalPrimer(garbageLength)
    });
    var deferredProducts = Q.defer();
    var deferredNotification = Q.defer();

    getAllPrimersAndProductsHelper(sequenceModel)
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
      expect(calculatedProductsAndPrimers[0].primer.getSequence()).toEqual('GATCACTACCGGGCGTATTAAAA');
      expect(calculatedProductsAndPrimers[1].primer.getSequence()).toEqual('AATACGCCCGGTAGTGATC');
      expect(notification.level).toEqual('warn');
      expect(notification.error).toEqual(errors.UNIVERSAL_FORWARD_PRIMER_NOT_FOUND);
      done();
    });
  });

  it('expect error when primers found but result in some DNA being left unsequenced', function(done) {
    let garbageLength = defaultSequencingPrimerOptions().garbageSequenceDna;
    let sequenceModel = new TemporarySequenceModel({
      sequence: onlyContainingReverseUniversalPrimer(garbageLength - 1)
    });

    getAllPrimersAndProductsHelper(sequenceModel)
    .then(function(val) {
      // We should never get here.
      console.error("ERROR : ", val);
      expect(val).toBeUndefined();
    })
    .catch(function(val) {
      expect(val.error).toEqual(errors.DNA_LEFT_UNSEQUENCED);
      expect(val.data.overlappingSequencedBases).toEqual(-1);
      expect(val.data.sequencingProductsAndPrimers.length).toEqual(2);
      done();
    })
    .done();
  });

  it('finally: teardown', function(done) {
    PrimerCalculation.restoreIDTMeltingTemperature();
    done();
  });
});
