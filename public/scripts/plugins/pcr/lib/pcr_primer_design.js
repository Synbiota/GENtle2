import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';

var distanceToTarget = function(sequence, targetMeltingTemperature, targetGcContent) {
  return Math.sqrt(
    Math.pow(targetMeltingTemperature - SequenceCalculations.meltingTemperature(sequence), 2) * 0 + 
    Math.pow((targetGcContent - SequenceCalculations.gcContent(sequence))*50, 2)
  );
};

var startingGcScore = function(sequence) {
  var match = sequence.match(/^[GC]+/);
  return match && match[0].length ? Math.pow(2, match[0].length) : 0
};

var primerScore = function(sequence, targetMeltingTemperature) {
  var score = 500;

  score -= Math.pow(SequenceCalculations.meltingTemperature(sequence) - targetMeltingTemperature, 2);
  score += startingGcScore(sequence);
  score -= selfAnnealingScore(sequence) / 10;

  // console.log('primerScore', sequence)
  // console.log(SequenceCalculations.meltingTemperature(sequence), Math.pow(SequenceCalculations.meltingTemperature(sequence) - targetMeltingTemperature, 2), startingGcScore(sequence), targetMeltingTemperature, score)
  // console.log('selfAnnealingScore', selfAnnealingScore(sequence))

  return score;
};

// From GENtle1 version
var selfAnnealingScore = function(sequence) {
  var length = sequence.length;
  var reverseSequence = sequence.split('').reverse().join('');
  var score = 0;
  var tmpScore;
  var scoreGrid = {
    'AT': 2,
    'TA': 2,
    'CG': 4,
    'GC': 4
  };

  for(var i = -(length-1); i < length; i++) {
    tmpScore = 0;
    for(var j = 0; j < length; j++) {
      if(i+j >= 0 && i+j < length) {
        tmpScore += scoreGrid[sequence[i+j] + reverseSequence[j]] || 0;
      }
    }
    score = Math.max(score, tmpScore);
  }

  return score;
};


var getPrimersWithinMeltingTemperatureRange = function(primers, opts) {
  var deltaTemperatures = {};
  var filteredPrimers = _.reject(primers, function(primer) {
    var meltingTemperature = SequenceCalculations.meltingTemperature(primer);

    deltaTemperatures[primer] = Math.max(meltingTemperature - opts.meltingTemperatureTo, 0) + 
      Math.max(opts.meltingTemperatureFrom - meltingTemperature, 0);

    return meltingTemperature < opts.meltingTemperatureFrom ||
      meltingTemperature > opts.meltingTemperatureTo;
  });

  if(filteredPrimers.length === 0) {
    filteredPrimers = [_.invert(deltaTemperatures)[_.min(_.values(deltaTemperatures))]];
  }

  return filteredPrimers;
};

var optimalPrimer = function(sequence, opts = {}) {

  _.defaults(opts, {
    minPrimerLength: 18,
    maxPrimerLength: 30,
    meltingTemperatureFrom: 57,
    meltingTemperatureTo: 62,
    targetGcContent: 0.5
  });
  
  var potentialPrimers = _.map(_.range(opts.minPrimerLength, opts.maxPrimerLength+1), function(i) {
    return sequence.substr(0, i);
  });

  // potentialPrimers = getPrimersWithinMeltingTemperatureRange(potentialPrimers, opts);

  // var scores = _.map(potentialPrimers, function(primer) {
  //   return Math.abs(opts.targetGcContent - SequenceCalculations.gcContent(primer));
  // });
  
  var targetMeltingTemperature = (opts.meltingTemperatureFrom + opts.meltingTemperatureTo) / 2;
  var scores = _.map(potentialPrimers, _.partial(primerScore, _, targetMeltingTemperature));

  var optimalPrimer = potentialPrimers[_.indexOf(scores, _.max(scores))];

  return {
    sequence: optimalPrimer,
    meltingTemperature: SequenceCalculations.meltingTemperature(optimalPrimer),
    gcContent: SequenceCalculations.gcContent(optimalPrimer)
  };
};


var getPCRProduct = function(sequence, opts = {}) {
  sequence = _.isString(sequence) ? sequence : sequence.get('sequence');

  var forwardPrimer = optimalPrimer(sequence, opts);
  var reversePrimer = optimalPrimer(SequenceTransforms.toReverseComplements(sequence), opts);

  _.defaults(opts, {
    from: 0,
    to: sequence.length - 1
  });

  sequence = sequence.substr(opts.from, opts.to);

  if(opts.stickyEnds) {
    sequence = opts.stickyEnds.start + sequence + opts.stickyEnds.end;
  }

  var forwardPrimerFrom = opts.stickyEnds ? opts.stickyEnds.start.length : 0;
  var reversePrimerFrom = sequence.length - reversePrimer.sequence.length;

  console.log('optimalForward', forwardPrimer.sequence)
  console.log('optimalReverse', reversePrimer.sequence)

  return {
    id: _.uniqueId(),
    from: opts.from, 
    to: opts.to,
    forwardPrimer: _.extend(forwardPrimer, {
      from: 0,
      to: forwardPrimer.sequence.length - 1,
      sequenceLength: forwardPrimer.sequence.length
    }),
    reversePrimer: _.extend(reversePrimer, {
      from: reversePrimerFrom,
      to: reversePrimerFrom + reversePrimer.sequence.length,
      sequenceLength: reversePrimer.sequence.length
    }),
    sequenceLength: sequence.length,
    stickyEnds: opts.stickyEnds,
    meltingTemperature: SequenceCalculations.meltingTemperature(sequence)
  };
};

export default {
  optimalPrimer: optimalPrimer,
  getPCRProduct: getPCRProduct
};