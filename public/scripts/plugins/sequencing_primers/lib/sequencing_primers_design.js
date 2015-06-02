import {optimalPrimer4, getSequenceToSearch} from '../../pcr/lib/primer_calculation';
import _ from 'underscore.mixed';
import Q from 'q';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';
import Product from '../../pcr/lib/product';
import {findPrimers, universalPrimers} from './universal_primers';
import errors from './errors';


// The number of bases after the end of a sequencing primer which are
// garbage (due to current limitations in Sanger sequencing techniques).
var GARBAGE_SEQUENCE_DNA = 80;
// Maximum size of DNA sequence that will become a useful product.
// This is only relevant for the products produced by sequencing primers.
var MAX_DNA_CHUNK_SIZE = defaultSequencingPrimerOptions().maxSearchSpace;


/**
 * @function _getPrimersAndProducts
 * @param  {String} sequenceBases
 * @param  {Object} options
 * @param  {Array} sequencingPrimers  Array of `Primer`(s)
 * @param  {Deferred} deferredAllPrimersAndProducts
 * @return {Promise}
 */
var _getPrimersAndProducts = function(sequenceBases, options, sequencingPrimers, deferredAllPrimersAndProducts=Q.defer()) {
  var sequenceLength = sequenceBases.length;
  var previousPrimer = sequencingPrimers[sequencingPrimers.length - 1];
  var progress = 0;
  var basesSequenced = 0;
  var correctedFrom;
  var originalFindFrom3PrimeEnd;
  if(!previousPrimer) {
    // TODO this code smells, perhaps this function should always be able to expect a
    // first primer
    if(options.findOnReverseStrand) {
      correctedFrom = sequenceLength - 1;
    } else {
      correctedFrom = 0;
      originalFindFrom3PrimeEnd = options.findFrom3PrimeEnd;
      options.findFrom3PrimeEnd = false;
    }
  } else {
    if(options.findOnReverseStrand) {
      progress = sequenceLength - previousPrimer.from - 1;
      basesSequenced = sequenceLength - (previousPrimer.from - options.maxSearchSpace + 1);
      correctedFrom = previousPrimer.to;
    } else {
      progress = previousPrimer.from + options.maxSearchSpace - 1;
      basesSequenced = previousPrimer.from + options.maxSearchSpace - 1;
      correctedFrom = previousPrimer.to + 1;
    }
  }
  deferredAllPrimersAndProducts.notify(Math.max(progress, sequenceLength) / sequenceLength);

  if(sequenceLength > basesSequenced) {
    // We must find the next sequencing primer within `usefulSearchSpace`, so that
    // it's garbage DNA is covered by the sequencing product produced from the
    // `previousPrimer`.
    var usefulSearchSpace = options.maxSearchSpace - GARBAGE_SEQUENCE_DNA;
    var {frm, sequenceToSearch} = getSequenceToSearch(sequenceBases, options.minPrimerLength, usefulSearchSpace, options.findOnReverseStrand, correctedFrom);
    optimalPrimer4(sequenceToSearch, options)
    .then(function(nextPrimer) {
      if(options.findOnReverseStrand) {
        nextPrimer.reverseDirection();
        nextPrimer.shift(frm + nextPrimer.length() - sequenceToSearch.length);
      } else {
        nextPrimer.shift(frm);
        if(!previousPrimer) options.findFrom3PrimeEnd = originalFindFrom3PrimeEnd;
      }
      sequencingPrimers.push(nextPrimer);
      _getPrimersAndProducts(sequenceBases, options, sequencingPrimers, deferredAllPrimersAndProducts);
    });
  } else {
    var sequencingProductsAndPrimers = _.map(sequencingPrimers, calculateProductAndPrimer(sequenceLength));
    deferredAllPrimersAndProducts.resolve(sequencingProductsAndPrimers);
  }

  return deferredAllPrimersAndProducts.promise;
};


/**
 * @function calculateProductAndPrimer
 * Has side effect of modifying the primer's name as well.
 *
 * @param  {Int} sequenceLength
 * @param  {Primer} primer
 * @param  {Int} index
 * @return {Product}
 */
var calculateProductAndPrimer = function(sequenceLength) {
  var hasForwardUniversalPrimer = false;
  return function(primer, index) {
    if(index === 0) hasForwardUniversalPrimer = false;
    var productName;
    if(/universal/.test(primer.name)) {
      if(primer.antisense) {
        productName = 'U-rvs';
      } else {
        productName = 'U-fwd';
        hasForwardUniversalPrimer = true;
      }
    } else  {
      productName = `${primer.antisense ? 'Rvs' : 'Fwd'}-${hasForwardUniversalPrimer ? index : index + 1}`
    }

    // Modify primer
    primer.name = productName + ' primer';

    // Calculate product
    var subSequenceLength = primer.antisense ? (primer.from + 1) : (sequenceLength - primer.from);
    var productLength = Math.min(subSequenceLength, MAX_DNA_CHUNK_SIZE);
    var productTo = primer.antisense ? (primer.from - productLength) : (primer.from + productLength - 1);
    var product = new Product({
      name: productName,
      from: primer.from,
      to: productTo,
      primer: primer,
      antisense: primer.antisense
    });
    return product;
  };
};


