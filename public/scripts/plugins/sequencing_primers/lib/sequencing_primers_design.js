import {optimalPrimer4} from '../../pcr/lib/primer_calculation';
import _ from 'underscore.mixed';
import Q from 'q';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';
import Product from './product';
import SequenceRange from '../../../library/sequence-model/range';
import {findUniversalPrimersHelper} from './universal_primers';
import errors from './errors';


var getLength = function(sequenceModel) {
  return sequenceModel.getLength(sequenceModel.STICKY_END_FULL);
};


/**
 * @function _getPrimers
 * @param  {SequenceModel} sequenceModel
 * @param  {Object} options
 * @param  {Array} sequencingPrimers  Array of `Primer`(s)
 * @param  {Deferred} deferredAllPrimers
 * @return {Promise}
 */
var _getPrimers = function(sequenceModel, options, sequencingPrimers, deferredAllPrimers=Q.defer()) {
  var sequenceLength = getLength(sequenceModel);
  var previousPrimer = sequencingPrimers[sequencingPrimers.length - 1];
  var basesSequenced = 0;
  var frm = 0;
  var maxSearchSpace;
  if(!previousPrimer) {
    // For the first forward primer, we want to find the primer as close to the
    // start as possible (rather than as far from the start as possible like
    // normal).
    // For the first reverse primer, we take a reverse complement of the
    // sequence and therefore also want to start the search from the start so as
    // to then find the first reverse primer as close as possible to the end of
    // the sequence (the start of the reversed sequence).
    options.findFrom3PrimeEnd = false;
    maxSearchSpace = options.maxSequencedSize * 3; // technically this could be sequenceLength;
  } else {
    options.findFrom3PrimeEnd = true;
    if(options.findOnReverseStrand) {
      frm = sequenceLength - previousPrimer.range.from;
    } else {
      frm = previousPrimer.range.to;
    }
    basesSequenced = frm + options.maxSequencedSize;
    // We must find the next sequencing primer within `maxSearchSpace`, so that
    // its garbage DNA is covered by the sequencing product produced from the
    // `previousPrimer`.
    //
    //      |----------------- maxSequencedSize ---------------|
    //
    // ---->xxxxxxxNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNxxxxxxxx...
    //                                              ---->xxxxxxxNNNNNNNN...
    //
    // Legend:
    // ---->  Primer
    // xxxxx  Garbage DNA from sequencing  `garbageSequenceDna`
    // NNNNN  Usefully sequenced DNA
    //
    maxSearchSpace = options.maxSequencedSize - options.garbageSequenceDna;
  }
  deferredAllPrimers.notify(Math.min(basesSequenced, sequenceLength) / sequenceLength);

  if(sequenceLength > basesSequenced) {
    var sequenceOptions = {
      from: frm,
      maxSearchSpace: maxSearchSpace,
      findOnReverseStrand: options.findOnReverseStrand,
    };
    optimalPrimer4(sequenceModel, sequenceOptions, options)
    .then(function(nextPrimer) {
      sequencingPrimers.push(nextPrimer);
      _getPrimers(sequenceModel, options, sequencingPrimers, deferredAllPrimers);
    })
    .catch(deferredAllPrimers.reject)
    .done();
  } else {
    deferredAllPrimers.resolve(sequencingPrimers);
  }

  return deferredAllPrimers.promise;
};


/**
 * @function getPrimersInOneDirection
 * @param  {SequenceModel}  sequenceModel
 * @param  {Prime}  firstPrimer (optional)
 * @param  {Object}  options=defaultSequencingPrimerOptions()  With `findOnReverseStrand` set to true or false
 * @return {Promise}
 */
var getPrimersInOneDirection = function(sequenceModel, firstPrimer, options={}) {
  var sequencingPrimers = [];
  if(firstPrimer) {
    sequencingPrimers.push(firstPrimer);
  }

  options = _.deepClone(options);
  options = defaultSequencingPrimerOptions(options);

  return _getPrimers(sequenceModel, options, sequencingPrimers);
};


/**
 * @function calculateProductAndPrimer
 * Has side effect of modifying the primer's name as well.
 *
 * @param  {Integer} sequenceLength
 * @param  {Integer} maxSequencedSize
 * @return {Function}   Has the following signature:
 *                      * @param  {Primer} primer
 *                      * @param  {Integer} index
 *                      * @return {Product}
 */
var calculateProductAndPrimer = function(sequenceLength, maxSequencedSize) {
  var hasForwardUniversalPrimer = false;
  return function(primer, index) {

    if(index === 0) hasForwardUniversalPrimer = false;
    var productName;
    if(/universal/.test(primer.name)) {
      if(primer.range.reverse) {
        productName = 'Rvs Cap';
      } else {
        productName = 'Fwd Anchor';
        hasForwardUniversalPrimer = true;
      }
    } else  {
      productName = `${primer.range.reverse ? 'Rvs' : 'Fwd'}-${hasForwardUniversalPrimer ? index : index + 1}`;
    }

    // Modify primer
    primer.name = productName + ' primer';

    // Calculate product
    var productFrom;
    var productSize;
    if(primer.range.reverse) {
      productFrom = Math.max(0, primer.range.to - maxSequencedSize);
      productSize = primer.range.to - productFrom;
    } else {
      productFrom = primer.range.from;
      productSize = Math.min(maxSequencedSize, sequenceLength - primer.range.from);
    }
    var product = new Product({
      parentSequence: primer.parentSequence,
      name: productName,
      range: new SequenceRange({
        from: productFrom,
        size: productSize,
        reverse: primer.range.reverse,
      }),
      primer: primer,
    });
    return product;
  };
};


