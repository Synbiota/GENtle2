import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';

var distanceToTarget = function(sequence, targetMeltingTemperature, targetCGContent) {
  return Math.sqrt(
    Math.pow(targetMeltingTemperature - SequenceCalculations.meltingTemperature(sequence), 2) + 
    Math.pow((targetCGContent - SequenceCalculations.CGContent(sequence))*50, 2)
  );
};

var optimalPrimer = function(sequence, opts = {}) {

  _.defaults(opts, {
    minPrimerLength: 18,
    maxPrimerLength: 30,
    targetMeltingTemperature: 65,
    targetCGContent: 0.5
  });
  
  var potentialPrimers = _.map(_.range(opts.minPrimerLength, opts.maxPrimerLength+1), function(i) {
    return sequence.substr(0, i);
  });

  var scores = _.map(potentialPrimers, function(primer) {
    return distanceToTarget(primer, opts.targetMeltingTemperature, opts.targetCGContent);
  });

  var optimalPrimer = potentialPrimers[_.indexOf(scores, _.min(scores))];

  return {
    sequence: optimalPrimer,
    meltingTemperature: SequenceCalculations.meltingTemperature(optimalPrimer),
    CGContent: SequenceCalculations.CGContent(optimalPrimer)
  };
};


var getPCRProduct = function(sequence, opts = {}) {
  sequence = _.isString(sequence) ? sequence : sequence.get('sequence');

  var startPrimer = optimalPrimer(sequence, opts);
  var endPrimer = optimalPrimer(SequenceTransforms.toReverseComplements(sequence), opts);


  if(opts.stickyEnds) {
    sequence = opts.stickyEnds.start + sequence + opts.stickyEnds.end;
  }

  var startPrimerFrom = opts.stickyEnds ? opts.stickyEnds.start.length : 0;
  var endPrimerFrom = sequence.length - endPrimer.sequence.length;

  return {
    id: _.uniqueId(),
    startPrimer: _.extend(startPrimer, {
      from: 0,
      to: startPrimer.sequence.length - 1,
      length: startPrimer.sequence.length
    }),
    endPrimer: _.extend(endPrimer, {
      from: endPrimerFrom,
      to: endPrimerFrom + endPrimer.sequence.length,
      length: endPrimer.sequence.length
    }),
    length: sequence.length,
    stickyEnds: opts.stickyEnds,
    meltingTemperature: SequenceCalculations.meltingTemperature(sequence)
  };
};

export default {
  optimalPrimer: optimalPrimer,
  getPCRProduct: getPCRProduct
};