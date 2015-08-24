import _ from 'underscore';
import {optimalPrimer4} from './primer_calculation';
import PcrProductSequence from './product';
import {defaultPCRPrimerOptions} from './primer_defaults';
import Q from 'q';


var stickyEndFormat = PcrProductSequence.STICKY_END_FULL;


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


/**
 * getPcrPrimerAnnealingRegions
 * Finds the sequences necessary for creating PCR primers to extract a ROI from
 * a sequence.
 *
 * @param  {SequenceModel} sequenceModel Sequence model instance which can
 *                                       have stickyEnds.
 * @param  {Object} opts  Will default to values in `defaultPCRPrimerOptions`
 *         Must contain `opts.primerAnnealingFrm` and `opts.primerAnnealingTo`.
 *         `opts.primerAnnealingFrm` and `opts.primerAnnealingTo` specify the start and the end of the ROI
 *           (Region of interest, the desired sequence).
 *         `frm` specifies the start of the forward primer sequence.
 *         `frm` is INclusive.
 *         `to` specifies the start of the reverse primer sequence.
 *         `to` is EXclusive.
 *         `frm` and `to` are 0 indexed relative to start of the forward strand.
 * @return {Promise}  resolves with forwardAnnealingRegion and reverseAnnealingRegion
 */
var getPcrPrimerAnnealingRegions = function(sequenceModel, opts) {
  opts = defaultPCRPrimerOptions(opts);
  var primerAnnealingFrm = opts.primerAnnealingFrm;
  var primerAnnealingTo = opts.primerAnnealingTo;
  delete opts.primerAnnealingFrm;
  delete opts.primerAnnealingTo;

  var valid = _.isInteger(primerAnnealingTo) && _.isInteger(primerAnnealingFrm);
  if(!valid) return Q.reject('Must specify `opts.primerAnnealingFrm` and `opts.primerAnnealingTo`');
  valid = primerAnnealingFrm <= primerAnnealingTo;
  if(!valid) return Q.reject('`opts.primerAnnealingFrm` must be <= `opts.primerAnnealingTo`');

  var maxSearchSpace = primerAnnealingTo - primerAnnealingFrm;
  var forwardSequenceOptions = {
    frm: primerAnnealingFrm,
    maxSearchSpace: maxSearchSpace,
  };
  var len = sequenceModel.getLength(stickyEndFormat);
  var reverseSequenceOptions = {
    frm: len - primerAnnealingTo,
    maxSearchSpace: maxSearchSpace,
    findOnReverseStrand: true,
  };

  var forwardPrimerPromise = optimalPrimer4(sequenceModel, forwardSequenceOptions, opts);
  var reversePrimerPromise = optimalPrimer4(sequenceModel, reverseSequenceOptions, opts);

  // Progress monitoring
  var initTotal = opts.maxPrimerLength - opts.minPrimerLength + 1;
  var progressReports = [
    {current: 0, total: initTotal, isFallback: false},
    {current: 0, total: initTotal, isFallback: false}
  ];
  var fallbackProgressReports = [
    {current: 0, total: initTotal, isFallback: true},
    {current: 0, total: initTotal, isFallback: true}
  ];

  return Q.promise(function(resolve, reject, notify) {
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
      var [forwardAnnealingRegion, reverseAnnealingRegion] = primerResults;
      resolve([forwardAnnealingRegion, reverseAnnealingRegion]);
    })
    .catch((e) => {
      // console.error('getPcrPrimerAnnealingRegions err', e);
      reject(e);
    })
    .done();
  });
};


var calculateFeatures = function(pcrProductModel) {
  var forwardPrimer = pcrProductModel.get('forwardPrimer');
  var reversePrimer = pcrProductModel.get('reversePrimer');
  var features = [
  {
    _type: 'misc',
    name: pcrProductModel.get('shortName'),
    desc: '',
    ranges: [{
      from: 0,
      to: pcrProductModel.getLength(stickyEndFormat) - 1
    }]
  },
  {
    _type: 'annealing_region',
    name: 'Annealing region',
    ranges: [{
      from: forwardPrimer.annealingRegion.range.from,
      to: forwardPrimer.annealingRegion.range.to - 1,
    }]
  },
  {
    _type: 'annealing_region',
    name: 'Annealing region',
    ranges: [{
      from: reversePrimer.annealingRegion.range.to - 1,
      to: reversePrimer.annealingRegion.range.from - 2,
    }]
  },
  {
    _type: 'primer',
    name: forwardPrimer.name,
    ranges: [{
      from: forwardPrimer.range.from,
      to: forwardPrimer.range.to - 1,
    }]
  },
  {
    _type: 'primer',
    name: reversePrimer.name,
    ranges: [{
      from: reversePrimer.range.to - 1,
      to: reversePrimer.range.from - 2,
    }]
  }
  ];

  if(pcrProductModel.getStickyEnds(false)) {
    var stickyEnds = pcrProductModel.getStickyEnds(true);
    var sequenceNts = pcrProductModel.getSequence(stickyEndFormat);
    features = [{
      name: stickyEnds.start.name + ' end',
      _type: 'sticky_end',
      ranges: [{
        from: 0,
        to: stickyEnds.start.sequence.length-1
      }]
    },
    {
      name: stickyEnds.end.name + ' end',
      _type: 'sticky_end',
      ranges: [{
        from: sequenceNts.length - 1,
        to: sequenceNts.length - stickyEnds.end.sequence.length - 2,
      }]
    }];
  }


  return features;
};

