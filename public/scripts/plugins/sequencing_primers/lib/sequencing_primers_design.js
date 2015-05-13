import {optimalPrimer4, getSequenceToSearch_PrimerHelper} from '../../pcr/lib/primer_calculation';
import _ from 'underscore.mixed';
import Q from 'q';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';
import Product from '../../pcr/lib/product';
import {findPrimers, universalPrimers} from './universal_primers';


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
 * @param  {Deferred} deferredAllPrimersAndProducts
 * @param  {Array} sequencingPrimers Array of `Primer`(s)
 * @return {Promise}
 */
var _getPrimersAndProducts = function(sequenceBases, options, sequencingPrimers, deferredAllPrimersAndProducts=undefined) {
  if(_.isUndefined(deferredAllPrimersAndProducts)) {
    deferredAllPrimersAndProducts = Q.defer();
  }
  var previousPrimer = sequencingPrimers[sequencingPrimers.length - 1];
  var sequenceLength = sequenceBases.length;
  var progress = previousPrimer.antisense ? (sequenceLength - previousPrimer.from - 1) : (previousPrimer.from + options.maxSearchSpace - 1);
  deferredAllPrimersAndProducts.notify(Math.max(progress, sequenceLength) / sequenceLength);

  if(!previousPrimer.validForParentSequence(sequenceLength)) {
    var msg = 'Previous Primer must be contained within sequence';
    console.error(msg);
    return Q.reject(msg);
  }

  // We must find the next sequencing primer within `usefulSearchSpace`, so that
  // it's garbage DNA is covered by the sequencing product produced from the
  // `previousPrimer`.
  var usefulSearchSpace = options.maxSearchSpace - GARBAGE_SEQUENCE_DNA;
  var basesSequenced = previousPrimer.antisense ?
    (sequenceLength - (previousPrimer.from - options.maxSearchSpace + 1)) :
    (previousPrimer.from + options.maxSearchSpace - 1);
  if(sequenceLength > basesSequenced) {
    var {frm, sequenceToSearch} = getSequenceToSearch_PrimerHelper(sequenceBases, options.minPrimerLength, usefulSearchSpace, previousPrimer);
    optimalPrimer4(sequenceToSearch, options)
    .then(function(nextPrimer) {
      if(previousPrimer.antisense) {
        nextPrimer.reverseDirection();
        nextPrimer.shift(frm + nextPrimer.length() - sequenceToSearch.length);
      } else {
        nextPrimer.shift(frm);
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
  return function(primer, index) {
    var direction = primer.antisense ? 'reverse' : 'forward';
    var productName = `Product ${index + 1} (${direction})`;

    // Modify primer
    primer.name = productName + ' - primer';

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
 * @param  {Prime}  firstPrimer
 * @param  {Object}  options=defaultSequencingPrimerOptions()
 * @return {Promise}
 */
var getPrimersAndProductsInOneDirection = function(sequenceBases, firstPrimer, options={}) {
  var sequencingPrimers = [firstPrimer];

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
var getAllPrimersAndProducts = function(sequenceBases, firstForwardPrimer, firstReversePrimer, options) {
  var promiseForwardPrimersAndProducts = getPrimersAndProductsInOneDirection(sequenceBases, firstForwardPrimer, options);
  return promiseForwardPrimersAndProducts
  .then(function(forwardProductsAndPrimers) {
    // Find all reverse products and primers.
    return getPrimersAndProductsInOneDirection(sequenceBases, firstReversePrimer, options)
    .then(function(reverseProductsAndPrimers) {
      return forwardProductsAndPrimers.concat(reverseProductsAndPrimers);
    });
  });
};


/**
 * @function getAllPrimersAndProductsHelper
 * @param  {String} sequenceBases
 * @param  {Object} options=defaultSequencingPrimerOptions()
 * @return {Object} With `promise` or `error` key.
 */
var getAllPrimersAndProductsHelper = function(sequenceBases, options={}) {
  var ret = {};
  var {forwardSequencePrimer, reverseSequencePrimer} = findPrimers(sequenceBases, universalPrimers());

  if(forwardSequencePrimer && reverseSequencePrimer) {
    ret.promise = getAllPrimersAndProducts(sequenceBases, forwardSequencePrimer, reverseSequencePrimer, options);
  } else {
    var msg = 'No ';
    if(!forwardSequencePrimer) msg += 'forward ';
    if(!forwardSequencePrimer && !reverseSequencePrimer) msg += 'or ';
    if(!reverseSequencePrimer) msg += 'reverse ';
    ret.error = msg + 'universal primer found.';
  }
  return ret;
};


export default {
  getAllPrimersAndProducts,
  getAllPrimersAndProductsHelper,
};
