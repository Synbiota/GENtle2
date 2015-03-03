import PrimerCalculation from '../../pcr/lib/primer_calculation';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import _ from 'underscore.mixed';
import Q from 'q';

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

var getPrimersPair = function(sequence) {
  var opts = {
    targetMeltingTemperature: 63.5,
    meltingTemperatureTolerance: 1.5,
    useIDT: false
  };

  var forwardPromise = PrimerCalculation(sequence, opts);
  var reversePromise = PrimerCalculation(SequenceTransforms.toReverseComplements(sequence), opts);
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

    }, (e) => console.log(e));


  }, (e) => console.log(e));
};





var getAllPrimers = function(sequence) {
  if(!_.isString(sequence)) sequence = sequence.get('sequence');

  var sequenceChunks = splitSequence(sequence);
  var maxParallel = 5;
  var numberBatches = Math.ceil(sequenceChunks.length / maxParallel);
  // var lastProgress = _.map(_.range(numberBatches), function() { return {}; });

  return Q.promise(function(resolve, reject, notify) {

    var getParallelPrimers = function(i = 0, results = []) {
      var sequences = sequenceChunks.slice(i , i + maxParallel);
      var promises = _.map(sequences, getPrimersPair);

      if(i > numberBatches) return Q(results);

      return Q.all(promises
      // ).progress(function(current) {
      //   lastProgress[current.index] = current.value;
      //   notify(aggregateProgress(lastProgress));
      // }
      ).then(function(results_) {
        notify(i/numberBatches);
        return getParallelPrimers(i + maxParallel, results.concat(results_));
      }, (e) => console.log(e));
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
          id: _.uniqueId()
        });
      }));
    }, (e) => console.log(e));

  }, (e) => console.log(e));
};

export default getAllPrimers;

