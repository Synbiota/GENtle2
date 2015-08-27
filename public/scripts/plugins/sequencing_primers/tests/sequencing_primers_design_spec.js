/* eslint-env jasmine */
import _ from 'underscore';
import Q from 'q';

import {getAllPrimersAndProductsHelper} from '../lib/sequencing_primers_design';
import idtMeltingTemperatureStub from '../../pcr/tests/idt_stub';
import TemporarySequenceModel from '../../../sequence/models/temporary_sequence';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';

import {stubCurrentUser} from '../../../common/tests/stubs';
import errors from '../lib/errors';

import {stubOutIDTMeltingTemperature, restoreIDTMeltingTemperature} from '../../pcr/lib/primer_calculation';

var checkResult = function(expectedPrimersAndProducts, calculatedPrimersAndProducts) {
  expect(calculatedPrimersAndProducts.length).toEqual(expectedPrimersAndProducts.length);

  // console.log('calculatedPrimersAndProducts: ', JSON.stringify(calculatedPrimersAndProducts,null,2))

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


var getAllPrimersAndProducts_TestFactory = function(sequenceModel, expectedPrimersAndProducts, done) {
  return getAllPrimersAndProductsHelper(sequenceModel)
  .then(function(calculatedPrimersAndProducts) {
    checkResult(expectedPrimersAndProducts, calculatedPrimersAndProducts);
  })
  .catch(function(e) {
    console.error(e);
    expect(e.toString()).toEqual(false);
  })
  .finally(function() {
    done();
  })
  .done();
};

var sequence863;
var sequence863Bases = (
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
  'GAAA'
);


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


var forwardUniversalPrimerV1 = 'TGCCACCTGACGTCTAAGAA';
var reverseUniversalPrimerV1 = 'GATCACTACCGGGCGTATT';
// reverse complement
var reverseUniversalPrimerV1RevComp = 'AATACGCCCGGTAGTGATC';

var shortSequence;
var shortSequenceBases = (
  'TTATGACAACTTGACGGCTACATCATTCACTTTTTCTTCAC' +                              // 41:   0- 40  (41)
  forwardUniversalPrimerV1 +                                                 // 20:  41- 60  (61)
  'AACCGGCACTAACTACGGCTACACTAGAAGGACAGTATTTGGTATCTGCGCTCTGCTG' +             // 58:  61-118  (119)
  'AAGCCAGTTACCTTCGGAAAA' + 'AGAGTTGGTAGCTCTTGATCCGGCAAACAAACCACCGCTGGTAGCGGTG' + // 70: 119-188  (189)
  'GTTTTTTTGTTTGCAAGCAGCAGATTACGCGCAGAAAAAAAGGATCTCAAGAAGATCCTTTGATCTTTTC' + // 70: 189-258  (259)
  'TACGGGGTCTGACGCTCAGTGGAACGAAAACTCACGTTAAGGGATTTTGGTCATGAGATTATCAAAAAGG' + // 70: 259-328  (329)
  'ATCTTCACCTAGATCCTTTTAAATTAAAAATGAAGTTTTAAATCAATCTAAAGTATATATGAGTAAACTT' + // 70: 329-398  (399)
  'GGTCTGACAGCTCGAGGCTTGGATTCTCACCAATAAAAAACGCCCGGCGGCAACCGAGCGTTCTGAACAA' + // 70: 399-468  (469)
  'ATCCAGATGGAGTTCTGAGGTCATTACTGGATCTATCAACAGGAGTCCAAGCGAGCTCGATATCAAATTA' + // 70: 469-538  (539)
  reverseUniversalPrimerV1 +                                                 // 19: 539-557  (558)
  'CG'                                                                       //  2: 558-559  (560)
);


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
      "getSequence": reverseUniversalPrimerV1RevComp,
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
  var garbageLength = defaultSequencingPrimerOptions().garbageSequenceDna;
  var spacerBases = function(numberOfSpacerBases) {
    return _.times(numberOfSpacerBases, () => 'A').join('');
  };

  beforeAll(function() {
    stubCurrentUser();
    stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
    sequence863 = new TemporarySequenceModel({sequence: sequence863Bases});
    shortSequence = new TemporarySequenceModel({sequence: shortSequenceBases});
  });

  afterAll(function(done) {
    restoreIDTMeltingTemperature();
    done();
  });

  var originalTimeout;
  beforeEach(function(done) {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    done();
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('find primers for sequence863', function(done) {
    getAllPrimersAndProducts_TestFactory(sequence863, expected863Primers, done);
  });

  it('find forward primers for sequence from Mike', function(done) {
    getAllPrimersAndProducts_TestFactory(shortSequence, expectedShortSequencePrimers, done);
  });

  describe('check for universal primers', function() {
    beforeEach(function(done) {
      done();
    });

    var findPrimersAndGetNotification = function(sequence, done) {
      let sequenceModel = new TemporarySequenceModel({sequence});
      var deferredProducts = Q.defer();
      var deferredNotification = Q.defer();

      getAllPrimersAndProductsHelper(sequenceModel)
      .then(function(val) {
        // console. log ('then...', val)
        deferredProducts.resolve(val);
      })
      .catch(function(val) {
        // We should never get here.
        console.error("ERROR : ", val.toString());
        expect(val).toBeUndefined();
        done();
      })
      .progress(function(val) {
        // console. log ('progress...', val)
        deferredNotification.resolve(val);
      })
      .done();

      return Q.all([deferredProducts.promise, deferredNotification.promise]);
    };

    it('expect notice of warning to find forwardUniversal primer', function(done) {
      var sequence = 'TAACGATACTCCGTGACGGA' + spacerBases(garbageLength) + reverseUniversalPrimerV1;
      findPrimersAndGetNotification(sequence, done)
      .then(function(args) {
        var [calculatedProductsAndPrimers, notification] = args;
        expect(calculatedProductsAndPrimers.length).toEqual(2);
        expect(calculatedProductsAndPrimers[0].primer.getSequence()).toEqual('TAACGATACTCCGTGACGGA');
        expect(calculatedProductsAndPrimers[1].primer.getSequence()).toEqual(reverseUniversalPrimerV1RevComp);
        expect(notification.data.level).toEqual('warn');
        expect(notification instanceof errors.UniversalForwardPrimerNotFound).toEqual(true);
        done();
      });
    });

    it('expect notice of warning to find reverseUniversal primer', function(done) {
      var sequence = forwardUniversalPrimerV1 + spacerBases(garbageLength) + 'AAATAACGATACTCCGTGACGG';
      findPrimersAndGetNotification(sequence, done)
      .then(function(args) {
        var [calculatedProductsAndPrimers, notification] = args;
        expect(calculatedProductsAndPrimers.length).toEqual(2);
        expect(calculatedProductsAndPrimers[0].primer.getSequence()).toEqual(forwardUniversalPrimerV1);
        expect(calculatedProductsAndPrimers[1].primer.getSequence()).toEqual('CCGTCACGGAGTATCGTTATTT');
        expect(notification.data.level).toEqual('warn');
        expect(notification instanceof errors.UniversalReversePrimerNotFound).toEqual(true);
        done();
      });
    });
  });


  describe('erroring', function(){
    /*
     * Different scenarios:
     * Note: You can distinguish scenarios 2&3 and 1&5 from each other by using
     * the presence of a `error.data.notifications.universalForwardPrimerNotFound`
     * error.  This has error.data.level set to 'warn' and is sent to progress.
     *
     * Sequencing an RDP part:
     * 1. Long stretch of sequence is highly repetitive / AT rich so no sequencing
     *     primers are available for this part.
     * 2. Sequence is too short so there is a stretch of DNA left unsequenced.
     *
     * Not sequencing an RDP part:
     * 3. The first forward and reverse primers are too close to each other so
     *     there is a stretch of DNA left unsequenced.
     * 4. Sequence is too short (less than minimum primer)
     * 5. Failure to find a single primer.  This leaves the whole sequence
     *     unsequenced.
     */
    beforeEach(function(done) {
      done();
    });

    it('scenario 1: should error when primer(s) for middle are not found.', function(done) {
      var sequenceModel = new TemporarySequenceModel({
        sequence: forwardUniversalPrimerV1 + spacerBases(1000) + reverseUniversalPrimerV1
      });

      getAllPrimersAndProductsHelper(sequenceModel)
      .then(function(val) {
        // We should never get here.
        console.error("ERROR : ", val);
        expect(val).toBeUndefined();
      })
      .progress(function(val) {
        // We should never get here.
        console.error("ERROR : ", val);
        expect(val).toBeUndefined();
      })
      .catch(function(error) {
        expect(error instanceof errors.NoPrimer).toEqual(true);
        expect(error.data.returnNearestIfNotBest).toEqual(false);

        expect(error.data.notifications.universalForwardPrimerNotFound).toEqual(undefined);
        expect(error.data.notifications.universalReversePrimerNotFound).toEqual(undefined);
        done();
      })
      .done();
    });

    it('Scenario 5: should error when no single primer is found', function(done) {
      var sequenceModel = new TemporarySequenceModel({sequence: spacerBases(1000)});
      var dNoForwardUniversalPrimerWarning = Q.defer();
      var dNoReverseUniversalPrimerWarning = Q.defer();
      var dError = Q.defer();

      getAllPrimersAndProductsHelper(sequenceModel)
      .then(function(val) {
        // We should never get here.
        console.error("ERROR : ", val);
        expect(val).toBeUndefined();
      })
      .progress(function(val) {
        if(dNoForwardUniversalPrimerWarning.promise.isFulfilled()) {
          dNoReverseUniversalPrimerWarning.resolve(val);
        } else {
          dNoForwardUniversalPrimerWarning.resolve(val);
        }
      })
      .catch(function(val) {
        dError.resolve(val);
      })
      .done();

      Q.all([dNoForwardUniversalPrimerWarning.promise, dNoReverseUniversalPrimerWarning.promise, dError.promise])
      .then(function(args) {
        var [noForwardUniversalPrimerWarning, noReverseUniversalPrimerWarning, error] = args;
        expect(noForwardUniversalPrimerWarning instanceof errors.UniversalForwardPrimerNotFound).toEqual(true);
        expect(noForwardUniversalPrimerWarning.data.level).toEqual('warn');
        expect(noReverseUniversalPrimerWarning instanceof errors.UniversalReversePrimerNotFound).toEqual(true);
        expect(noReverseUniversalPrimerWarning.data.level).toEqual('warn');

        expect(error instanceof errors.NoPrimer).toEqual(true);

        expect(error.data.notifications.universalForwardPrimerNotFound).toBeTruthy();
        expect(error.data.notifications.universalReversePrimerNotFound).toBeTruthy();
        done();
      })
      .done();
    });

    it('scenario 2: should error when any primers found but result in some DNA being left unsequenced', function(done) {
      var sequenceModel = new TemporarySequenceModel({
        sequence: forwardUniversalPrimerV1 + spacerBases(garbageLength - 1) + reverseUniversalPrimerV1
      });

      getAllPrimersAndProductsHelper(sequenceModel)
      .then(function(val) {
        // We should never get here.
        console.error("ERROR : ", val);
        expect(val).toBeUndefined();
      })
      .progress(function(val) {
        // We should never get here.
        console.error("ERROR : ", val);
        expect(val).toBeUndefined();
      })
      .catch(function(error) {
        expect(error instanceof errors.DnaLeftUnsequenced).toEqual(true);
        expect(error.data.overlappingSequencedBases).toEqual(-1);
        expect(error.data.sequencingProductsAndPrimers.length).toEqual(2);

        expect(error.data.notifications.universalForwardPrimerNotFound).toEqual(undefined);
        expect(error.data.notifications.universalReversePrimerNotFound).toEqual(undefined);
        done();
      })
      .done();
    });

    it('scenario 3: should error when any primers found but result in some DNA being left unsequenced', function(done) {
      var sequenceModel = new TemporarySequenceModel({
        sequence:  'TTTTTCCGAAGGTAACTGGCT' + spacerBases(garbageLength - 1) + 'GGTATCTGCGCTCTGCTGAA'
      });
      var dNoForwardUniversalPrimerWarning = Q.defer();
      var dNoReverseUniversalPrimerWarning = Q.defer();
      var dError = Q.defer();

      getAllPrimersAndProductsHelper(sequenceModel)
      .then(function(val) {
        // We should never get here.
        console.error("ERROR : ", val);
        expect(val).toBeUndefined();
      })
      .progress(function(val) {
        if(dNoForwardUniversalPrimerWarning.promise.isFulfilled()) {
          dNoReverseUniversalPrimerWarning.resolve(val);
        } else {
          dNoForwardUniversalPrimerWarning.resolve(val);
        }
      })
      .catch(function(val) {
        dError.resolve(val);
      })
      .done();

      Q.all([dNoForwardUniversalPrimerWarning.promise, dNoReverseUniversalPrimerWarning.promise, dError.promise])
      .then(function(args) {
        var [noForwardUniversalPrimerWarning, noReverseUniversalPrimerWarning, error] = args;
        expect(noForwardUniversalPrimerWarning instanceof errors.UniversalForwardPrimerNotFound).toEqual(true);
        expect(noForwardUniversalPrimerWarning.data.level).toEqual('warn');
        expect(noReverseUniversalPrimerWarning instanceof errors.UniversalReversePrimerNotFound).toEqual(true);
        expect(noReverseUniversalPrimerWarning.data.level).toEqual('warn');
        expect(error instanceof errors.DnaLeftUnsequenced).toEqual(true);
        expect(error.data.overlappingSequencedBases).toEqual(-1);
        expect(error.data.sequencingProductsAndPrimers.length).toEqual(2);
        expect(error.data.notifications.universalForwardPrimerNotFound instanceof errors.UniversalForwardPrimerNotFound).toEqual(true);
        expect(error.data.notifications.universalForwardPrimerNotFound).toEqual(noForwardUniversalPrimerWarning);
        expect(error.data.notifications.universalReversePrimerNotFound instanceof errors.UniversalReversePrimerNotFound).toEqual(true);
        expect(error.data.notifications.universalReversePrimerNotFound).toEqual(noReverseUniversalPrimerWarning);
        done();
      })
      .done();
    });

    it('scenario 4: should error when sequence too short to find primers', function(done) {
      var sequenceModel = new TemporarySequenceModel({sequence: 'ACTA'});

      getAllPrimersAndProductsHelper(sequenceModel)
      .then(function(val) {
        // We should never get here.
        console.error("ERROR : ", val);
        expect(val).toBeUndefined();
      })
      .catch(function(error) {
        expect(error instanceof errors.SequenceTooShort).toEqual(true);
        expect(error.data.sequenceToSearch).toEqual('ACTA');
        expect(error.data.minPrimerLength).toEqual(20);

        expect(error.data.notifications.universalForwardPrimerNotFound).toBeTruthy();
        expect(error.data.notifications.universalReversePrimerNotFound).toBeTruthy();
        done();
      })
      .done();
    });
  });

});
