import _ from 'underscore';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import PrimerCalculation from './primer_calculation';
import {defaultPCRPrimerOptions} from './primer_defaults';
import Q from 'q';


var processReports = function(progressReports) {
  var i = progressReports.length-1;
  var currentCompletion = progressReports[i].current;
  var currentTotal = progressReports[i].total;
  return {current: currentCompletion, total: currentTotal, entries: progressReports.length};
};


var processPrimerResults = function(sequence, opts, primerResults) {
  var [forwardAnnealingRegion, reverseAnnealingRegion] = primerResults;

  _.defaults(opts, {
    from: 0,
    to: sequence.length - 1
  });

  sequence = sequence.substr(opts.from, opts.to);

  if(opts.stickyEnds) {
    sequence = opts.stickyEnds.start + sequence + opts.stickyEnds.end;
  }

  var lengthOfStartStickyEnd = (opts.stickyEnds && opts.stickyEnds.start) ? opts.stickyEnds.start.length : 0;
  var lengthOfEndStickyEnd = (opts.stickyEnds && opts.stickyEnds.end) ? opts.stickyEnds.end.length : 0;
  var forwardAnnealingFrom = lengthOfStartStickyEnd - 1;
  var reverseAnnealingFrom = sequence.length - lengthOfEndStickyEnd - reverseAnnealingRegion.sequence.length + 1;

  _.extend(forwardAnnealingRegion, {
    from: forwardAnnealingFrom,
    to: forwardAnnealingFrom + forwardAnnealingRegion.sequence.length,
    sequenceLength: forwardAnnealingRegion.sequence.length
  });

  _.extend(reverseAnnealingRegion, {
    from: reverseAnnealingFrom,
    to: reverseAnnealingFrom + reverseAnnealingRegion.sequence.length - 1,
    sequenceLength: reverseAnnealingRegion.sequence.length
  });

  var forwardPrimer = {
    sequence: (opts.stickyEnds ? opts.stickyEnds.start : '') + forwardAnnealingRegion.sequence,
    from: 0,
    to: lengthOfStartStickyEnd + forwardAnnealingRegion.sequence.length - 1,
    id: _.uniqueId(),
    name: 'Forward primer',
  };
  forwardPrimer.sequenceLength = forwardPrimer.sequence.length;
  forwardPrimer.gcContent = SequenceCalculations.gcContent(forwardPrimer.sequence);

  var reversePrimer = {
    sequence: (opts.stickyEnds ? SequenceTransforms.toReverseComplements(opts.stickyEnds.end) : '') +reverseAnnealingRegion.sequence,
    from: 0,
    to: (opts.stickyEnds ? opts.stickyEnds.end.length : 0) + reverseAnnealingRegion.sequence.length - 1,
    id: _.uniqueId(),
    name: 'Reverse primer',
  };
  reversePrimer.sequenceLength = forwardPrimer.sequence.length;
  reversePrimer.gcContent = SequenceCalculations.gcContent(reversePrimer.sequence);

  return {
    id: _.uniqueId(),
    from: opts.from,
    to: opts.to,
    name: opts.name,
    forwardAnnealingRegion: forwardAnnealingRegion,
    reverseAnnealingRegion: reverseAnnealingRegion,
    forwardPrimer: forwardPrimer,
    reversePrimer: reversePrimer,
    sequenceLength: sequence.length,
    stickyEnds: opts.stickyEnds,
    meltingTemperature: SequenceCalculations.meltingTemperature(sequence)
  };
};


var getPCRProduct = function(sequence, opts) {
  sequence = _.isString(sequence) ? sequence : sequence.get('sequence');
  opts = defaultPCRPrimerOptions(opts);

  var forwardPrimerPromise = PrimerCalculation.optimalPrimer3(sequence, opts);
  var reversePrimerPromise = PrimerCalculation.optimalPrimer3(SequenceTransforms.toReverseComplements(sequence), opts);
  var progressReports = [{current: 0, total: 0, isFallback: false}];
  var fallbackProgressReports = [{current: 0, total: 0, isFallback: true}];

  return Q.promise(function (resolve, reject, notify) {

    Q.all([forwardPrimerPromise, reversePrimerPromise]).progress(function(current) {
      if(current.value.isFallback) {
        fallbackProgressReports.push(current.value);
      } else {
        progressReports.push(current.value);
      }
      var lastProgress = processReports(progressReports);
      var lastFallbackProgress = processReports(fallbackProgressReports);

      notify({lastProgress, lastFallbackProgress});
    }).then(function(primerResults) {
      var processedResults = processPrimerResults(sequence, opts, primerResults);
      resolve(processedResults);
    }).catch((e) => {
      console.error('getpcrproduct err', e);
      reject(e);
    });

  });

};