/**
 * @function getAllPrimersAndProducts
 * @param  {SequenceModel} sequenceModel
 * @param  {Primer} firstForwardPrimer=undefined  The first primer in the
 *                                                sequence, usually a
 *                                                pre-calculated universal
 *                                                primer.
 * @param  {Primer} firstReversePrimer=undefined  The reverse primer in the
 *                                                sequence, usually a
 *                                                pre-calculated universal
 *                                                primer.
 * @param  {Object} options=defaultSequencingPrimerOptions()
 * @return {Promise}
 */
var getAllPrimersAndProducts = function(sequenceModel, firstForwardPrimer=undefined, firstReversePrimer=undefined, options={}) {
  options = defaultSequencingPrimerOptions(options);
  var forwardOptions = _.clone(options);
  forwardOptions.findOnReverseStrand = false;
  var reverseOptions = _.clone(options);
  reverseOptions.findOnReverseStrand = true;

  var promiseForwardPrimersAndProducts = getPrimersInOneDirection(sequenceModel, firstForwardPrimer, forwardOptions);
  return promiseForwardPrimersAndProducts
  .then(function(forwardPrimers) {
    // Find all reverse products and primers.
    return getPrimersInOneDirection(sequenceModel, firstReversePrimer, reverseOptions)
    .then(function(reversePrimers) {
      // Convert all forward and reverser primers into products containing the
      // primers.
      let len = getLength(sequenceModel);
      let makeProducts = calculateProductAndPrimer(len, options.maxSequencedSize);
      let forwardProductsAndPrimers = _.map(forwardPrimers, makeProducts);
      let reverseProductsAndPrimers = _.map(reversePrimers, makeProducts);
      return forwardProductsAndPrimers.concat(reverseProductsAndPrimers);
    });
  });
};


/**
 * @function getAllPrimersAndProductsHelper
 * @param  {SequenceModel} sequenceModel
 * @param  {Object} options=defaultSequencingPrimerOptions()
 * @return {Promise}  Will resolve with products, rejected with an error object, notify with a string or
 */
var getAllPrimersAndProductsHelper = function(sequenceModel, options={}) {
  options = defaultSequencingPrimerOptions(options);
  var {forwardSequencePrimer, reverseSequencePrimer} = findUniversalPrimersHelper(sequenceModel);
  return Q.promise(function(resolve, reject, notify) {
    // Because we can't rely on notifications getting through, and the `_.delay`
    // is a still an unrealiable hack, we store notifications and append to
    // an error if one occurs.
    var notifications = {};
    var rejectWithNotifications = function(error) {
      if(!error.data) error.data = {};
      if(error.data.notifications) throw new Error('Already have notifications on error.');
      error.data.notifications = notifications;
      reject(error);
    };

    _.delay(function() {
      var warning;
      if(!forwardSequencePrimer) {
        warning = new errors.UniversalForwardPrimerNotFound({
          message: 'No forward universal primer found.',
          data: {level: 'warn'},
        });
        notify(warning);
        notifications.universalForwardPrimerNotFound = warning;
      }
      if(!reverseSequencePrimer) {
        warning = new errors.UniversalReversePrimerNotFound({
          message: 'No reverse universal primer found.',
          data: {level: 'warn'},
        });
        notify(warning);
        notifications.universalReversePrimerNotFound = warning;
      }

      getAllPrimersAndProducts(sequenceModel, forwardSequencePrimer, reverseSequencePrimer, options)
      .progress(notify)
      .catch(rejectWithNotifications)
      .then(function(sequencingProductsAndPrimers) {
        var firstForwardSequenceProduct = _.find(sequencingProductsAndPrimers, (product) => !product.range.reverse);
        var firstReverseSequenceProduct = _.find(sequencingProductsAndPrimers, (product) => product.range.reverse);
        var firstForwardSequencePrimer = firstForwardSequenceProduct && firstForwardSequenceProduct.primer;
        var firstReverseSequencePrimer = firstReverseSequenceProduct && firstReverseSequenceProduct.primer;

        // Check the primers will not result in any stretch of DNA being
        // left unsequenced.
        var pReverseFrom = (firstReverseSequencePrimer && firstReverseSequencePrimer.range.from) || 0;
        var pForwardTo = (firstForwardSequencePrimer && firstForwardSequencePrimer.range.to) || getLength(sequenceModel);
        var overlappingSequencedBases = pReverseFrom - pForwardTo - options.garbageSequenceDna;
        if(overlappingSequencedBases >= 0) {
          resolve(sequencingProductsAndPrimers);
        } else {
          rejectWithNotifications(new errors.DnaLeftUnsequenced({
            message: 'Primers result in some DNA being left unsequenced.',
            data: {
              sequencingProductsAndPrimers,
              noForwardPrimers: !firstForwardSequencePrimer,
              noReversePrimers: !firstReverseSequencePrimer,
              overlappingSequencedBases,
            },
          }));
        }
      })
      .done();
    }, 25);
  });

};


export default {
  getAllPrimersAndProducts,
  getAllPrimersAndProductsHelper,
};
