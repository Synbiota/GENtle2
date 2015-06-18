import _ from 'underscore';
import {optimalPrimer4} from './primer_calculation';
import PcrProductSequence from './product';
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


var calculateFeaturesLegacy = function(pcrProductModel) {
  var features = [];
  let stickyEnds = pcrProductModel.getStickyEnds();

  if(stickyEnds) {
    let sequenceNts = pcrProductModel.getSequence(pcrProductModel.STICKY_END_FULL);
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

  let forwardPrimer = pcrProductModel.get('forwardPrimer');
  let reversePrimer = pcrProductModel.get('reversePrimer');

  features = features.concat([
  {
    name: 'Annealing region',
    _type: 'annealing_region',
    ranges: [{
      from: forwardPrimer.annealingRegion.range.from,
      to: forwardPrimer.annealingRegion.range.to - 1,
    }]
  },
  {
    name: 'Annealing region',
    _type: 'annealing_region',
    ranges: [{
      from: reversePrimer.annealingRegion.range.to - 1,
      to: reversePrimer.annealingRegion.range.from - 2,
    }]
  },
  {
    name: forwardPrimer.name,
    _type: 'primer',
    ranges: [{
      from: forwardPrimer.range.from,
      to: forwardPrimer.range.to - 1,
    }]
  },
  {
    name: reversePrimer.name,
    _type: 'primer',
    ranges: [{
      from: reversePrimer.range.to - 1,
      to: reversePrimer.range.from - 2,
    }]
  }
  ]);
  return features;
};

var calculateFeatures = function(pcrProductModel) {
  var features = [];
  let stickyEnds = pcrProductModel.getStickyEnds();

  if(stickyEnds) {
    let sequenceNts = pcrProductModel.getSequence(pcrProductModel.STICKY_END_FULL);
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

  features.push({
    _type: 'misc',
    name: pcrProductModel.get('shortName'),
    desc: '',
    ranges: [{
      from: 0,
      to: pcrProductModel.getLength(pcrProductModel.STICKY_END_FULL) - 1
    }]
  });

  return features;
};


let preparePcrPrimerAttributesFromAnnealingPrimer = function(annealingPrimer, startStickyEnd, endStickyEnd, pcrProductSequence) {
  let isForward = !annealingPrimer.range.reverse;
  let name = (isForward ? 'Forward' : 'Reverse') + ' primer';
  let annealingFrom;
  let annealingSize;
  let frm = 0;
  let size;
  if(isForward) {
    annealingSize = annealingPrimer.getLength();
    size = startStickyEnd.length + annealingSize;
    annealingFrom = startStickyEnd.length;
  } else {
    annealingSize = annealingPrimer.getLength();
    size = endStickyEnd.length + annealingSize;
    frm = annealingFrom = pcrProductSequence.length - size;
  }
  return {
    version: 1,
    name: name,
    range: {
      from: frm,
      size: size,
      reverse: !isForward,
    },
    annealingRegion: {
      version: 1,
      name: name + ' - Annealing Region',
      meltingTemperature: annealingPrimer.meltingTemperature,
      gcContent: annealingPrimer.gcContent,
      range: {
        from: annealingFrom,
        size: annealingSize,
        reverse: !isForward,
      }
    },
  };
};


/**
 * @function calculatePcrProductFromPrimers
 * function extracted to aid testing.
 *
 * @param  {SequenceModel}  sequenceModel
 * @param  {Object}  opts must contain `name`, `from`, `to`, `stickyEnds`
 * @param  {PrimerModel}  forwardAnnealingRegion
 * @param  {PrimerModel}  reverseAnnealingRegion
 * @return {PcrProductSequence}
 */
var calculatePcrProductFromPrimers = function(sequenceModel, opts, forwardAnnealingRegion, reverseAnnealingRegion) {
  opts = _.pick(opts, ['name', 'from', 'to', 'stickyEnds', 'partType', 'shortName', 'rdpEdits', 'sourceSequenceName']);

  var regionOfInterest = sequenceModel.getSubSeq(opts.from, opts.to, sequenceModel.STICKY_END_FULL);
  var startStickyEnd = opts.stickyEnds && opts.stickyEnds.start && opts.stickyEnds.start.sequence || '';
  var endStickyEnd = opts.stickyEnds && opts.stickyEnds.end && opts.stickyEnds.end.sequence || '';

  var shortName = opts.shortName || opts.name;
  if(startStickyEnd) {
    shortName = opts.stickyEnds.start.name + '-' + shortName;
  }
  if(endStickyEnd) {
    shortName = shortName + '-' + opts.stickyEnds.end.name;
  }

  var pcrProductSequence = startStickyEnd + regionOfInterest + endStickyEnd;
  var forwardPrimer = preparePcrPrimerAttributesFromAnnealingPrimer(forwardAnnealingRegion, startStickyEnd, endStickyEnd, pcrProductSequence);
  var reversePrimer = preparePcrPrimerAttributesFromAnnealingPrimer(reverseAnnealingRegion, startStickyEnd, endStickyEnd, pcrProductSequence);

  var pcrProduct = new PcrProductSequence({
    version: 1,
    name: opts.name,
    sequence: pcrProductSequence,
    forwardPrimer: forwardPrimer,
    reversePrimer: reversePrimer,
    stickyEnds: opts.stickyEnds,
    partType: opts.partType,
    shortName: shortName,
    rdpEdits: opts.rdpEdits || [],
    sourceSequenceName: opts.sourceSequenceName
  });
  pcrProduct.set('features', calculateFeatures(pcrProduct));
  pcrProduct.set('meta.pcr.options', opts);
  return pcrProduct;
};


/**
 * getPcrProductAndPrimers
 * Finds the sequences necessary for creating PCR primers to extract a ROI from
 * a sequence and postprocess to append any stickyEnds requested.
 *
 * @param  {SequenceModel} sequenceModel
 * @param  {Object} opts  opts.from and opts.to specify the start and the end
 *                        of the ROI (Region of interest, the desired sequence).
 *                        They are inclusive.  (`to` is NOT exclusive).
 *                        They are 0 indexed relative to start of the forward
 *                        strand, including the StickyEnds (TODO: check this).
 *
 *                        (`from` specifies the start of the forward
 *                         primer sequence
 *                         `to` specifies the start of the reverse primer
 *                         sequence).
 *                        `opts.stickyEnds` contains nothing or stickyEnds
 *                        selected from a set list.  Will be of the form:
 *                            {
 *                              start: {
 *                                sequence: 'GGTCTCAGATG',
 *                                reverse: false,
 *                                offset: 7,
 *                                size: 4,
 *                                name: "X",
 *                              },
 *                              end: {
 *                                sequence: 'CGGCTGAGACC',
 *                                reverse: true,
 *                                offset: 7,
 *                                size: 4,
 *                                name: "Z'",
 *                              }
 *                            }
 *
 * @return {Promise}       resolves with a hash containing pcrProduct attributes
 */
var getPcrProductAndPrimers = function(sequenceModel, opts) {
  let valid = (_.isNumber(opts.to)   && (!_.isNaN(opts.to)) &&
               _.isNumber(opts.from) && (!_.isNaN(opts.from)));
  if(!valid) { return Q.reject('Must specify `opts.from` and `opts.to`'); }
  valid = opts.from <= opts.to;
  if(!valid) { return Q.reject('`from` must be <= `to`'); }
  opts = defaultPCRPrimerOptions(opts);

  let maxSearchSpace = opts.to + 1 - opts.from;
  let forwardSequenceOptions = {
    from: opts.from,  // TODO check if `opts.from` includes the sticky ends or not.
    maxSearchSpace: maxSearchSpace,
  };
  let len = sequenceModel.getLength(sequenceModel.STICKY_END_FULL);
  let reverseSequenceOptions = {
    from: len - opts.to - 1,  // TODO check if `opts.to` includes the sticky ends or not.
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
      console.log('then calculatePcrProductFromPrimers opts', opts)
      var pcrProduct = calculatePcrProductFromPrimers(sequenceModel, opts, forwardAnnealingRegion, reverseAnnealingRegion);
      pcrProduct.set('meta.pcr.options', opts);
      resolve(pcrProduct);
    })
    .catch((e) => {
      // console.error('getPcrProductAndPrimers err', e);
      reject(e);
    })
    .done();

  });

};


export {
  calculatePcrProductFromPrimers,
  getPcrProductAndPrimers,
};
