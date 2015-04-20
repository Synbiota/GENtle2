import PrimerCalculation from '../../pcr/lib/primer_calculation';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import _ from 'underscore.mixed';
import Q from 'q';
import {namedHandleError} from '../../../common/lib/handle_error';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';
import Primer from '../../pcr/lib/primer';
import Product from '../../pcr/lib/product';


var MAX_DNA_CHUNK_SIZE = 500;
var GARBAGE_SEQUENCE_DNA = 80;
var overlap = 30;


var splitSequence = function(sequence) {
  var output = [];
  var len = sequence.length;

  // Calculate number of chunks
  var x = Math.ceil(len/MAX_DNA_CHUNK_SIZE);
  var q = x * (MAX_DNA_CHUNK_SIZE - overlap) + Math.max((x-1),0) * overlap;
  var numberOfChunks = Math.ceil((len * x) / q);
  var start;
  var halfOverlap = Math.ceil(overlap/2);
  var lenWithoutOverlap = Math.ceil(len / numberOfChunks);

  for(var i = 0; i < numberOfChunks; i += 1) {
    var isNotFirst = (i !== 0 ? 1 : 0);
    start = (i * lenWithoutOverlap) - (halfOverlap * isNotFirst);
    var partOfSequence = sequence.substr(start, (lenWithoutOverlap + halfOverlap));
    output.push(partOfSequence);
  }

  return output;
};

var aggregateProgress = function(statusesArray) {
  var total = _.reduce(statusesArray, (memo, i) => memo + i.total, 0);
  return total ? _.reduce(statusesArray, (memo, i) => memo + i.current, 0)/total : 0;
};

var getPrimersPair = function(options, sequence) {
  var forwardPromise = PrimerCalculation.optimalPrimer4(sequence, options);
  var reversePromise = PrimerCalculation.optimalPrimer4(SequenceTransforms.toReverseComplements(sequence), options);
  var lastProgress = [{}, {}];

  forwardPromise.progress(() => { console.log('lapin') })

  return Q.promise(function(resolve, reject, notify) {

    Q.all([forwardPromise, reversePromise]).progress(function(current) {
      console.log('getprimerspair progress', current)
      lastProgress[current.index] = current.value;
      notify(aggregateProgress(lastProgress));
    }).then(function(results) {
      var [forwardPrimer, reversePrimer] = results;

      resolve({
        forwardPrimer: _.extend(forwardPrimer, {sequenceLength: forwardPrimer.sequence.length}),
        reversePrimer: _.extend(reversePrimer, {sequenceLength: reversePrimer.sequence.length}),
        fullSequence: sequence,
      });

    }).catch(namedHandleError('getPrimersPair, inner: finding primers'));


  }).catch(namedHandleError('getPrimersPair, outer'));
};


var logger = function(...msg) {
  if(false) {
    console.log(...msg);
  }
};


var getAllPrimers = function(sequence, options={}) {
  logger('+getAllPrimers');
  if(!_.isString(sequence)) sequence = sequence.get('sequence');
  defaultSequencingPrimerOptions(options);

  var sequenceChunks = splitSequence(sequence);
  var maxParallel = 5;
  var numberBatches = Math.ceil(sequenceChunks.length / maxParallel);
  // var lastProgress = _.map(_.range(numberBatches), function() { return {}; });

  return Q.promise(function(resolve, reject, notify) {

    var getParallelPrimers = function(i = 0, results = []) {
      logger('+getParallelPrimers');
      var sequences = sequenceChunks.slice(i , i + maxParallel);
      var promises = _.map(sequences, _.partial(getPrimersPair, options));

      if(i > numberBatches) return Q(results);

      return Q.all(promises
      ).progress(function(current) {
        console.log('progress')
        lastProgress[current.index] = current.value;
        notify(aggregateProgress(lastProgress));
      }
      ).then(function(results_) {
        notify(i/numberBatches);
        return getParallelPrimers(i + maxParallel, results.concat(results_));
      });
    };

    return getParallelPrimers().then(function(primers) {
      var total = 0;
      resolve(_.map(primers, function(primer, i) {
        var from = total;
        total += (primer.fullSequence.length - overlap);  // This smells brittle
        var to = total + overlap;

        // Set the names
        var displayedIndex = i + 1;
        primer.forwardPrimer.name = `Forward primer ${displayedIndex}`;
        primer.reversePrimer.name = `Reverse primer ${displayedIndex}`;
        name = `Product ${displayedIndex}`;

        return _.extend(primer, {
          from: from,
          index: i,
          name: name,
          to: to,
          id: _.uniqueId(),
        });
      }));
    })
    .catch(namedHandleError('getParallelPrimers'));

  });
};


