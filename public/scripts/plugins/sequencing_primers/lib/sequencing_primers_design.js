import PrimerCalculation from '../../pcr/lib/primer_calculation';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import _ from 'underscore.mixed';
import Q from 'q';
import handleError from '../../../common/lib/handle_error';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';
import Primer from '../../pcr/lib/primer';


var maxChunkLength = 500;
var overlap = 30;

var splitSequence = function(sequence) {
  var output = [];
  var len = sequence.length;

  // Calculate number of chunks
  var x = Math.ceil(len/maxChunkLength);
  var q = x * (maxChunkLength - overlap) + Math.max((x-1),0) * overlap;
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

    }, handleError);


  }, handleError);
};


var logger = function(...msg) {
  if(false) {
    console.log(...msg);
  }
};


var getAllPrimers = function(sequence, options={}) {
  logger('+getAllPrimers');
  if(!_.isString(sequence)) sequence = sequence.get('sequence');
  _.defaults(options, defaultSequencingPrimerOptions());

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
      }, handleError);
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
    }, handleError);

  });
};


var GARBAGE_SEQUENCE_DNA = 80;
var MAX_DNA_CHUNK_SIZE = 500;


var _func = function(sequence, options, previousPrimer, deferredAllPrimers, primers, offset) {
  options.findFromEnd = true;

  var until = MAX_DNA_CHUNK_SIZE;

  if(previousPrimer) {
    if(previousPrimer.to > -GARBAGE_SEQUENCE_DNA) {
      deferredAllPrimers.reject(`previousPrimer must finish far enough back from start of sequence of interest but finishes at ${previousPrimer.to} instead of ${-GARBAGE_SEQUENCE_DNA}`);
    } else if (previousPrimer.antisense) {
      deferredAllPrimers.reject(`previousPrimer must be a sense (forwards) Primer`);
    } else {
      // previousPrimer.from will be negative relative to sequence of interest
      until += previousPrimer.from;
      if(until < options.minPrimerLength) {
        deferredAllPrimers.reject(`Impossible to find a next primer.  Previous Primer must be closer to start of sequence which is region of interest`);
      }
    }
  } else {
    options.allowShift = false;
    options.findFromEnd = false;
  }

  var subSequence = sequence.substr(0, until);
  var forwardPrimerPromise = PrimerCalculation.optimalPrimer4(subSequence, options);
  forwardPrimerPromise.then(function(forwardPrimer) {

    var sequenceCovered = forwardPrimer.to + GARBAGE_SEQUENCE_DNA;
    var newPreviousPrimer = forwardPrimer.duplicate();
    newPreviousPrimer.shift(-sequenceCovered);
    
    forwardPrimer.shift(offset);
    primers.push(forwardPrimer);

    offset += sequenceCovered;
    var remainingSequence = sequence.substr(sequenceCovered);
    if(remainingSequence.length > (MAX_DNA_CHUNK_SIZE + newPreviousPrimer.from)) {
      _func(remainingSequence, options, newPreviousPrimer, deferredAllPrimers, primers, offset);
    } else {
      deferredAllPrimers.resolve(primers);
    }
  }).catch(function(e) {
    deferredAllPrimers.reject(e);
  });

};

/**
 * [getAllPrimers2 description]
 * @param  {[String]} sequence    [description]
 * @param  {Object} options       [description]
 * @param  {[Primer]} firstPrimer  The primer that comes before the sequence begins
 * @return {[type]}               [description]
 */
