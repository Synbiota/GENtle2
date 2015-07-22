import idtMeltingTemperatureStub from './idt_stub';
import {stubOutIDTMeltingTemperature, restoreIDTMeltingTemperature} from '../lib/primer_calculation';
import {stubCurrentUser} from '../../../common/tests/stubs';
import {defaultSequencingPrimerOptions, defaultPCRPrimerOptions} from '../lib/primer_defaults';
import {optimalPrimer4, _getSequenceToSearch} from '../lib/primer_calculation';
import SequenceModel from '../../../sequence/models/sequence';
import SequenceTransforms from 'gentle-sequence-transforms';


stubCurrentUser();

var bothEndsSequence;
var sequence1;
var sequence1Reversed;
var sequence2;
var sequence2Reversed;
var polyASequence;
var onlyContainingReverseUniversalPrimer;

var micro = 1e-6;


var checkResult = function(primer, expectations={}) {
  expectations = _.defaults(expectations, {
    gcContentGreaterThan: 0.3,
    gcContentLessThan: 0.7,
    minimumMeltingTemperature: 62,
    maximumMeltingTemperature: 65,
    optimal: true,
  });
  expect(primer.meltingTemperature).toBeGreaterThan(expectations.minimumMeltingTemperature - micro);
  expect(primer.meltingTemperature).toBeLessThan(expectations.maximumMeltingTemperature + micro);
  expect(primer.gcContent).toBeGreaterThan(expectations.gcContentGreaterThan - micro);
  expect(primer.gcContent).toBeLessThan(expectations.gcContentLessThan + micro);
  expect(primer.optimal).toEqual(expectations.optimal);

  var actual;
  if(_.has(expectations, 'expectedSequence')) {
    actual = primer.getSequence();
    expect(actual).toEqual(expectations.expectedSequence);
  }
  if(_.has(expectations, 'expectedFrom')) {
    expect(primer.range.from).toEqual(expectations.expectedFrom);
  }
  if(_.has(expectations, 'expectedTo')) {
    expect(primer.range.to).toEqual(expectations.expectedTo);
  }
};


var optimalPrimer4_TestFactory = function(done, sequenceBases, expectations, options={}, sequenceOptions={}) {
  let sequenceModel = new SequenceModel({sequence: sequenceBases});
  sequenceOptions = _.defaults(sequenceOptions, {
    from: 0,
    maxSearchSpace: 500,
    findOnReverseStrand: false,
  });
  optimalPrimer4(sequenceModel, sequenceOptions, options)
  .then(function(primer) {
    checkResult(primer, expectations);
  })
  .finally(done).done();
};


