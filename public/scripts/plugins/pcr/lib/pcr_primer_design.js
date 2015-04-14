import _ from 'underscore';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import PrimerCalculation from './primer_calculation';
import Sequence from '../../../sequence/models/sequence';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import {defaultPCRPrimerOptions} from './primer_defaults';
import Q from 'q';


var processReports = function(progressReports) {
  var sumPick = function(array, keyName) {
    return _.reduce(array, function(memo, report) {
      return memo + report[keyName];
    }, 0);
  };
  var currentCompletion = sumPick(progressReports, 'current');
  var currentTotal = sumPick(progressReports, 'total');
  return {current: currentCompletion, total: currentTotal, entries: progressReports.length};
};


var calculateFeatures = function(productAttributes) {
  var features = [];

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


/**
 * calculatePcrProductFromPrimers
 * @param  {string} sequence nucleotides
 * @param  {hash}   opts must contain `name`, `from`, `to`, `stickyEnds`
 * @param  {hash}   primerResults must contain `forwardAnnealingRegion`, `reverseAnnealingRegion`
 * @return {TemporarySequence}
 *
 * We export it to be accessible to tests
 */
var calculatePcrProductFromPrimers = function(sequence, opts, primerResults) {
  opts = _.pick(opts, ['name', 'from', 'to', 'stickyEnds']);
  var sequenceNts = _.isString(sequence) ? sequence : sequence.get('sequence');
  var {
    forwardAnnealingRegion: forwardAnnealingRegion,
    reverseAnnealingRegion: reverseAnnealingRegion
  } = primerResults;

  var {
    productSequence: pcrProductSequence,
    regionOfInterest: regionOfInterest,
    startStickyEnd: startStickyEnd,
    endStickyEnd: endStickyEnd
  } = Sequence.calculateProduct(sequenceNts, _.pick(opts, ['from', 'to', 'stickyEnds']));

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
  pcrProduct.set('features', calculateFeatures(pcrProduct.attributes));
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
    throw "getPcrProductAndPrimers `opts.to` is smaller than `opts.from`";
  } else if((sequenceNts.length - opts.from) < opts.minPrimerLength) {
    throw "getPcrProductAndPrimers `opts.from` is too large to leave enough sequence length to find the primer";
  } else if (opts.to < opts.minPrimerLength) {
    throw "getPcrProductAndPrimers `opts.to` is too small to leave enough sequence length to find the primer";
  }

  var forwardSequenceToSearch = sequenceNts.substr(opts.from, opts.maxPrimerLength);
  var reverseSequenceToSearch = SequenceTransforms.toReverseComplements(sequenceNts);
  var to = sequenceNts.length - opts.to - 1;
  reverseSequenceToSearch = reverseSequenceToSearch.substr(to, opts.maxPrimerLength);

  return {forwardSequenceToSearch, reverseSequenceToSearch};
};


/**
 * getPcrProductAndPrimers
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
var getPcrProductAndPrimers = function(sequence, opts) {
  var {
    forwardSequenceToSearch: forwardSequenceToSearch,
    reverseSequenceToSearch: reverseSequenceToSearch
  } = getSequencesToSearch(sequence, opts);

  var forwardPrimerPromise = PrimerCalculation.optimalPrimer4(forwardSequenceToSearch, opts);
  var reversePrimerPromise = PrimerCalculation.optimalPrimer4(reverseSequenceToSearch, opts);

  var initTotal = opts.maxPrimerLength - opts.minPrimerLength + 1;

  var progressReports = [
    {current: 0, total: initTotal, isFallback: false},
    {current: 0, total: initTotal, isFallback: false}
  ];
  var fallbackProgressReports = [
    {current: 0, total: initTotal, isFallback: true}, 
    {current: 0, total: initTotal, isFallback: true}
  ];
  return Q.promise(function (resolve, reject, notify) {

    Q.all([forwardPrimerPromise, reversePrimerPromise])
    .progress(function(current) {
      if(current.value.isFallback) {
        fallbackProgressReports[current.index] = current.value;
      } else {
        progressReports[current.index] = current.value;
      }
      var lastProgress = processReports(progressReports);
      var lastFallbackProgress = processReports(fallbackProgressReports);

      notify({lastProgress, lastFallbackProgress});
    })
    .then(function(primerResults) {
      var forwardAnnealingRegion = primerResults[0];
      var reverseAnnealingRegion = primerResults[1];
      var pcrProduct = calculatePcrProductFromPrimers(sequence, opts, {forwardAnnealingRegion, reverseAnnealingRegion});
      resolve(pcrProduct);
    })
    .catch((e) => {
      console.error('getPcrProductAndPrimers err', e);
      reject(e);
    });

  });

};


export {
  calculatePcrProductFromPrimers,
  getPcrProductAndPrimers,
  getSequencesToSearch
};
