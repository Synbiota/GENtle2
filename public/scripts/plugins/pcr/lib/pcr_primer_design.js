import _ from 'underscore';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import PrimerCalculation from './primer_calculation';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import {defaultPCRPrimerOptions} from './primer_defaults';
import Q from 'q';


var processReports = function(progressReports) {
  var i = progressReports.length-1;
  var currentCompletion = progressReports[i].current;
  var currentTotal = progressReports[i].total;
  return {current: currentCompletion, total: currentTotal, entries: progressReports.length};
};


var calculateFeatures = function(pcrProduct) {
  var features = [];
  var productAttributes = pcrProduct.attributes;

  if(productAttributes.stickyEnds) {
    var sequenceNts = productAttributes.sequence;
    features = [{
      name: productAttributes.stickyEnds.startName + ' end',
      _type: 'sticky_end',
      ranges: [{
        from: 0,
        to: productAttributes.stickyEnds.start.length-1
      }]
    },
    {
      name: productAttributes.stickyEnds.endName + ' end',
      _type: 'sticky_end',
      ranges: [{
        from: sequenceNts.length - 1,
        to: sequenceNts.length - 1 - productAttributes.stickyEnds.end.length,
      }]
    },
    {
      name: 'Annealing region',
      _type: 'annealing_region',
      ranges: [_.pick(productAttributes.forwardAnnealingRegion, 'from', 'to')]
    },
    {
      name: 'Annealing region',
      _type: 'annealing_region',
      ranges: [_.pick(productAttributes.reverseAnnealingRegion, 'from', 'to')]
    },
    {
      name: productAttributes.forwardPrimer.name,
      _type: 'primer',
      ranges: [_.pick(productAttributes.forwardPrimer, 'from', 'to')]
    },
    {
      name: productAttributes.reversePrimer.name,
      _type: 'primer',
      ranges: [_.pick(productAttributes.reversePrimer, 'from', 'to')]
    }
    ];
  }
  return features;
};


var calculatePcrProduct = function(sequence, opts, primerResults) {
  var sequenceNts = _.isString(sequence) ? sequence : sequence.get('sequence');
  var {
    forwardAnnealingRegion: forwardAnnealingRegion,
    reverseAnnealingRegion: reverseAnnealingRegion,
  } = primerResults;

  var regionOfInterest = sequenceNts.slice(opts.from, opts.to + 1);
  var startStickyEnd = opts.stickyEnds && opts.stickyEnds.start || '';
  var endStickyEnd = opts.stickyEnds && opts.stickyEnds.end || '';

  var pcrProductSequence = startStickyEnd + regionOfInterest + endStickyEnd;

  _.extend(forwardAnnealingRegion, {
    from: startStickyEnd.length,
    to: startStickyEnd.length + forwardAnnealingRegion.sequence.length - 1,
  });

  var lengthOfRoi = regionOfInterest.length;
  var reverseAnnealingFrom = startStickyEnd.length + lengthOfRoi - 1;
  _.extend(reverseAnnealingRegion, {
    from: reverseAnnealingFrom,
    to: reverseAnnealingFrom - reverseAnnealingRegion.sequence.length,
  });

  var forwardPrimerSequence = startStickyEnd + forwardAnnealingRegion.sequence;
  var forwardPrimer = {
    name: 'Forward primer',
    sequence: forwardPrimerSequence,
    from: 0,
    to: forwardPrimerSequence.length - 1,
    id: _.uniqueId(),
    gcContent: SequenceCalculations.gcContent(forwardPrimerSequence),
  };

  var reversePrimerSequence = SequenceTransforms.toReverseComplements(endStickyEnd) + reverseAnnealingRegion.sequence;
  var reversePrimer = {
    name: 'Reverse primer',
    sequence: reversePrimerSequence,
    from: pcrProductSequence.length - 1,
    to: pcrProductSequence.length - 1 - reversePrimerSequence.length,
    id: _.uniqueId(),
    gcContent: SequenceCalculations.gcContent(reversePrimerSequence),
  };

  var pcrProduct = new TemporarySequence({
    id: _.uniqueId(),
    name: opts.name,
    // `from` and `to` refer to the parent sequence this PCR product came from
    from: opts.from,
    to: opts.to,
    sequence: pcrProductSequence,
    forwardAnnealingRegion: forwardAnnealingRegion,
    reverseAnnealingRegion: reverseAnnealingRegion,
    forwardPrimer: forwardPrimer,
    reversePrimer: reversePrimer,
    stickyEnds: opts.stickyEnds,
    meltingTemperature: SequenceCalculations.meltingTemperature(pcrProductSequence)
  });
  pcrProduct.set('features', calculateFeatures(pcrProduct));
  return pcrProduct;
};