var _getAllPrimersAndProducts = function(sequence, options, previousPrimer, deferredAllPrimersAndProducts, productsAndPrimers, offset) {
  var until = MAX_DNA_CHUNK_SIZE;

  if(previousPrimer.to > -GARBAGE_SEQUENCE_DNA) {
    deferredAllPrimersAndProducts.reject(`previousPrimer must finish far enough back from start of sequence of interest but finishes at ${previousPrimer.to} instead of ${-GARBAGE_SEQUENCE_DNA}`);
  } else if (previousPrimer.antisense) {
    deferredAllPrimersAndProducts.reject(`previousPrimer must be a sense (forwards) Primer`);
  } else {
    // previousPrimer.from may be negative relative to sequence passed in above
    until += previousPrimer.from;
    if(until < options.minPrimerLength) {
      deferredAllPrimersAndProducts.reject(`Impossible to find a next primer.  Previous Primer must be closer to start of sequence which is region of interest`);
    }
  }

  var subSequence = sequence.substr(0, until);
  PrimerCalculation.optimalPrimer4(subSequence, options)
    .then(function(forwardPrimer) {
      var result = calculateProductAndModifyPrimer(productsAndPrimers, offset, sequence, forwardPrimer);
      var newPreviousPrimer = result.newPreviousPrimer;
      var remainingSequence = result.remainingSequence;

      deferredAllPrimersAndProducts.notify(result.offset / (sequence.length + offset));

      offset = result.offset;

      if(remainingSequence.length > (MAX_DNA_CHUNK_SIZE + newPreviousPrimer.from)) {
        _getAllPrimersAndProducts(remainingSequence, options, newPreviousPrimer, deferredAllPrimersAndProducts, productsAndPrimers, offset);
      } else {
        deferredAllPrimersAndProducts.resolve(productsAndPrimers);
      }
    })
    .catch(function(e) {
      deferredAllPrimersAndProducts.reject(e);
    });

};

var calculateProductAndModifyPrimer = function(productsAndPrimers, offset, sequence, primer) {
  // TODO:  remove assumption this is a forward primer
  var index = productsAndPrimers.length;

  var sequenceCovered = primer.to + GARBAGE_SEQUENCE_DNA;
  var newPreviousPrimer = primer.duplicate();
  newPreviousPrimer.shift(-sequenceCovered);
  var remainingSequence = sequence.substr(sequenceCovered);
  var subSequenceLength = sequence.length - primer.from;
  var productLength = Math.min(subSequenceLength, MAX_DNA_CHUNK_SIZE);

  // Calculate fields and modify Primer and Product
  primer.shift(offset);
  
  var direction = 'forward';  // TODO: see above.
  var productName = `Product ${index + 1} (${direction})`;
  var productFrom = primer.from;
  var productTo = primer.from + productLength - 1;
  
  primer.name = productName + ' - primer';
  var product = new Product({
    name: productName,
    from: productFrom,
    to: productTo,
    primer: primer,
  });

  productsAndPrimers.push(product);

  offset += sequenceCovered;

  return {offset, newPreviousPrimer, remainingSequence};
};


/**
 * [getAllPrimersAndProducts description]
 * @param  {[String]} sequence    [description]
 * @param  {[Primer]} firstPrimer  The primer that comes before the sequence begins
 * @param  {Object} options       [description]
 * @return {[type]}               [description]
 */
var getAllPrimersAndProducts = function(sequence, firstPrimer, options={}) {
  defaultSequencingPrimerOptions(options);
  var deferredAllPrimersAndProducts = Q.defer();
  var productsAndPrimers = [];

  calculateProductAndModifyPrimer(productsAndPrimers, 0, sequence, firstPrimer);

  _getAllPrimersAndProducts(sequence, options, firstPrimer, deferredAllPrimersAndProducts, productsAndPrimers, 0);

  return deferredAllPrimersAndProducts.promise;
};


export default getAllPrimersAndProducts;
