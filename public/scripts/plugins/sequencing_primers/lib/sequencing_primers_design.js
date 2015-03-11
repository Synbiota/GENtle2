import PrimerCalculation from '../../pcr/lib/primer_calculation';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import _ from 'underscore.mixed';
import Q from 'q';
import {namedHandleError} from '../../../common/lib/handle_error';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';
import Primer from '../../pcr/lib/primer';
import Product from '../../pcr/lib/product';
import {mikeForward1} from '../../pcr/lib/universal_primers';


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
  console.log(status)
  var total = _.reduce(statusesArray, (memo, i) => memo + i.total, 0);
  return total ? _.reduce(statusesArray, (memo, i) => memo + i.current, 0)/total : 0;
};

var getPrimersPair = function(options, sequence) {
  var forwardPromise = PrimerCalculation.optimalPrimer4(sequence, options);
  var reversePromise = PrimerCalculation.optimalPrimer4(SequenceTransforms.toReverseComplements(sequence), options);
  var lastProgress = [{}, {}];

  return Q.promise(function(resolve, reject, notify) {

    Q.all([forwardPromise, reversePromise]).progress(function(current) {
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
      // ).progress(function(current) {
      //   lastProgress[current.index] = current.value;
      //   notify(aggregateProgress(lastProgress));
      // }
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
  PrimerCalculation.optimalPrimer4(subSequence, options).then(
  function(forwardPrimer) {
    var result = calculateProductAndModifyPrimer(productsAndPrimers, offset, sequence, forwardPrimer);
    var newPreviousPrimer = result.newPreviousPrimer;
    var remainingSequence = result.remainingSequence;
    offset = result.offset;

    if(remainingSequence.length > (MAX_DNA_CHUNK_SIZE + newPreviousPrimer.from)) {
      _getAllPrimersAndProducts(remainingSequence, options, newPreviousPrimer, deferredAllPrimersAndProducts, productsAndPrimers, offset);
    } else {
      deferredAllPrimersAndProducts.resolve(productsAndPrimers);
    }
  }).catch(function(e) {
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


// Some tests
if(false) {
  var oldIDTMeltingTemperature = PrimerCalculation.stubOutIDTMeltingTemperature();
  var sequence863 = ('AAAAAAATGATTAAAAATTTATTGGCAATTTTAGATTTAAAATCTTTAG' +
    'TACTCAATGCAATAAATTATTGGGGTCCTAAAAATAATAATGGCATACAGGGTGGTGATTTTGGTTACCC' +
    'TATATCAGAAAAACAAATAGATACGTCTATTATAACTTCTACTCATCCTCGTTTAATTCCACATGATTTA' +
    'ACAATTCCTCAAAATTTAGAAACTATTTTTACTACAACTCAAGTATTAACAAATAATACAGATTTACAAC' +
    'AAAGTCAAACTGTTTCTTTTGCTAAAAAAACAACGACAACAACTTCAACTTCAACTACAAATGGTTGGAC' +
    'AGAAGGTGGGAAAATTTCAGATACATTAGAAGAAAAAGTAA' + 
    'GTGTATCTATTCCTTTTATTGGAGAGGGAG' +  // primer 2
    'GAGGAAAAAACAGTACAACTATAGAAGCTAATTTTGCACATAACTCTAGTACTACTACTTTTCAACAGG' +
    'CTTCAACTGATATAGAGTGGAATATTTCACAACCAGTATTGGTTCCCCCACGTAAACAAGTTGTAGCAAC' +
    'ATTAGTTATTATGGGAGGTAATTTTACTATTCCTATGGATTTGATGACTACTATAGATTCTACAGAACAT' +
    'TATAGTGGTTATCCAATATTAACATGGATATCGAGCCCCGATAATAGTTATAATGGTCCATTTATGAGTT' +
    'GGTATTTTGCAAATTGGCCCAATTTACCATCGGGGTTTGGTCCTTTAAATTCAGATAATACGGTCACTTA' +
    'TACAGGTTCTGTTGTAAGTCAAGTATCAGCTGGTGTATATGCCACTGTACGATTTGATCAATATGATATA' +
    'CACAATTTAAGGACAATTGAAAAAACTT' + 
    'GGTATGCACGACATGCATTAGTTA' + // primer 3
    'TTATGGGAGGTAATTTTACTATTCCTATGGATTTGATGACTACTATAGA');

  var sequenceFromMike = ('TTATGACAACTTGACGGCTACATCATTCACTTTTTCTTCAC' +
    'AACCGGCACGGAACTCGCTCGGGCTGGCCCCGGTGCATTTTTTAAATACCCGCGAGAAATAGAGTTGATC' +
    'GTCAAAACCAACATTGCGACCGACGGTGGCGATAGGCATCCGGGTGGTGCTCAAAAGCAGCTTCGCCTGG' +
    'CTGATACGTTGGTCCTCGCGCCAGCTTAAGACGCTAATCCCTAACTGCTGGCGGAAAAGATGTGACAGAC' +
    'GCGACGGCGACAAGCAAACATGCTGTGCGACGCTGGCGATATCAAAATTGCTGTCTGCCAGGTGATCGCT' +
    'GATGTACTGACAAGCCTCGCGTACCCGATTATCCATCGGTGGATGGAGCGACTCGTTAATCGCTTCCATG' +
    'CGCCGCAGTAACAATTGCTCAAGCAGATTTATCGCCAGCAGCTCCGAATAGCGCCCTTCCCCTTGCCCGG' +
    'CGTTAATGATTTGCCCAAACAGGTCGCTGAAATGCGGCTGGTGCGCTTCATCCGGGCGAAAGAACCCCGT' +
    'ATTGGCAAATATTGACGGCCAGTTAAGCCATTCATGCCAGTAGGCGCGCGGACGAAAGTAAACCCACTGG' +
    'TGATACCATTCGCGAGCCTCCGGATGACGACCGTAGTGATGAATCTCTCCTGGCGGGAACAGCAAAATAT' +
    'CACCCGGTCGGCAAACAAATTCTCGTCCCTGATTTTTCACCACCCCCTGACCGCGAATGGTGAGATTGAG' +
    'AATATAACCTTTCATTCCCAGCGGTCGGTCGATAAAAAAATCGAGATAACCGTTGGCCTCAATCGGCGTT' +
    'AAACCCGCCACCAGATGGGCATTAAACGAGTATCCCGGCAGCAGGGGATCATTTTGCGCTTCAGCCATAC' +
    'TTTTCATACTCCCGCCATTCAGAGAAGAAACCAATTGTCCATATTGCATCAGACATTGCCGTCACTGCGT' +
    'CTTTTACTGGCTCTTCTCGCTAACCAAACCGGTAACCCCGCTTATTAAAAGCATTCTGTAACAAAGCGGG' +
    'ACCAAAGCCATGACAAAAACGCGTAACAAAAGTGTCTATAATCACGGCAGAAAAGTCCACATTGATTATT' +
    'TGCACGGCGTCACACTTTGCTATGCCATAGCATTTTTATCCATAAGATTAGCGGATCCTACCTGACGCTT' +
    'TTTATCGCAACTCTCTACTGTTTCTCCATACCCGTTTTTTTGGGCTAGCAGGGAAAATAATGAATAAATG' +
    'TATTCCAATGATAATTAATGGAATGATTCAAGATTTTGATAATTATGCATATAAAGAAGTTAAACTAAAT' +
    'AATGATAATAGAGTAAAATTATCTGTCATTACTGAAAGTTCAGTTTCAAAAACATTAAATATCAAAGATA' +
    'GAATTAATCTAAATTTAAATCAGATTGTGAATTTTTTATATACCGTTGGTCAACGATGGAAAAGTGAAGA' +
    'ATATAATCGGCGACGAACCTATATCCGTGAGTTAAAAACATATCTTGGTTATTCTGATGAAATGGCAAGA' +
    'TTAGAAGCGAATTGGATTGCAATGTTATTGTGCTCTAAAAGTGCTTTGTATGACATTGTTAATTATGATT' +
    'TGGGCTCTATACACGTATTAGATGAATGGCTTCCACGTGGTGATTGCTATGTTAAAGCACAACCGAAAGG' +
    'TGTTTCTGTTCACTTGTTAGCTGGTAATGTTCCATTATCAGGAGTGACATCTATTTTGCGTGCTATTTTA' +
    'ACAAAAAATGAGTGCATTATTAAAACTTCGTCTTCAGATCCTTTTACTGCAAACGCTTTAGTTTCCAGTT' +
    'TTATTGATGTTAATGCAGACCATCCAATAACCAAATCAATGTCTGTTATGTATTGGCCGCATGATGAAGA' +
    'TATGACTCTATCTCAAAGAATAATGAATCATGCCGACGTGGTTATTGCTTGGGGTGGAGACGAGGCGATT' +
    'AAATGGGCGGTAAAATATTCACCACCGCATGTCGATATTCTGAAATTTGGACCAAAGAAAAGCTTAAGTA' +
    'TTATTGAAGCTCCTAAAGATATAGAAGCCGCAGCAATGGGGGTTGCTCATGATATTTGTTTCTATGACCA' +
    'GCAAGCCTGCTTCTCTACTCAAGACGTTTATTATATAGGAGATAATTTACCTTTATTTTTAAATGAACTT' +
    'GAAAAACAGCTAGATCGATACGCGAAAATTTTACCAAAAGGTTCAAATAGTTTTGATGAAAAAGCGGCGT' +
    'TTACTCTTACTGAAAAAGAAAGTCTATTTGCTGGATATGAAGTGAGAAAGGGAGATAAGCAAGCTTGGTT' +
    'AATAGTCGTATCACCTACAAATAGCTTTGGAAATCAACCGCTATCACGAAGTGTGTATGTTCATCAAGTA' +
    'TCTGATATTAAAGAGATAATTCCTTTTGTTAATAAAAATAGAACACAAACTGTTTCTATTTATCCTTGGG' +
    'AAGCGTCATTAAAATATCGAGATAAATTAGCAAGAAGTGGAGTTGAAAGAATTGTTGAATCAGGCATGAA' +
    'TAATATTTTCAGAGTTGGAGGGGCTCATGATTCATTATCTCCTCTCCAGTACCTAGTTAGGTTTGTATCG' +
    'CATGAGAGGCCATTTAATTATACGACAAAAGATGTTGCGGTTGAAATCGAACAAACACGTTACTTAGAGG' +
    'AAGATAAGTTTTTAGTTTTTGTCCCATAGTTAAAGGAAATTATATGAAAGATGAAAGTGCTTTTTTTACG' +
    'ATTGATCACATCATCAAGCTTGATAATGGTCAGTCTATCCGAGTTTGGGAAACACTCCCTAAAAAGAACG' +
    'TACCAGAGAAAAAACATACAATACTTATTGCTTCGGGTTTTGCTAGAAGAATGGATCATTTTGCAGGTCT' +
    'TGCTGAGTATTTATCTACTAACGGTTTTCATGTCATTCGCTACGATTCTTTGCATCATGTTGGATTAAGC' +
    'AGTGGATGTATAAATGAATTTACGATGTCGATTGGAAAAAATAGCCTGCTTACAGTCGTAGATTGGCTTA' +
    'CAGATCATGGTGTCGAACGAATAGGGCTGATTGCTGCTAGTTTGTCAGCGAGAATCGCCTATGAGGTAGT' +
    'AAATAAAATTAAATTATCATTTTTAATTACGGCCGTAGGTGTCGTTAATCTTAGAGATACATTAGAAAAA' +
    'GCATTGGAGTATGACTATTTGCAATTACCTATTTCAGAGTTACCAGAAGATCTTGACTTTGAAGGTCATA' +
    'ATTTAGGATCGGAGGTCTTTGTTACAGATTGCTTTAAACATAATTGGGACACGTTAGACTCGACACTTAA' +
    'TAGTGTTAAAGGATTAGCGATTCCATTTATTGCTTTTACTGCAAACGATGATAGTTGGGTAAAGCAAAGT' +
    'GAAGTTATAGAGCTCATTGATAGCATTGAATCTAGTAATTGTAAGCTCTATTCGCTAATTGGAAGTTCAC' +
    'ATGATCTTGGGGAAAATTTGGTTGTATTAAGAAATTTTTATCAATCAGTGACGAAGGCAGCCTTAGCATT' +
    'AGATGATGGTTTATTGGATTTAGAGATAGACATTATTGAACCTCGATTTGAGGACGTTACAAGTATTACT' +
    'GTTAAGGAGCGTAGATTAAAAAATGAAATTGAAAATGAATTATTAGAATTGGCTTAAATAAACAGAATCA' +
    'CCAAAAAGGAATAGAGTATGAAGTTTGGAAATATTTGTTTTTCGTATCAACCACCAGGTGAAACTCATAA' +
    'GCAAGTAATGGATCGCTTTGTTCGGCTTGGTATCGCCTCAGAAGAGGTAGGGTTTGATACATATTGGACC' +
    'TTAGAACATCATTTTACAGAGTTTGGTCTTACGGGAAATTTATTTGTTGCTGCGGCTAACCTGTTAGGAA' +
    'GAACTAAAACATTAAATGTTGGCACTATGGGGGTTGTTATTCCGACAGCACACCCAGTTCGACAGTTAGA' +
    'AGACGTTTTATTATTAGATCAAATGTCGAAAGGTCGTTTTAATTTTGGAACCGTTCGAGGGCTATACCAT' +
    'AAAGATTTTCGAGTATTTGGTGTTGATATGGAAGAGTCTCGAGCAATTACTCAAAATTTCTACCAGATGA' +
    'TAATGGAAAGCTTACAGACAGGAACCATTAGCTCTGATAGTGATTACATTCAATTTCCTAAGGTTGATGT' +
    'ATATCCCAAAGTGTACTCAAAAAATGTACCAACCTGTATGACTGCTGAGTCCGCAAGTACGACAGAATGG' +
    'CTAGCAATACAAGGGCTACCAATGGTTCTTAGTTGGATTATTGGTACTAATGAAAAAAAAGCACAGATGG' +
    'AACTCTATAATGAAATTGCGACAGAATATGGTCATGATATATCTAAAATAGATCATTGTATGACTTATAT' +
    'TTGTTCTGTTGATGATGATGCACAAAAGGCGCAAGATGTTTGTCGGGAGTTTCTGAAAAATTGGTATGAC' +
    'TCATATGTAAATGCGACCAATATCTTTAATGATAGCAATCAAACTCGTGGTTATGATTATCATAAAGGTC' +
    'AATGGCGTGATTTTGTTTTACAAGGACATACAAACACCAATCGACGTGTTGATTATAGCAATGGTATTAA' +
    'CCCTGTAGGCACTCCTGAGCAGTGTATTGAAATCATTCAACGTGATATTGATGCAACGGGTATTACAAAC' +
    'ATTACATGCGGATTTGAAGCTAATGGAACTGAAGATGAAATAATTGCTTCCATGCGACGCTTTATGACAC' +
    'AAGTCGCTCCTTTCTTAAAAGAACCTAAATAAATTACTTATTTGATACTAGAGATAATAAGGAACAAGTT' +
    'ATGAAATTTGGATTATTTTTTCTAAACTTTCAGAAAGATGGAATAACATCTGAAGAAACGTTGGATAATA' +
    'TGGTAAAGACTGTCACGTTAATTGATTCAACTAAATATCATTTTAATACTGCCTTTGTTAATGAACATCA' +
    'CTTTTCAAAAAATGGTATTGTTGGAGCACCTATTACCGCAGCTGGTTTTTTATTAGGGTTAACAAATAAA' +
    'TTACATATTGGTTCATTAAATCAAGTAATTACCACCCATCACCCTGTACGTGTAGCAGAAGAAGCCAGTT' +
    'TATTAGATCAAATGTCAGAGGGACGCTTCATTCTTGGTTTTAGTGACTGCGAAAGTGATTTCGAAATGGA' +
    'ATTTTTTAGACGTCATATCTCATCAAGGCAACAACAATTTGAAGCATGCTATGAAATAATTAATGACGCA' +
    'TTAACTACAGGTTATTGTCATCCCCAAAACGACTTTTATGATTTTCCAAAGGTTTCAATTAATCCACACT' +
    'GTTACAGTGAGAATGGACCTAAGCAATATGTATCCGCTACATCAAAAGAAGTCGTCATGTGGGCAGCGAA' +
    'AAAGGCACTGCCTTTAACATTTAAGTGGGAGGATAATTTAGAAACCAAAGAACGCTATGCAATTCTATAT' +
    'AATAAAACAGCACAACAATATGGTATTGATATTTCGGATGTTGATCATCAATTAACTGTAATTGCGAACT' +
    'TAAATGCTGATAGAAGTACGGCTCAAGAAGAAGTGAGAGAATACTTAAAAGACTATATCACTGAAACTTA' +
    'CCCTCAAATGGACAGAGATGAAAAAATTAACTGCATTATTGAAGAGAATGCAGTTGGCTCTCATGATGAC' +
    'TATTATGAATCGACAAAATTAGCAGTGGAAAAAACAGGGTCTAAAAATATTTTATTATCCTTTGAATCAA' +
    'TGTCCGATATTAAAGATGTAAAAGATATTATTGATATGTTGAACCAAAAAATCGAAATGAATTTACCATA' +
    'ATAAAATTAAAGGCAATTTCTATATTAGATTGCCTTTTTAAATTTCTGTTGATATTAGGTATTACTGGAG' +
    'AGGGTATGACTGTCCATACTGAATATAAAAGAAATCAAATCATTGCTAGTTCAGAAATTGATGATCTTAT' +
    'CTTTATGACGAAACCACAAGAGTGGTCATTTGAAGAGCAAAAAGAAATACGGGATAAATTAGTTCGTGAG' +
    'GCTTTTTATTTTCACTACAATAGAAATGAAGAATATAGAAATTATTGTATCAATCAGCATGTGAGTGATA' +
    'ATTTACACACTATTGATGAAATACCCGTGTTTCCAACATCTGTTTTTAAATATAAGAAATTACATACTGT' +
    'CACAGCCGAGGACATTGAAAATTGGTATACAAGTAGTGGAACTCGTGGAGTAAAAAGTCATATTGCACGT' +
    'GATCGTCTTAGCATTGAACGCTTGCTTGGTTCTGTCAACTTCGGAATGAAATACGTTGGAGATTGGTTTG' +
    'AGCATCAAATGGAATTGATAAATTTAGGACCAGATAGATTCAATACAAATAATATTTGGTTTAAATATGT' +
    'CATGAGTTTGGTCGAGTTACTTTATCCGACTGAATTTACAGTTGATAATGACAAAATAGATTTTGAAAAA' +
    'ACAGTAAAACATCTATTTAGAATTAAGAATAGTAAAAAAGACATTTGCTTAATTGGGCCACCATTTTTTG' +
    'TGTATCTTTTGTGCCAATATATGAAAGAAAACAATATTGAATTTAAAGGAGGAGATAGAGTACATATTAT' +
    'TACTGGTGGAGGATGGAAATCTAATCAGAATGACTCTTTAGATCGTGCTGATTTTAATCAATTATTAATG' +
    'GATACTTTCCAACTCGACAAGATTAATCAAATTAGAGATACCTTTAATCAAGTTGAGCTTAATACTTGTT' +
    'TTTTTGAAGATGAATTTCAAAGAAAACATGTTCCACCGTGGGTATATGCTCGGGCTCTTGATCCTGAAAC' +
    'CTTGAAACCCGTAGCAGATGGTGAGATCGGGTTGTTAAGTTATATGGACGCCTCATCAACTGCTTACCCT' +
    'GCTTTTATTGTTACTGATGATATCGGTATTGTAAAAGAAATTAGAGAACCAGATCCTTACCCAGGGGTAA' +
    'CTGTTGAGATTGTTCGGCGCTTAAATACACGTGCGCAAAAAGGATGCGCGCTCTCTATGGCTAATGTCAT' +
    'ACAAAAGAATATCAAGGATTAAGTTATGATTGTTGATGGTAGAGTTTCAAAAATAGTATTAGCGTCAATA' +
    'AGAAATAATATATATAAGGTATTTATTACTGTAAATTCACCAATAAAGTTCATCGCTGGACAATTTGTAA' +
    'TGGTCACGATTAATGGGAAAAAATGCCCTTTTTCAATTGCGAATTGCCCGACAAAAAATTACGAAATAGA' +
    'ATTGCATATTGGTAGTTCGAATAGAGACTGCTCATTGGATATTATCGAATATTTTGTCGATGCTCTTGTT' +
    'GAGGAAGTCGCAATTGAGTTAGATGCTCCCCATGGAAACGCTTGGTTACGGTCTGAAAGTAATAACCCAT' +
    'TGCTATTAATTGCGGGAGGTACAGGTTTATCATATATAAATAGCATTCTAACAAATTGCTTAAATAGGAA' +
    'TATACCTCAAGATATTTATCTTTACTGGGGAGTAAAAGACAGTTCTCTTTTGTATGAAGATGAAGAGTTA' +
    'CTAAACTTATCACTAAACAACAAAAACTTTCATTATATTCCTGTTATTGAAGATAAAAGTGAAGAATGGA' +
    'TAGGGAGAAAAGGCACTGTTCTTGATGCTGTCATGGAAGATTTTACTGATCTTACTTATTTTGATATTTA' +
    'TGTTTGTGGACCCTTCATGATGGCTAAAACAGCAAAAGAAAAATTAATTGAAGAGAAAAAAGCAAAGTCA' +
    'GAACAGATGTTTGCCGATGCTTTTGCATACGTATAAGAGATGAGACCTCCGGCAAAAAAACGGGCAAGGT' +
    'GTCACCACCCTGCCCTTTTTCTTTAAAACCGAAAAGATTACTTCGCGTTCTGCAGGCTTCCTCGCTCACT' +
    'GACTCGCTGCGCTCGGTCGTTCGGCTGCGGCGACCGGTATCAGCTCACTCAAAGGCGGTAATACGGTTAT' +
    'CCACAGAATCAGGGGATAACGCAGGAAAGAACATGTGAGCAAAAGGCCAGCAAAAGGCCAGGAACCGTAA' +
    'AAAGGCCGCGTTGCTGGCGTTTTTCCATAGGCTCCGCCCCCCTGACGAGCATCACAAAAATCGACGCTCA' +
    'AGTCAGAGGTGGCGAAACCCGACAGGACTATAAAGATACCAGGCGTTTCCCCCTGGAAGCTCCCTCGTGC' +
    'GCTCTCCTGTTCCGACCCTGCCGCTTACCGGATACCTGTCCGCCTTTCTCCCTTCGGGAAGCGTGGCGCT' +
    'TTCTCATAGCTCACGCTGTAGGTATCTCAGTTCGGTGTAGGTCGTTCGCTCCAAGCTGGGCTGTGTGCAC' +
    'GAACCCCCCGTTCAGCCCGACCGCTGCGCCTTATCCGGTAACTATCGTCTTGAGTCCAACCCGGTAAGAC' +
    'ACGACTTATCGCCACTGGCAGCAGCCACTGGTAACAGGATTAGCAGAGCGAGGTATGTAGGCGGTGCTAC' +
    'AGAGTTCTTGAAGTGGTGGCCTAACTACGGCTACACTAGAAGGACAGTATTTGGTATCTGCGCTCTGCTG' +
    'AAGCCAGTTACCTTCGGAAAAAGAGTTGGTAGCTCTTGATCCGGCAAACAAACCACCGCTGGTAGCGGTG' +
    'GTTTTTTTGTTTGCAAGCAGCAGATTACGCGCAGAAAAAAAGGATCTCAAGAAGATCCTTTGATCTTTTC' +
    'TACGGGGTCTGACGCTCAGTGGAACGAAAACTCACGTTAAGGGATTTTGGTCATGAGATTATCAAAAAGG' +
    'ATCTTCACCTAGATCCTTTTAAATTAAAAATGAAGTTTTAAATCAATCTAAAGTATATATGAGTAAACTT' +
    'GGTCTGACAGCTCGAGGCTTGGATTCTCACCAATAAAAAACGCCCGGCGGCAACCGAGCGTTCTGAACAA' +
    'ATCCAGATGGAGTTCTGAGGTCATTACTGGATCTATCAACAGGAGTCCAAGCGAGCTCGATATCAAATTA' +
    'CG');


  var checkResult = function(testLabel, expectedPrimersAndProducts, calculatedPrimersAndProducts) {
    var productFields = ['from', 'to', 'name'];
    var primerFields = ['from', 'to', 'name', 'sequence', 'meltingTemperature', 'gcContent'];
    _.each(expectedPrimersAndProducts, function(expectedProductAndPrimer, i){
      _.each(productFields, function(productField, j) {
        var expected = expectedProductAndPrimer[productField];
        var calculated = calculatedPrimersAndProducts[i][productField];
        console.assert(expected === calculated, `productField \`${productField}\`: expected ${expected} and calculated ${calculated} are not equal.`);
      });
      _.each(primerFields, function(primerField, j) {
        var expected = expectedProductAndPrimer.primer[primerField];
        var calculated = calculatedPrimersAndProducts[i].primer[primerField];
        console.assert(expected === calculated, `primerField \`${primerField}\`: expected ${expected} and calculated ${calculated} are not equal.`);
      });
    });
  };

  var getAllPrimersAndProducts_TestFactory = function(sequence, testLabel, firstPrimerDetails, expectedPrimersAndProducts) {
    console.log(`Set up getAllPrimersAndProducts test for ${testLabel}`);
    var getAllPrimersAndProducts_TestFinished = Q.defer();

    var firstPrimer = new Primer(firstPrimerDetails);
    getAllPrimersAndProducts(sequence, firstPrimer, defaultSequencingPrimerOptions())
    .then(function(calculatedPrimersAndProducts){
      console.log(`Got getAllPrimersAndProducts results for ${testLabel}, calculatedPrimersAndProducts:`, calculatedPrimersAndProducts);
      checkResult(testLabel, expectedPrimersAndProducts, calculatedPrimersAndProducts);
      getAllPrimersAndProducts_TestFinished.resolve();
    }).catch(function(e){
      console.error(e);
      getAllPrimersAndProducts_TestFinished.reject(e);
    });
    
    return getAllPrimersAndProducts_TestFinished.promise;
  };

  // Tests
  var testSequence863 = getAllPrimersAndProducts_TestFactory(sequence863,
    'getAllPrimersAndProducts with sequence863',
    {
      sequence: 'AAAGGGAAAGGGAAACCCAAA',
      name: 'First (universal) primer',
      from: -100,
      to: -80,
      meltingTemperature: 62.6,
      gcContent: 0.429,
    },
    [{
      name: 'Product 1 (forward)',
      from: -100,
      to: 399,
      primer: {
        name: 'Product 1 (forward) - primer',
        from: -100,
        to: -80,
        sequence: 'AAAGGGAAAGGGAAACCCAAA',
        meltingTemperature: 62.6,
        gcContent: 0.429,
      }
    },{
      name: 'Product 2 (forward)',
      from: 370,
      to: 869,
      primer: {
        name: 'Product 2 (forward) - primer',
        from: 370,
        to: 399,
        sequence: 'GTGTATCTATTCCTTTTATTGGAGAGGGAG',
        gcContent: 0.4,
        meltingTemperature: 64.4,
      }
    },{
      name: 'Product 3 (forward)',
      from: 847,
      to: 919,
      primer: {
        name: 'Product 3 (forward) - primer',
        from: 847,
        to: 869,
        sequence: 'GGTATGCACGACATGCATTAGTT',
        gcContent: 10/23,
        meltingTemperature: 63.4,
      }
    }]);

  var testSequenceFromMike = getAllPrimersAndProducts_TestFactory(sequenceFromMike,
    'getAllPrimersAndProducts with sequenceFromMike',
    mikeForward1(),
    [{
      "name":"Product 1 (forward)",
      "from": -148,
      "to": 351,
      "primer": {
        "name":"Product 1 (forward) - primer",
        "from": -148,
        "to": -129,
        "sequence": "TGCCACCTGACGTCTAAGAA",
        "meltingTemperature": 63,
        "gcContent": 0.5,
      },
    },
    {
      "name":"Product 2 (forward)",
      "from": 293,
      "to": 792,
      "primer": {
        "name":"Product 2 (forward) - primer",
        "from": 293,
        "to": 314,
        "sequence": "CAAAATTGCTGTCTGCCAGGTG",
        "meltingTemperature": 64.4,
        "gcContent": 0.5,
      },
    },
    {
      "name":"Product 3 (forward)",
      "from": 745,
      "to": 1244,
      "primer": {
        "name":"Product 3 (forward) - primer",
        "from": 745,
        "to": 766,
        "sequence": "TAACCTTTCATTCCCAGCGGTC",
        "meltingTemperature": 64.4,
        "gcContent": 0.5,
      },
    },
    {
      "name":"Product 4 (forward)",
      "from": 1202,
      "to": 1701,
      "primer": {
        "name":"Product 4 (forward) - primer",
        "from": 1202,
        "to": 1226,
        "sequence": "GGGCTAGCAGGGAAAATAATGAATA",
        "meltingTemperature": 62.9,
        "gcContent": 0.4,
      },
    },
    {
      "name":"Product 5 (forward)",
      "from": 1678,
      "to": 2177,
      "primer": {
        "name":"Product 5 (forward) - primer",
        "from": 1678,
        "to": 1701,
        "sequence": "TGTTCCATTATCAGGAGTGACATC",
        "meltingTemperature": 62.2,
        "gcContent": 0.4166666666666667,
      },
    },
    {
      "name":"Product 6 (forward)",
      "from": 2147,
      "to": 2646,
      "primer": {
        "name":"Product 6 (forward) - primer",
        "from": 2147,
        "to": 2171,
        "sequence": "CAGCTAGATCGATACGCGAAAATTT",
        "meltingTemperature": 63.5,
        "gcContent": 0.4,
      },
    },
    {
      "name":"Product 7 (forward)",
      "from": 2608,
      "to": 3107,
      "primer": {
        "name":"Product 7 (forward) - primer",
        "from": 2608,
        "to": 2634,
        "sequence": "CGAACAAACACGTTACTTAGAGGAAGA",
        "meltingTemperature": 64.6,
        "gcContent": 0.4074074074074074,
      },
    },
    {
      "name":"Product 8 (forward)",
      "from": 3083,
      "to": 3582,
      "primer": {
        "name":"Product 8 (forward) - primer",
        "from": 3083,
        "to": 3107,
        "sequence": "CCGTAGGTGTCGTTAATCTTAGAGA",
        "meltingTemperature": 63.1,
        "gcContent": 0.44,
      },
    },
    {
      "name":"Product 9 (forward)",
      "from": 3525,
      "to": 4024,
      "primer": {
        "name":"Product 9 (forward) - primer",
        "from": 3525,
        "to": 3551,
        "sequence": "CGTTACAAGTATTACTGTTAAGGAGCG",
        "meltingTemperature": 63.4,
        "gcContent": 0.4074074074074074,
      },
    },
    {
      "name":"Product 10 (forward)",
      "from": 3990,
      "to": 4489,
      "primer": {
        "name":"Product 10 (forward) - primer",
        "from": 3990,
        "to": 4016,
        "sequence": "GGAAGAGTCTCGAGCAATTACTCAAAA",
        "meltingTemperature": 64.8,
        "gcContent": 0.4074074074074074,
      },
    },
    {
      "name":"Product 11 (forward)",
      "from": 4454,
      "to": 4953,
      "primer": {
        "name":"Product 11 (forward) - primer",
        "from": 4454,
        "to": 4478,
        "sequence": "GGCGTGATTTTGTTTTACAAGGACA",
        "meltingTemperature": 64.5,
        "gcContent": 0.4,
      },
    },
    {
      "name":"Product 12 (forward)",
      "from": 4883,
      "to": 5382,
      "primer": {
        "name":"Product 12 (forward) - primer",
        "from": 4883,
        "to": 4906,
        "sequence": "TGGTATTGTTGGAGCACCTATTAC",
        "meltingTemperature": 62.5,
        "gcContent": 0.4166666666666667,
      },
    },
    {
      "name":"Product 13 (forward)",
      "from": 5331,
      "to": 5830,
      "primer": {
        "name":"Product 13 (forward) - primer",
        "from": 5331,
        "to": 5355,
        "sequence": "GAAACCAAAGAACGCTATGCAATTC",
        "meltingTemperature": 63.3,
        "gcContent": 0.4,
      },
    },
    {
      "name":"Product 14 (forward)",
      "from": 5778,
      "to": 6277,
      "primer": {
        "name":"Product 14 (forward) - primer",
        "from": 5778,
        "to": 5807,
        "sequence": "GAGAGGGTATGACTGTCCATACTGAATATA",
        "meltingTemperature": 64.7,
        "gcContent": 0.4,
      },
    },
    {
      "name":"Product 15 (forward)",
      "from": 6185,
      "to": 6684,
      "primer": {
        "name":"Product 15 (forward) - primer",
        "from": 6185,
        "to": 6211,
        "sequence": "GTTGGAGATTGGTTTGAGCATCAAATG",
        "meltingTemperature": 65,
        "gcContent": 0.4074074074074074,
      },
    },
    {
      "name":"Product 16 (forward)",
      "from": 6665,
      "to": 7164,
      "primer": {
        "name":"Product 16 (forward) - primer",
        "from": 6665,
        "to": 6684,
        "sequence": "TATGCTCGGGCTCTTGATCC",
        "meltingTemperature": 63.4,
        "gcContent": 0.55,
      },
    },
    {
      "name":"Product 17 (forward)",
      "from": 7134,
      "to": 7633,
      "primer": {
        "name":"Product 17 (forward) - primer",
        "from": 7134,
        "to": 7158,
        "sequence": "GAGACTGCTCATTGGATATTATCGA",
        "meltingTemperature": 62.1,
        "gcContent": 0.4,
      },
    },
    {
      "name":"Product 18 (forward)",
      "from": 7613,
      "to": 8112,
      "primer": {
        "name":"Product 18 (forward) - primer",
        "from": 7613,
        "to": 7633,
        "sequence": "GCCGATGCTTTTGCATACGTA",
        "meltingTemperature": 63.4,
        "gcContent": 0.47619047619047616,
      },
    },
    {
      "name":"Product 19 (forward)",
      "from": 8092,
      "to": 8591,
      "primer": {
        "name":"Product 19 (forward) - primer",
        "from": 8092,
        "to": 8112,
        "sequence": "TCTCATAGCTCACGCTGTAGG",
        "meltingTemperature": 62.9,
        "gcContent": 0.5238095238095238,
      },
    },
    {
      "name":"Product 20 (forward)",
      "from": 8543,
      "to": 8792,
      "primer": {
        "name":"Product 20 (forward) - primer",
        "from": 8543,
        "to": 8565,
        "sequence": "CACGTTAAGGGATTTTGGTCATG",
        "meltingTemperature": 62,
        "gcContent": 0.43478260869565216,
      }
    }]);

  Q.all([
    testSequence863,
    testSequenceFromMike
  ])
  .then(PrimerCalculation.restoreIDTMeltingTemperature(oldIDTMeltingTemperature)).done();
}

export default getAllPrimersAndProducts;