var getSequencesToSearch = function(sequence, opts) {
  var sequenceNts = _.isString(sequence) ? sequence : sequence.get('sequence');
  opts = defaultPCRPrimerOptions(opts);

  _.defaults(opts, {
    from: 0,
    to: sequenceNts.length - 1
  });

  if(opts.to < opts.from) {
    throw "getPCRProduct `opts.to` is smaller than `opts.from`";
  } else if((sequenceNts.length - opts.from) < opts.minPrimerLength) {
    throw "getPCRProduct `opts.from` is too large to leave enough sequence length to find the primer";
  } else if (opts.to < opts.minPrimerLength) {
    throw "getPCRProduct `opts.to` is too small to leave enough sequence length to find the primer";
  }

  var forwardSequenceToSearch = sequenceNts.substr(opts.from, opts.maxPrimerLength);
  var reverseSequenceToSearch = SequenceTransforms.toReverseComplements(sequenceNts);
  var to = sequenceNts.length - opts.to - 1;
  reverseSequenceToSearch = reverseSequenceToSearch.substr(to, opts.maxPrimerLength);

  return {forwardSequenceToSearch, reverseSequenceToSearch};
};


/**
 * getPCRProduct
 * @param  {[type]} sequence
 * @param  {[type]} opts     opts.from and opts.to specify the start and the end
 *                           of the ROI (Region of interest, the desired sequence)
 *                           not the primer sequences,
 *                           for these, `from` specifies the start of the forward
 *                           primer sequence and `to` specifies the start on the
 *                           antisense/reverse strand of the reverse primer
 *                           sequence.
 * @return {[promise]}       resolves with a hash containing pcrProduct attributes
 */
var getPCRProduct = function(sequence, opts) {
  var {
    forwardSequenceToSearch: forwardSequenceToSearch,
    reverseSequenceToSearch: reverseSequenceToSearch
  } = getSequencesToSearch(sequence, opts);

  var forwardPrimerPromise = PrimerCalculation.optimalPrimer4(forwardSequenceToSearch, opts);
  var reversePrimerPromise = PrimerCalculation.optimalPrimer4(reverseSequenceToSearch, opts);

  // var progressReports = [{current: 0, total: 0, isFallback: false}];
  // var fallbackProgressReports = [{current: 0, total: 0, isFallback: true}];
  return Q.promise(function (resolve, reject, notify) {

    Q.all([forwardPrimerPromise, reversePrimerPromise])
    // .progress(function(current) {
    //   // TODO fix me by reimplementing `progress` in `optimalPrimer4`
    //   if(current.value.isFallback) {
    //     fallbackProgressReports.push(current.value);
    //   } else {
    //     progressReports.push(current.value);
    //   }
    //   var lastProgress = processReports(progressReports);
    //   var lastFallbackProgress = processReports(fallbackProgressReports);

    //   notify({lastProgress, lastFallbackProgress});
    // })
    .then(function(primerResults) {
      var forwardAnnealingRegion = primerResults[0];
      var reverseAnnealingRegion = primerResults[1];
      var pcrProduct = calculatePcrProduct(sequence, opts, {forwardAnnealingRegion, reverseAnnealingRegion});
      resolve(pcrProduct);
    })
    .catch((e) => {
      console.error('getpcrproduct err', e);
      reject(e);
    });

  });

};


