import PrimerCalculation from '../../pcr/lib/primer_calculation';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import _ from 'underscore.mixed';
import Q from 'q';

var chunkLength = 500;
var overlap = 30;

var splitSequence = function(sequence) {
  var output = [];

  for(var i = 0; i < sequence.length; i += chunkLength - overlap) {
    output.push(sequence.substr(i, chunkLength));
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
    targetMeltingTemperature: 68,
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
        reversePrimer: _.extend(reversePrimer, {sequenceLength: reversePrimer.sequence.length})
      });

    }, (e) => console.log(e));
  

  }, (e) => console.log(e));
};





var getAllPrimers = function(sequence) {
  if(!_.isString(sequence)) sequence = sequence.get('sequence');

  var sequenceChunks = splitSequence(sequence);
  var maxParallel = 5;
  var numberBatches = Math.ceil(sequenceChunks.length / maxParallel);
  var lastProgress = _.map(_.range(numberBatches), function() { return {}; });

  return Q.promise(function(resolve, reject, notify) {

    var getParallelPrimers = function(i = 0, results = []) {
      var sequences = sequenceChunks.slice(i , i + maxParallel);
      var promises = _.map(sequences, getPrimersPair);

      if(i > numberBatches) return Q(results);

      return Q.all(promises).progress(function(current) {
        lastProgress[current.index] = current.value;
        // notify(aggregateProgress(lastProgress));
      }).then(function(results_) {
        notify(i/numberBatches);
        return getParallelPrimers(i + maxParallel, results.concat(results_));
      }, (e) => console.log(e));
    };
  
    return getParallelPrimers().then(function(primers) {
      resolve(_.map(primers, function(primer, i) {
        var from =  Math.max(0, i * chunkLength - (i) * overlap);
        return _.extend(primer, {
          from: from,
          index: i,
          to: from + chunkLength,
          id: _.uniqueId()
        });
      }));
    }, (e) => console.log(e));



  }, (e) => console.log(e));

  




  // Q.all(_.map(sequenceChunks, getPrimersPair)).then(function(results) {
  //   console.log(results);
  // }, (e) => console.log(e));





  // getPrimersPair(sequenceChunks[0]).then(function(results) {
  //   console.log('results', results)
  // }, (e) => console.log(e));
};

export default getAllPrimers;