// Tests
if(false) {
  var sequence = ('AGAGCAAGAGCTGAGCCATTCCCCTTCAGATTTTGACCCGTCGGCGGCCGCGCC' +
  'GCCGGCGGGTGTCGATTGAATGAACCAAGGAATTTCGTGATGAAGCACTCTTCGGATATTTGCATCGTCG' +
  'GCGCCGGAATCAGCGGCTTGAGCTGCGCGACGTATTTGCTGGAATCGCCCGCCTGCCGCGGCCTGTCGCT' +
  'GCGGATTTTCGACATGCAGACGGAGGCGGGGGGACGCATCCGCTCGAAAAACCTGGACGGCAAGGCCGCG' +
  'ATAGAGCTGGGTGCCGGCCGCTACTCGCCGCAACTGCACCCGCAGTTCCAGAGCGTGATGCAAAGCTACA' +
  'GCCAGCGCAGCGAACGCTATCCCTTCACCCAGCTGAAATTCAAGAACCGCGTCCAGCAAACGCTGAAAAG');

  var opts = {
    from: 9,
    to: 149,
    name: "vioA",
    targetMeltingTemperature: 65,
    stickyEnds: {
      name: "X-Z'",
      startName: "X",
      endName: "Z'",
      start: "CCTGCAGTCAGTGGTCTCTAGAG",
      end: "GAGATGAGACCGTCAGTCACGAG",
      startOffset: 19,
      endOffset: -19
    },
    minPrimerLength: 10,
    maxPrimerLength: 40,
    meltingTemperatureTolerance: 1.5,
    targetGcContent: 0.5,
    useIDT: true,
  };

  var primerResults = [{
    sequence: "AGAGCAAGAGCTGAGCCATTC",
    meltingTemperature: 64.3,
    gcContent: 0.5238095238095238,
    id: "12345-67890",
    from: 23,
    to: 43,
    sequenceLength: 21,
  },{
    sequence: "ATCCCTTGCGCCAAAAGGC",
    meltingTemperature: 65.8,
    gcContent: 0.5789473684210527,
    id: "98765",
    from: 154,
    to: 172,
    sequenceLength: 19,
  }];

  var processedResults = processPrimerResults(sequence, opts, primerResults);

  var expectedResult = {
    id: "1426802350984-1d3c0",
    from: 9,
    to: 149,
    name: "asdfasdf",
    forwardAnnealingRegion: {
      sequence: "AGAGCAAGAGCTGAGCCATTC",
      meltingTemperature: 64.3,
      gcContent: 0.5238095238095238,
      id: "12345-67890",
      from: 23,
      to: 43,
      sequenceLength: 21
    },
    reverseAnnealingRegion: {
      sequence: "ATCCCTTGCGCCAAAAGGC",
      meltingTemperature: 65.8,
      gcContent: 0.5789473684210527,
      id: "98765",
      from: 154,
      to: 172,
      sequenceLength: 19
    },
    forwardPrimer: {
      sequence: "CCTGCAGTCAGTGGTCTCTAGAGAGAGCAAGAGCTGAGCCATTC",
      from: 0,
      to: 43,
      id: "1426802334723-1b50a",
      name: "Forward primer",
      sequenceLength: 44,
      gcContent: 0.5454545454545454
    },
    reversePrimer: {
      sequence: "CTCGTGACTGACGGTCTCATCTCATCCCTTGCGCCAAAAGGC",
      from: 0,
      to: 41,
      id: "1426802337160-1a54f",
      name: "Reverse primer",
      sequenceLength: 44,
      gcContent: 0.5714285714285714
    },
    sequenceLength: 195,
    stickyEnds: {
      name: "X-Z'",
      startName: "X",
      endName: "Z'",
      start: "CCTGCAGTCAGTGGTCTCTAGAG",
      end: "GAGATGAGACCGTCAGTCACGAG",
      startOffset: 19,
      endOffset: -19
    },
    meltingTemperature: 91.55257523073942
  };

  console.assert(processedResults === expectedResult);
  console.assert(processedResults.to);
  console.assert(processedResults.name);
  console.assert(processedResults.forwardAnnealingRegion);
  console.assert(processedResults.reverseAnnealingRegion);
  console.assert(processedResults.forwardPrimer);
  console.assert(processedResults.reversePrimer);
  console.assert(processedResults.sequenceLength);
  console.assert(processedResults.stickyEnds);
  console.assert(processedResults.meltingTemperature);

}

export default getPCRProduct;