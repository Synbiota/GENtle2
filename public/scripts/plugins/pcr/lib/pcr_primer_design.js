import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import Q from 'q';
import IDT from './idt_query';

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
    minPrimerLength: 10,
    maxPrimerLength: 50,
    targetMeltingTemperature: 68,
    targetGcContent: 0.5
  });
  
  var potentialPrimers = _.map(_.range(opts.minPrimerLength, opts.maxPrimerLength+1), function(i) {
    return sequence.substr(0, i);
  });

  // potentialPrimers = getPrimersWithinMeltingTemperatureRange(potentialPrimers, opts);

  // var scores = _.map(potentialPrimers, function(primer) {
  //   return Math.abs(opts.targetGcContent - SequenceCalculations.gcContent(primer));
  // });
  
  var scores = _.map(potentialPrimers, _.partial(primerScore, _, opts.targetMeltingTemperature));

  var optimalPrimer = potentialPrimers[_.indexOf(scores, _.max(scores))];

  return {
    sequence: optimalPrimer,
    meltingTemperature: SequenceCalculations.meltingTemperature(optimalPrimer),
    gcContent: SequenceCalculations.gcContent(optimalPrimer)
  };
};

var optimalPrimer2 = function(sequence, opts = {}) {
  _.defaults(opts, {
    minPrimerLength: 10,
    maxPrimerLength: 40,
    targetMeltingTemperature: 68,
    targetGcContent: 0.5
  });

  var potentialPrimers = _.map(_.range(opts.minPrimerLength, opts.maxPrimerLength+1), function(i) {
    return sequence.substr(0, i);
  });

  return Q.promise(function(resolve, reject, notify) {
    var current = 0;
    var total = potentialPrimers.length;

    Q.all(_.map(potentialPrimers, (primer) => {
      return IDT(primer).then(function(result) {
        current++;
        notify(current/total);
        return result;
      });
    })).then(function(results) {

      var temperatures = _.map(results, (result) => result.MeltTemp);

      var scores = _.map(temperatures, function(temperature) {
        return -Math.abs(opts.targetMeltingTemperature - temperature);
      });

      var optimalIndex = _.indexOf(scores, _.max(scores));
      var optimalPrimer = potentialPrimers[optimalIndex];

      resolve({
        sequence: optimalPrimer,
        meltingTemperature: temperatures[optimalIndex],
        gcContent: SequenceCalculations.gcContent(optimalPrimer)
      });

    }).catch((e) => console.log('insideer', e));
  }).catch((e) => console.log('outsideer', e));
};


var getPCRProduct = function(sequence, opts = {}) {
  sequence = _.isString(sequence) ? sequence : sequence.get('sequence');

  var forwardPrimerPromise = optimalPrimer2(sequence, opts);
  var reversePrimerPromise = optimalPrimer2(SequenceTransforms.toReverseComplements(sequence), opts);

  var lastProgress = [0,0];

  return Q.promise(function (resolve, reject, notify) {


    Q.all([forwardPrimerPromise, reversePrimerPromise]).progress(function(current) {
      lastProgress[current.index] = current.value;
      notify(_.reduce(lastProgress, (memo, i) => memo + i/2, 0));
    }).then(function(results) {

      var [forwardAnnealingRegion, reverseAnnealingRegion] = results;

      _.defaults(opts, {
        from: 0,
        to: sequence.length - 1
      });

      sequence = sequence.substr(opts.from, opts.to);

      if(opts.stickyEnds) {
        sequence = opts.stickyEnds.start + sequence + opts.stickyEnds.end;
      }

      var forwardAnnealingFrom = opts.stickyEnds ? opts.stickyEnds.start.length : 0;
      var reverseAnnealingFrom = sequence.length - reverseAnnealingRegion.sequence.length;

      _.extend(forwardAnnealingRegion, {
        from: forwardAnnealingFrom,
        to: forwardAnnealingFrom + forwardAnnealingRegion.sequence.length - 1,
        sequenceLength: forwardAnnealingRegion.sequence.length
      });

      _.extend(reverseAnnealingRegion, {
        from: reverseAnnealingFrom,
        to: reverseAnnealingFrom + reverseAnnealingRegion.sequence.length,
        sequenceLength: reverseAnnealingRegion.sequence.length
      });

      var forwardPrimer = {
        sequence: (opts.stickyEnds ? opts.stickyEnds.start : '') + forwardAnnealingRegion.sequence,
        from: 0,
        to: (opts.stickyEnds ? opts.stickyEnds.start.length : 0) + forwardAnnealingRegion.sequence.length - 1
      };
      forwardPrimer.sequenceLength = forwardPrimer.sequence.length;
      forwardPrimer.gcContent = SequenceCalculations.gcContent(forwardPrimer.sequence);

      var reversePrimer = {
        sequence: reverseAnnealingRegion.sequence + (opts.stickyEnds ? SequenceTransforms.toReverseComplements(opts.stickyEnds.end) : ''),
        from: 0,
        to: (opts.stickyEnds ? opts.stickyEnds.end.length : 0) + reverseAnnealingRegion.sequence.length - 1
      };
      reversePrimer.sequenceLength = forwardPrimer.sequence.length;
      reversePrimer.gcContent = SequenceCalculations.gcContent(reversePrimer.sequence);


      resolve({
        id: _.uniqueId(),
        from: opts.from, 
        to: opts.to,
        forwardAnnealingRegion: forwardAnnealingRegion,
        reverseAnnealingRegion: reverseAnnealingRegion,
        forwardPrimer: forwardPrimer,
        reversePrimer: reversePrimer,
        sequenceLength: sequence.length,
        stickyEnds: opts.stickyEnds,
        meltingTemperature: SequenceCalculations.meltingTemperature(sequence)
      });

    }).catch((e) => console.log(e));

  });


  // _.defaults(opts, {
  //   from: 0,
  //   to: sequence.length - 1
  // });

  // sequence = sequence.substr(opts.from, opts.to);

  // if(opts.stickyEnds) {
  //   sequence = opts.stickyEnds.start + sequence + opts.stickyEnds.end;
  // }

  // var forwardPrimerFrom = opts.stickyEnds ? opts.stickyEnds.start.length : 0;
  // var reversePrimerFrom = sequence.length - reversePrimer.sequence.length;

  // console.log('optimalForward', forwardPrimer.sequence)
  // console.log('optimalReverse', reversePrimer.sequence)

  // return {
  //   id: _.uniqueId(),
  //   from: opts.from, 
  //   to: opts.to,
  //   forwardPrimer: _.extend(forwardPrimer, {
  //     from: 0,
  //     to: forwardPrimer.sequence.length - 1,
  //     sequenceLength: forwardPrimer.sequence.length
  //   }),
  //   reversePrimer: _.extend(reversePrimer, {
  //     from: reversePrimerFrom,
  //     to: reversePrimerFrom + reversePrimer.sequence.length,
  //     sequenceLength: reversePrimer.sequence.length
  //   }),
  //   sequenceLength: sequence.length,
  //   stickyEnds: opts.stickyEnds,
  //   meltingTemperature: SequenceCalculations.meltingTemperature(sequence)
  // };
};

export default {
  optimalPrimer: optimalPrimer,
  getPCRProduct: getPCRProduct
};