/**
 * @function preparePcrPrimerAttributesFromAnnealingPrimer
 * @param  {Primer}  annealingPrimer
 * @param  {number}  len
 * @return {array}  Index 0 contains forwardPcrPrimer attributes object
 *                  Index 1 contains reversePcrPrimer attributes object
 */
var preparePcrPrimerAttributesFromAnnealingPrimer = function(annealingPrimer, len) {
  var isForward = !annealingPrimer.range.reverse;
  var name = (isForward ? 'Forward' : 'Reverse') + ' primer';
  annealingPrimer.name = name + ' - Annealing Region';
  var frm;
  var size;
  if(isForward) {
    frm = 0;
    size = annealingPrimer.range.from + annealingPrimer.range.size;
  } else {
    size = len - annealingPrimer.range.from;
    frm = annealingPrimer.range.from;
  }
  return {
    version: 1,
    name,
    range: {
      from: frm,
      size,
      reverse: !isForward,
    },
    // Call toJSON so that the parentSequence is cleared and then set correctly.
    annealingRegion: annealingPrimer.toJSON(),
  };
};


/**
 * @function calculatePcrProduct
 * function extracted to aid testing.
 * @param  {SequenceModel} sequenceModel
 * @param  {PrimerModel}  forwardAnnealingRegion
 * @param  {PrimerModel}  reverseAnnealingRegion
 * @param  {boolean}  prependBases
 * @return {PcrProductSequence}
 */
var calculatePcrProduct = function(sequenceModel, forwardAnnealingRegion, reverseAnnealingRegion, prependBases=false) {
  var attributes = sequenceModel.toJSON();

  var regionOfInterestFrm = forwardAnnealingRegion.range.from;
  var regionOfInterestTo = reverseAnnealingRegion.range.to;
  if(prependBases) {
    regionOfInterestFrm = 0;
    regionOfInterestTo = sequenceModel.getLength(stickyEndFormat);
  }
  var len = regionOfInterestTo - regionOfInterestFrm;
  var pcrProductSequence = sequenceModel.getSubSeq(regionOfInterestFrm, regionOfInterestTo - 1, stickyEndFormat);

  if(!prependBases) {
    var val = forwardAnnealingRegion.range.from;
    forwardAnnealingRegion.range.from -= val;
    reverseAnnealingRegion.range.from -= val;
  }
  var forwardPrimerAttributes = preparePcrPrimerAttributesFromAnnealingPrimer(forwardAnnealingRegion, len);
  var reversePrimerAttributes = preparePcrPrimerAttributesFromAnnealingPrimer(reverseAnnealingRegion, len);

  _.extend(attributes, {
    version: 1,
    sequence: pcrProductSequence,
    forwardPrimer: forwardPrimerAttributes,
    reversePrimer: reversePrimerAttributes,
    features: [],
  });

  var pcrProduct = new PcrProductSequence(attributes);
  pcrProduct.set('features', calculateFeatures(pcrProduct));
  return pcrProduct;
};


/**
 * @function getPcrProductAndPrimers
 * @param  {SequenceModel} sequenceModel Sequence model instance can have
 *                                       stickyEnds.
 * @param  {Object} opts  Same as `getPcrPrimerAnnealingRegions`, additionally:
 *         `opts.prependBases`  is true, the bases before `opts.primerAnnealingFrm`
 *         and "after" `opts.primerAnnealingTo` are included in the final
 *         primers from the sequence once the annealingRegions of the primers
 *         have been found.
 * @return {Promise}  Resolves with an instance of PcrProductSequence.
 */
var getPcrProductAndPrimers = function(sequenceModel, opts) {
  opts = defaultPCRPrimerOptions(opts);
  if(opts.prependBases) {
    if(opts.findFrom3PrimeEnd) {
      return Q.reject('opts.findFrom3PrimeEnd can not be true for getPcrProductAndPrimers when opts.prependBases is true');
    }
    if(opts.allowShift) {
      return Q.reject('opts.allowShift can not be true for getPcrProductAndPrimers when opts.prependBases is true');
    }
  }

  return getPcrPrimerAnnealingRegions(sequenceModel, opts)
  .then(function(annealingRegions) {
    var [forwardAnnealingRegion, reverseAnnealingRegion] = annealingRegions;
    var pcrProduct = calculatePcrProduct(sequenceModel, forwardAnnealingRegion, reverseAnnealingRegion, opts.prependBases);
    return pcrProduct;
  });
};


export {
  getPcrPrimerAnnealingRegions,
  getPcrProductAndPrimers,
  // Exported for testing
  calculatePcrProduct,
};
