import _ from 'underscore.mixed';
import SequenceCalculations from './sequence_calculations';

var distanceToTarget = function(sequence, targetMeltingTemperature, targetCGContent) {
  return Math.sqrt(
    Math.pow(targetMeltingTemperature - SequenceCalculations.meltingTemperature(sequence), 2) + 
    Math.pow((targetCGContent - SequenceCalculations.CGContent(sequence))*100, 2)
  );
};

var optimalPrimer = function( sequence, 
                              minPrimerLength = 18,
                              maxPrimerLength = 30,
                              targetMeltingTemperature = 65,
                              targetCGContent = 0.5) {
  
  var potentialPrimers = _.map(_.range(minPrimerLength, maxPrimerLength+1), function(i) {
    return sequence.getSubSeq(0, i);
  });

  var scores = _.map(potentialPrimers, function(primer) {
    return distanceToTarget(primer, targetMeltingTemperature, targetCGContent);
  });

  console.log(potentialPrimers[_.indexOf(scores, _.min(scores))], potentialPrimers[_.indexOf(scores, _.min(scores))].length)


  return potentialPrimers[_.indexOf(scores, _.min(scores))];
};

export default {
  _calcs: SequenceCalculations,
  optimalPrimer: optimalPrimer
};