describe('finding optimal primers', function() {
  var setup;
  beforeEach(function(done) {
    if(!setup) {
      setup = true;
      bothEndsSequence = 'ATTGATTACGTACAGCACGTATGG' + 'AAAAAA' + 'GTGTATCTATTCCTTTTATTGGAGAGGGAG';
      sequence1 = 'AAAAAAATGATTTTTTTGGCAATTTTAGATTTAAAATCTTTAGTACTCAATGCAATAAATTATTGGGGTCCTAAAAATAATAATGGCATACAGGGTGGTGATTTTGGTTACCCTATATCAGAAAAACAAATAGATACGTCTATTATAACTTCTACTCATCCTCGTTTAATTCCACATGATTTAACAATTCCTCAAAATTTAGAAACTATTTTTACTACAACTCAAGTATTAACAAATAATACAGATTTACAACAAAGTCAAACTGTTTCTTTTGCTAAAAAAACAACGACAACAACTTCAACTTCAACTACAAATGGTTGGACAGAAGGTGGGAAAATTTCAGATACATTAGAAGAAAAAGTAAGTGTATCTATTCCTTTTATTGGAGAGGGAGGAGGAAAAAACAGTACAACTATAGAAGCTAATTTTGCACATAACTCTAGT';
      sequence1Reversed = SequenceTransforms.toReverseComplements(sequence1);
      sequence2 = 'ATAGAAGCTAATTTTGCACATAACTCTAGTACTACTACTTTTCAACAGGCTTCAACTGATATAGAGTGGAATATTTCACAACCAGTATTGGTTCCCCCACGTAAACAAGTTGTAGCAACATTAGTTATTATGGGAGGTAATTTTACTATTCCTATGGATTTGATGACTACTATAGATTCTACAGAACATTATAGTGGTTATCCAATATTAACATGGATATCGAGCCCCGATAATAGTTATAATGGTCCATTTATGAGTTGGTATTTTGCAAATTGGCCCAATTTACCATCGGGGTTTGGTCCTTTAAATTCAGATAATACGGTCACTTATACAGGTTCTGTTGTAAGTCAAGTATCAGCTGGTGTATATGCCACTGTACGATTTGATCAATATGATATACACAATTTAAGGACAATTGAAAAAACTTGGTATGCACGACATGC';
      sequence2Reversed = SequenceTransforms.toReverseComplements(sequence2);
      polyASequence = 'GAAAGAAGAAGAAGAAGAAGAAGAAGAAAAAAA';
      onlyContainingReverseUniversalPrimer = 'GATCACTACCGGGCGTATT' + 'AAAAAAAAAA' + 'GATCACTACCGGGCGTATT';

      stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
    }
    done();
  });

  /*********************
   * Sequencing primer
   *********************/
  it('should find sequencing primer for bothEndsSequence', function(done) {
    optimalPrimer4_TestFactory(done, bothEndsSequence,
      {expectedSequence: 'ATTGATTACGTACAGCACGTATGG', expectedFrom: 0, expectedTo: 24},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: false})
    );
  });

  it('optimalPrimer4 for Sequencing primer with bothEndsSequence', function(done) {
    optimalPrimer4_TestFactory(done, bothEndsSequence,
      {expectedSequence: 'GTGTATCTATTCCTTTTATTGGAGAGGGAG', expectedFrom: 30, expectedTo: 60},
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

  it('optimalPrimer4 for Sequencing primer with onlyContainingReverseUniversalPrimer', function(done) {
    optimalPrimer4_TestFactory(done, onlyContainingReverseUniversalPrimer,
      {expectedSequence: 'GATCACTACCGGGCGTATTAAAA', expectedFrom: 0, expectedTo: 23},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: false})
    );
  });

  it('optimalPrimer4 for Sequencing primer with onlyContainingReverseUniversalPrimer and allowed shorter primer', function(done) {
    // Current universal primer doesn't pass the length or melting temperature
    // requirements for sequencing primers.
    var opts = defaultSequencingPrimerOptions({
      findFrom3PrimeEnd: false,
      minPrimerLength: 19,
    });
    opts.targetMeltingTemperature -= 1;
    optimalPrimer4_TestFactory(done, onlyContainingReverseUniversalPrimer,
      {expectedSequence: 'GATCACTACCGGGCGTATT', expectedFrom: 0, expectedTo: 19, minimumMeltingTemperature: 61},
      opts
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
});


describe('getting sequence to search for primer', function() {
  var sequence = 'GCTCAAGCCGCTGATTCATACGTCGCGCACGGCGCAATAT';
  var minPrimerLength = 5;
  var maxSearchSpace = 10;
  var errors;

  var constructPrimerModel = function(correctedFrom, reverseStrand=false, minPrimerLen=undefined) {
    errors = [];
    var sequenceModel = new SequenceModel({sequence});
    var primerModel = {
      deferred: {
        reject: function(error) {
          errors.push(error);
        },
      },
      sequenceModel: sequenceModel,
      sequenceOptions: {
        from: correctedFrom,
        maxSearchSpace: maxSearchSpace,
        findOnReverseStrand: reverseStrand,
      },
      options: {
        minPrimerLength: minPrimerLen || minPrimerLength
      },
    };
    _getSequenceToSearch(primerModel);
    return primerModel;
  };

  it('returns the forward sequence, defaulting to start', function() {
    var primerModel = constructPrimerModel(0);
    expect(primerModel.frm).toEqual(0);
    expect(primerModel.sequenceToSearch).toEqual('GCTCAAGCCG');
  });

  it('returns the forward sequence', function() {
    var primerModel = constructPrimerModel(35, false);
    expect(primerModel.frm).toEqual(35);
    expect(primerModel.sequenceToSearch).toEqual('AATAT');
  });

  it('errors if frm is too large (and the forward sequence is requested)', function() {
    constructPrimerModel(36, false);
    expect(errors.length).toEqual(1);
    expect(errors[0].toString()).toEqual("SequenceTooShort: `sequenceOptions.from` is too large or sequence is too short to leave enough sequence length to find the primer");
  });

  it('returns the reverse sequence, defaulting to end', function() {
    var primerModel = constructPrimerModel(0, true);
    expect(primerModel.frm).toEqual(30);
    expect(primerModel.sequenceToSearch).toEqual('ATATTGCGCC');  // complement of GGCGCAATAT
  });

  it('returns the reverse sequence', function() {
    var primerModel = constructPrimerModel(5, true);
    expect(primerModel.frm).toEqual(25);
    expect(primerModel.sequenceToSearch).toEqual('GCGCCGTGCG');  // complement of CGCACGGCGC
  });

  it('copes when frm is too large and the reverse strand is requested', function() {
    var primerModel = constructPrimerModel(35, true);
    expect(errors.length).toEqual(0);
    expect(primerModel.frm).toEqual(0);
    expect(primerModel.sequenceToSearch).toEqual('CGGCTTGAGC');  // complement of GCTCAAGCCG
  });

  it('errors when sequence is too small and the reverse strand is requested', function() {
    constructPrimerModel(0, true, 41);
    expect(errors.length).toEqual(1);
    expect(errors[0].toString()).toEqual("SequenceTooShort: sequence is too short to leave enough sequence length to find the primer");
  });
});
