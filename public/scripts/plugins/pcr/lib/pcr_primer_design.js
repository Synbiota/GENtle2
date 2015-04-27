import _ from 'underscore';
import Q from 'q';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import PrimerCalculation from './primer_calculation';
import Sequence from '../../../sequence/models/sequence';
import PcrProductModel from './pcr_product';
import PcrPrimerModel from './primer';
import {defaultPCRPrimerOptions} from './primer_defaults';
import {assertIsInstance} from '../../../common/lib/testing_utils';


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

  var sequenceBases = productAttributes.sequence;
  features = [{
    name: productAttributes.stickyEnds.start.name + ' end',
    _type: 'sticky_end',
    ranges: [{
      from: 0,
      to: productAttributes.stickyEnds.start.sequence.length-1
    }]
  },
  {
    name: productAttributes.stickyEnds.end.name + ' end',
    _type: 'sticky_end',
    ranges: [{
      from: sequenceBases.length - 1,
      to: sequenceBases.length - 1 - productAttributes.stickyEnds.end.sequence.length,
    }]
  },
  {
    name: 'Annealing region',
    _type: 'annealing_region',
    ranges: [_.pick(productAttributes.forwardAnnealingRegionPrimerModel, 'from', 'to')]
  },
  {
    name: 'Annealing region',
    _type: 'annealing_region',
    ranges: [_.pick(productAttributes.reverseAnnealingRegionPrimerModel, 'from', 'to')]
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
  return features;
};


/**
 * calculatePcrProductFromPrimers
 * @param  {string} sequence nucleotides
 * @param  {hash}   opts must contain `name`, `from`, `to`, `stickyEnds`
 * @param  {PcrPrimerModel}  forwardAnnealingRegionPrimerModel
 * @param  {PcrPrimerModel}  reverseAnnealingRegionPrimerModel`
 * @return {TemporarySequence}
 *
 * We export it to be accessible to tests
 */
var calculatePcrProductFromPrimers = function(sequence, opts, forwardAnnealingRegionPrimerModel, reverseAnnealingRegionPrimerModel) {
  assertIsInstance(forwardAnnealingRegionPrimerModel, PcrPrimerModel, 'calculatePcrProductFromPrimers with forwardAnnealingRegionPrimerModel');
  assertIsInstance(reverseAnnealingRegionPrimerModel, PcrPrimerModel, 'calculatePcrProductFromPrimers with reverseAnnealingRegionPrimerModel');
  opts = _.pick(opts, ['name', 'from', 'to', 'stickyEnds']);
  var sequenceBases = _.isString(sequence) ? sequence : sequence.get('sequence');

  var {
    productSequence: pcrProductSequenceBases,
    regionOfInterest: regionOfInterest,
    startStickyEnd: startStickyEnd,
    endStickyEnd: endStickyEnd
  } = Sequence.calculateProduct(sequenceBases, _.pick(opts, ['from', 'to', 'stickyEnds']));

  _.extend(forwardAnnealingRegionPrimerModel, {
    from: startStickyEnd.length,
    to: startStickyEnd.length + forwardAnnealingRegionPrimerModel.sequence.length - 1,
  });

  var lengthOfRoi = regionOfInterest.length;
  var reverseAnnealingFrom = startStickyEnd.length + lengthOfRoi - 1;
  _.extend(reverseAnnealingRegionPrimerModel, {
    from: reverseAnnealingFrom,
    to: reverseAnnealingFrom - reverseAnnealingRegionPrimerModel.sequence.length,
  });

  var forwardPrimerSequence = startStickyEnd + forwardAnnealingRegionPrimerModel.sequence;
  // TODO change this to a forwardPrimerModel
  var forwardPrimer = {
    name: 'Forward primer',
    sequence: forwardPrimerSequence,
    from: 0,
    to: forwardPrimerSequence.length - 1,
    id: _.uniqueId(),
    gcContent: SequenceCalculations.gcContent(forwardPrimerSequence),
  };

  var reversePrimerSequence = SequenceTransforms.toReverseComplements(endStickyEnd) + reverseAnnealingRegionPrimerModel.sequence;
  // TODO change this to a reversePrimerModel
  var reversePrimer = {
    name: 'Reverse primer',
    sequence: reversePrimerSequence,
    from: pcrProductSequenceBases.length - 1,
    to: pcrProductSequenceBases.length - 1 - reversePrimerSequence.length,
    id: _.uniqueId(),
    gcContent: SequenceCalculations.gcContent(reversePrimerSequence),
  };

  var attributes = {
    id: _.uniqueId(),
    name: opts.name,
    // `from` and `to` refer to the parent sequence this PCR product came from
    from: opts.from,
    to: opts.to,
    sequence: pcrProductSequenceBases,
    forwardAnnealingRegionPrimerModel: forwardAnnealingRegionPrimerModel,
    reverseAnnealingRegionPrimerModel: reverseAnnealingRegionPrimerModel,
    forwardPrimer: forwardPrimer,
    reversePrimer: reversePrimer,
    stickyEnds: opts.stickyEnds,
    meltingTemperature: SequenceCalculations.meltingTemperature(pcrProductSequenceBases)
  };
  var features = calculateFeatures(attributes);
  attributes.features = features;
  var pcrProduct = new PcrProductModel(attributes);

  return pcrProduct;
};


var getSequencesToSearch = function(sequence, opts) {
  var sequenceBases = _.isString(sequence) ? sequence : sequence.get('sequence');
  opts = defaultPCRPrimerOptions(opts);

  _.defaults(opts, {
    from: 0,
    to: sequenceBases.length - 1
  });

  if(opts.to < opts.from) {
    throw "getPcrProductAndPrimers `opts.to` is smaller than `opts.from`";
  } else if((sequenceBases.length - opts.from) < opts.minPrimerLength) {
    throw "getPcrProductAndPrimers `opts.from` is too large to leave enough sequence length to find the primer";
  } else if (opts.to < opts.minPrimerLength) {
    throw "getPcrProductAndPrimers `opts.to` is too small to leave enough sequence length to find the primer";
  }

  var forwardSequenceToSearch = sequenceBases.substr(opts.from, opts.maxPrimerLength);
  var reverseSequenceToSearch = SequenceTransforms.toReverseComplements(sequenceBases);
  var to = sequenceBases.length - opts.to - 1;
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
 *                           sense/forward strand of the reverse primer
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
      var forwardAnnealingRegionPrimerModel = primerResults[0];
      var reverseAnnealingRegionPrimerModel = primerResults[1];
      var pcrProduct = calculatePcrProductFromPrimers(sequence, opts, forwardAnnealingRegionPrimerModel, reverseAnnealingRegionPrimerModel);
      resolve(pcrProduct);
    })
    .catch((e) => {
      console.error('getPcrProductAndPrimers err', e);
      reject(e);
    }).done();

  });

};


export {
  calculatePcrProductFromPrimers,
  getPcrProductAndPrimers,
  getSequencesToSearch
};

export default getPcrProductAndPrimers;