// Tests
if(false) {
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

  var reverseAnnealingRegionSequenceComplement = SequenceTransforms.toReverseComplements(reverseAnnealingRegionSequence);

  var frm = 9;
  var to = 149;

  var opts = {
    from: frm,
    to: to,
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

  var primerResults = {
    forwardAnnealingRegion: {
      sequence: forwardAnnealingRegionSequence,
      from: 0,
      to: 18,
      meltingTemperature: 64.1,
      gcContent: 0.5789473684210527,
      id: "1426877294103-16080",
      name: "Sequence 1426877294103-16080",
      ourMeltingTemperature: 64.77312154400113,
    },
    reverseAnnealingRegion: {
      sequence: reverseAnnealingRegionSequenceComplement,
      from: 0,
      to: 16,
      meltingTemperature: 63.5,
      gcContent: 0.5882352941176471,
      id: "1426877290866-1893c",
      name: "Sequence 1426877290866-1893c",
    },
  };

  var pcrProduct = calculatePcrProduct(sequence, opts, _.deepClone(primerResults));
  pcrProduct = pcrProduct.attributes;

  // Test forwardAnnealingRegion
  var forwardAnnealingRegion = pcrProduct.forwardAnnealingRegion;
  console.assert(forwardAnnealingRegion.sequence === forwardAnnealingRegionSequence);
  console.assert(forwardAnnealingRegion.from === 23);
  console.assert(forwardAnnealingRegion.to === 41);

  // Test reverseAnnealingRegion
  var reverseAnnealingRegion = pcrProduct.reverseAnnealingRegion;
  console.assert(reverseAnnealingRegion.sequence === reverseAnnealingRegionSequenceComplement);
  console.assert(reverseAnnealingRegion.from === (
    opts.stickyEnds.start.length +
    forwardAnnealingRegionSequence.length +
    interveningSequence.length +
    reverseAnnealingRegionSequence.length - 1)
  );
  console.assert(reverseAnnealingRegion.to === (
    reverseAnnealingRegion.from -
    reverseAnnealingRegionSequence.length)
  );

  // Test forwardPrimer
  var forwardPrimer = pcrProduct.forwardPrimer;
  console.assert(forwardPrimer.sequence === opts.stickyEnds.start + forwardAnnealingRegionSequence);
  console.assert(forwardPrimer.from === 0);
  console.assert(forwardPrimer.to === 41);

  // Test reversePrimer
  var reversePrimer = pcrProduct.reversePrimer;
  console.assert(reversePrimer.sequence === SequenceTransforms.toReverseComplements(opts.stickyEnds.end) + reverseAnnealingRegionSequenceComplement);
  console.assert(reversePrimer.from === pcrProduct.sequence.length - 1);
  console.assert(reversePrimer.to === reversePrimer.from - reversePrimer.sequence.length);

  console.assert(pcrProduct.to === to);
  console.assert(pcrProduct.from === frm);
  console.assert(pcrProduct.name === 'vioA');
  console.assert(pcrProduct.sequence === (
    forwardPrimer.sequence +
    interveningSequence +
    SequenceTransforms.toReverseComplements(reversePrimer.sequence))
  );
  console.assert(pcrProduct.meltingTemperature > 91.0);
  console.assert(pcrProduct.meltingTemperature < 91.1);


  // Test `getSequencesToSearch()`
  var {
    forwardSequenceToSearch: forwardSequenceToSearch,
    reverseSequenceToSearch: reverseSequenceToSearch,
  } = getSequencesToSearch(sequence, opts);
  console.assert(forwardSequenceToSearch.indexOf(forwardAnnealingRegionSequence) === 0);
  console.assert(reverseSequenceToSearch.indexOf(reverseAnnealingRegionSequenceComplement) === 0);

}

export default getPCRProduct;