/**
 * @function getPrimersAndProductsInOneDirection
 * @param  {String}  sequenceBases
 * @param  {Prime}  firstPrimer (optional)
 * @param  {Object}  options=defaultSequencingPrimerOptions()  With `findOnReverseStrand` set to true or false
 * @return {Promise}
 */
var getPrimersAndProductsInOneDirection = function(sequenceBases, firstPrimer, options={}) {
  var sequencingPrimers = [];
  if(firstPrimer) {
    sequencingPrimers.push(firstPrimer);
    if(!firstPrimer.validForParentSequence(sequenceBases.length)) {
      var msg = 'Primer must be contained within sequence';
      console.error(msg, firstPrimer);
      return Q.reject(msg);
    }
  }

  options = _.deepClone(options);
  options = defaultSequencingPrimerOptions(options);

  return _getPrimersAndProducts(sequenceBases, options, sequencingPrimers);
};


/**
 * @function getAllPrimersAndProducts
 * @param  {String} sequenceBases
 * @param  {Primer} firstForwardPrimer  The first primer in the sequence,
 *                                      usually a pre-calculated universal primer.
 * @param  {Primer} firstReversePrimer  The reverse primer in the sequence,
 *                                      usually a pre-calculated universal primer.
 * @param  {Object} options=defaultSequencingPrimerOptions()
 * @return {Promise}
 */
var getAllPrimersAndProducts = function(sequenceBases, firstForwardPrimer, firstReversePrimer, options={}) {
  var forwardOptions = _.clone(options);
  forwardOptions.findOnReverseStrand = false;
  var reverseOptions = _.clone(options);
  reverseOptions.findOnReverseStrand = true;

  var promiseForwardPrimersAndProducts = getPrimersAndProductsInOneDirection(sequenceBases, firstForwardPrimer, forwardOptions);
  return promiseForwardPrimersAndProducts
  .then(function(forwardProductsAndPrimers) {
    // Find all reverse products and primers.
    return getPrimersAndProductsInOneDirection(sequenceBases, firstReversePrimer, reverseOptions)
    .then(function(reverseProductsAndPrimers) {
      return forwardProductsAndPrimers.concat(reverseProductsAndPrimers);
    });
  });
};


/**
 * @function getAllPrimersAndProductsHelper
 * @param  {String} sequenceBases
 * @param  {Object} options=defaultSequencingPrimerOptions()
 * @return {Promise}  Will resolve with products, rejected with an error object, notify with a string or
 */
var getAllPrimersAndProductsHelper = function(sequenceBases, options={}) {
  var {forwardSequencePrimer, reverseSequencePrimer} = findPrimers(sequenceBases, universalPrimers());

  return Q.promise(function(resolve, reject, notify) {
    // We delay to allow the early calls to notify to get through.
    _.delay(function() {
      if(!forwardSequencePrimer) {
        notify({
          message: 'No forward universal primer found.',
          level: 'warn',
          error: errors.UNIVERSAL_FORWARD_PRIMER_NOT_FOUND,
        });
      }
      if(!reverseSequencePrimer) {
        notify({
          message: 'No reverse universal primer found.',
          level: 'warn',
          error: errors.UNIVERSAL_REVERSE_PRIMER_NOT_FOUND,
        });
      }

      getAllPrimersAndProducts(sequenceBases, forwardSequencePrimer, reverseSequencePrimer, options)
      .progress(notify)
      .catch(reject)
      .then(function(sequencingProductsAndPrimers) {
        var firstForwardSequencePrimer = _.find(sequencingProductsAndPrimers, (product) => !product.antisense).primer;
        var firstReverseSequencePrimer = _.find(sequencingProductsAndPrimers, (product) => product.antisense).primer;

        // Check the primers will not result in any stretch of DNA being
        // left unsequenced.
        var overlappingSequencedBases = (firstReverseSequencePrimer.to + 1) - (firstForwardSequencePrimer.to + GARBAGE_SEQUENCE_DNA);
        if(overlappingSequencedBases >= 0) {
          resolve(sequencingProductsAndPrimers);
        } else {
          reject({
            message: 'Forward and reverse primers found but they result in some DNA being left unsequenced.',
            data: {overlappingSequencedBases},
            error: errors.DNA_LEFT_UNSEQUENCED,
          });
        }
      })
      .done();
    }, 25);
  });

};


export default {
  getAllPrimersAndProducts,
  getAllPrimersAndProductsHelper,
  GARBAGE_SEQUENCE_DNA
};