var getAllPrimers2 = function(sequence, options={}, firstPrimer=undefined) {
  _.defaults(options, defaultSequencingPrimerOptions());
  var deferredAllPrimers = Q.defer();
  var primers = [];
  if(firstPrimer) primers.push(firstPrimer);
  
  _func(sequence, options, firstPrimer, deferredAllPrimers, primers, 0);

  return deferredAllPrimers.promise;
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


  var checkResult = function(testLabel, expectedPrimers, calculatedPrimers) {
    var fields = ['from', 'to', 'sequence', 'meltingTemperature', 'gcContent'];
    _.each(expectedPrimers, function(expectedPrimer, i){
      _.each(fields, function(field, j) {
        var expected = expectedPrimer[field];
        var calculated = calculatedPrimers[i][field];
        console.assert(expected === calculated, `field: ${field} expected: ${expected} and calculated: ${calculated} are not equal.`);
      });
    });
  };

  var getAllPrimers2_TestFactory = function(sequence, testLabel, firstPrimerDetails, expectedPrimers) {
    console.log(`Set up getAllPrimers2 test for ${testLabel}`);
    var getAllPrimers2_TestFinished = Q.defer();

    var firstPrimer = new Primer(firstPrimerDetails);
    getAllPrimers2(sequence, defaultSequencingPrimerOptions(), firstPrimer)
    .then(function(optimalPrimers){
      console.log(`Got getAllPrimers2 results for ${testLabel}, optimalPrimers:`, optimalPrimers);
      checkResult(testLabel, expectedPrimers, optimalPrimers);
      getAllPrimers2_TestFinished.resolve();
    }).catch(function(e){
      console.error(e);
      getAllPrimers2_TestFinished.reject(e);
    });
    
    return getAllPrimers2_TestFinished.promise;
  };

  // Tests
  var testSequence863 = getAllPrimers2_TestFactory(sequence863,
    'getAllPrimers2 with sequence863',
    {
      sequence: 'AAAGGGAAAGGGAAACCCAAA',
      name: 'First (universal) primer',
      from: -100,
      to: -80,
      meltingTemperature: 62.6,
      gcContent: 0.429,
    },
    [{
      sequence: "AAAGGGAAAGGGAAACCCAAA",
      from: -100,
      to: -80,
      meltingTemperature: 62.6,
      gcContent: 0.429,
    },{
      sequence: "GTGTATCTATTCCTTTTATTGGAGAGGGAG",
      from: 371,
      to: 400,
      meltingTemperature: 64.4,
      gcContent: 0.4,
    },{
      sequence: "GGTATGCACGACATGCATTAGTTA",
      from: 848,
      to: 871,
      meltingTemperature: 63.1,
      gcContent: 10/24,
    }]);

  var testSequenceFromMike = getAllPrimers2_TestFactory(sequenceFromMike,
    'getAllPrimers2 with sequenceFromMike',
    {
      sequence: 'TGCCACCTGACGTCTAAGAA',
      name: "First (Mike's universal) primer",
      from: -148,
      to: -129,
      meltingTemperature: 63,
      gcContent: 0.5,
    },
    [{
      sequence: "TGCCACCTGACGTCTAAGAA",
      from: -148,
      to: -129,
      meltingTemperature: 63,
      gcContent: 0.5,
    },{
      sequence: "CAAAATTGCTGTCTGCCAGGTG",
      from: 294,
      to: 315,
      meltingTemperature: 64.4,
      gcContent: 0.5,
    },{
      sequence: "TAACCTTTCATTCCCAGCGG",
      from: 746,
      to: 765,
      meltingTemperature: 62.2,
      gcContent: 0.5,
    },{
      sequence: "GGGCTAGCAGGGAAAATAATGAATA",
      from: 1203,
      to: 1227,
      meltingTemperature: 62.9,
      gcContent: 0.4,
    },{
      sequence: "GTTCCATTATCAGGAGTGACATCT",
      from: 1680,
      to: 1703,
      meltingTemperature: 62,
      gcContent: 0.4166666666666667,
    },{
      sequence: "CAGCTAGATCGATACGCGAAAATTT",
      from: 2148,
      to: 2172,
      meltingTemperature: 63.5,
      gcContent: 0.4,
    },{
      sequence: "CGAACAAACACGTTACTTAGAGGAAGA",
      from: 2609,
      to: 2635,
      meltingTemperature: 64.6,
      gcContent: 0.4074074074074074,
    },{
      sequence: "CCGTAGGTGTCGTTAATCTTAGAGAT",
      from: 3084,
      to: 3109,
      meltingTemperature: 63.4,
      gcContent: 0.4230769230769231,
    },{
      sequence: "GAGGACGTTACAAGTATTACTGTTAAGGAG",
      from: 3521,
      to: 3550,
      meltingTemperature: 64.4,
      gcContent: 0.4,
    },{
      sequence: "GGAAGAGTCTCGAGCAATTACTCAAAA",
      from: 3991,
      to: 4017,
      meltingTemperature: 64.8,
      gcContent: 0.4074074074074074,
    },{
      sequence: "GGCGTGATTTTGTTTTACAAGGACA",
      from: 4455,
      to: 4479,
      meltingTemperature: 64.5,
      gcContent: 0.4,
    },{
      sequence: "TGGTATTGTTGGAGCACCTATTAC",
      from: 4884,
      to: 4907,
      meltingTemperature: 62.5,
      gcContent: 0.4166666666666667,
    },{
      sequence: "GAAACCAAAGAACGCTATGCAATTC",
      from: 5332,
      to: 5356,
      meltingTemperature: 63.3,
      gcContent: 0.4,
    },{
      sequence: "GAGAGGGTATGACTGTCCATACTGAATATA",
      from: 5779,
      to: 5808,
      meltingTemperature: 64.7,
      gcContent: 0.4,
    },{
      sequence: "GTTGGAGATTGGTTTGAGCATCAAATG",
      from: 6186,
      to: 6212,
      meltingTemperature: 65,
      gcContent: 0.4074074074074074,
    },{
      sequence: "TATGCTCGGGCTCTTGATCC",
      from: 6666,
      to: 6685,
      meltingTemperature: 63.4,
      gcContent: 0.55,
    },{
      sequence: "GAGACTGCTCATTGGATATTATCGA",
      from: 7135,
      to: 7159,
      meltingTemperature: 62.1,
      gcContent: 0.4,
    },{
      sequence: "GCCGATGCTTTTGCATACGTAT",
      from: 7614,
      to: 7635,
      meltingTemperature: 63.7,
      gcContent: 0.45454545454545453,
    },{
      sequence: "TCATAGCTCACGCTGTAGGT",
      from: 8095,
      to: 8114,
      meltingTemperature: 62.5,
      gcContent: 0.5,
    },{
      sequence: "CACGTTAAGGGATTTTGGTCATG",
      from: 8544,
      to: 8566,
      meltingTemperature: 62,
      gcContent: 0.43478260869565216,
    }]);

  Q.all([
    testSequence863,
    testSequenceFromMike
  ])
  .then(PrimerCalculation.restoreIDTMeltingTemperature(oldIDTMeltingTemperature)).done();
}

export default getAllPrimers;
