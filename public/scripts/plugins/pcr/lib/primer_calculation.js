import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import Q from 'q';
import IDT from './idt_query';

// var meltingTemperature = _.memoize(SequenceCalculations.meltingTemperature);


// var distanceToTarget = function(sequence, targetMeltingTemperature, targetGcContent) {
//   return Math.sqrt(
//     Math.pow(targetMeltingTemperature - SequenceCalculations.meltingTemperature(sequence), 2) * 0 +
//     Math.pow((targetGcContent - SequenceCalculations.gcContent(sequence))*50, 2)
//   );
// };

// var startingGcScore = function(sequence) {
//   var match = sequence.match(/^[GC]+/);
//   return match && match[0].length ? Math.pow(2, match[0].length) : 0
// };

// var primerScore = function(sequence, targetMeltingTemperature) {
//   var score = 500;

//   score -= Math.pow(SequenceCalculations.meltingTemperature(sequence) - targetMeltingTemperature, 2);
//   score += startingGcScore(sequence);
//   score -= selfAnnealingScore(sequence) / 10;

//   // console.log('primerScore', sequence)
//   // console.log(SequenceCalculations.meltingTemperature(sequence), Math.pow(SequenceCalculations.meltingTemperature(sequence) - targetMeltingTemperature, 2), startingGcScore(sequence), targetMeltingTemperature, score)
//   // console.log('selfAnnealingScore', selfAnnealingScore(sequence))

//   return score;
// };

// From GENtle1 version
// var selfAnnealingScore = function(sequence) {
//   var length = sequence.length;
//   var reverseSequence = sequence.split('').reverse().join('');
//   var score = 0;
//   var tmpScore;
//   var scoreGrid = {
//     'AT': 2,
//     'TA': 2,
//     'CG': 4,
//     'GC': 4
//   };

//   for(var i = -(length-1); i < length; i++) {
//     tmpScore = 0;
//     for(var j = 0; j < length; j++) {
//       if(i+j >= 0 && i+j < length) {
//         tmpScore += scoreGrid[sequence[i+j] + reverseSequence[j]] || 0;
//       }
//     }
//     score = Math.max(score, tmpScore);
//   }

//   return score;
// };


// var getPrimersWithinMeltingTemperatureRange = function(primers, opts) {
//   var deltaTemperatures = {};
//   var filteredPrimers = _.reject(primers, function(primer) {
//     var meltingTemperature = SequenceCalculations.meltingTemperature(primer);

//     deltaTemperatures[primer] = Math.max(meltingTemperature - opts.meltingTemperatureTo, 0) +
//       Math.max(opts.meltingTemperatureFrom - meltingTemperature, 0);

//     return meltingTemperature < opts.meltingTemperatureFrom ||
//       meltingTemperature > opts.meltingTemperatureTo;
//   });

//   if(filteredPrimers.length === 0) {
//     filteredPrimers = [_.invert(deltaTemperatures)[_.min(_.values(deltaTemperatures))]];
//   }

//   return filteredPrimers;
// };

var IDTMeltingTemperatureCache = {};

var IDTMeltingTemperature = function(sequence) {
  return IDT(sequence).then((result) => result.MeltTemp);
};

// var optimalPrimer = function(sequence, opts = {}) {

//   _.defaults(opts, {
//     minPrimerLength: 10,
//     maxPrimerLength: 50,
//     targetMeltingTemperature: 68,
//     targetGcContent: 0.5
//   });

//   var potentialPrimers = _.map(_.range(opts.minPrimerLength, opts.maxPrimerLength+1), function(i) {
//     return sequence.substr(0, i);
//   });

//   // potentialPrimers = getPrimersWithinMeltingTemperatureRange(potentialPrimers, opts);

//   // var scores = _.map(potentialPrimers, function(primer) {
//   //   return Math.abs(opts.targetGcContent - SequenceCalculations.gcContent(primer));
//   // });

//   var scores = _.map(potentialPrimers, _.partial(primerScore, _, opts.targetMeltingTemperature));

//   var optimalPrimer = potentialPrimers[_.indexOf(scores, _.max(scores))];

//   return {
//     sequence: optimalPrimer,
//     meltingTemperature: SequenceCalculations.meltingTemperature(optimalPrimer),
//     gcContent: SequenceCalculations.gcContent(optimalPrimer)
//   };
// };

// var optimalPrimer2 = function(sequence, opts = {}) {
//   _.defaults(opts, {
//     minPrimerLength: 10,
//     maxPrimerLength: 40,
//     targetMeltingTemperature: 68,
//     targetGcContent: 0.5
//   });

//   var potentialPrimers = _.map(_.range(opts.minPrimerLength, opts.maxPrimerLength+1), function(i) {
//     return sequence.substr(0, i);
//   });

//   return Q.promise(function(resolve, reject, notify) {
//     var current = 0;
//     var total = potentialPrimers.length;

//     Q.all(_.map(potentialPrimers, (primer) => {
//       return IDT(primer).then(function(result) {
//         current++;
//         notify(current/total);
//         return result;
//       });
//     })).then(function(results) {

//       var temperatures = _.map(results, (result) => result.MeltTemp);

//       var scores = _.map(temperatures, function(temperature) {
//         return -Math.abs(opts.targetMeltingTemperature - temperature);
//       });

//       var optimalIndex = _.indexOf(scores, _.max(scores));
//       var optimalPrimer = potentialPrimers[optimalIndex];

//       resolve({
//         sequence: optimalPrimer,
//         meltingTemperature: temperatures[optimalIndex],
//         gcContent: SequenceCalculations.gcContent(optimalPrimer)
//       });

//     }).catch((e) => console.log('insideer', e));
//   }).catch((e) => console.log('outsideer', e));
// };

var queryBestPrimer = function(potentialPrimers, targetMeltingTemperature, useIDT = true) {
  var meltingTemperatureTolerance = 0.6;

  return Q.promise(function(resolve, reject, notify) {

    Q.all(_.map(potentialPrimers, function(primer) {
      if(useIDT) {
        return IDTMeltingTemperature(primer.sequence).then(function(temperature) {
          notify();
          return _.extend(primer, {IDTMeltingTemperature: temperature});
        });
      } else {
        notify();
        return Q(primer);
      }
    })).then(function(results) {

      var temperatures = _.pluck(results, useIDT ? 'IDTMeltingTemperature' : 'meltingTemperature');

      var scores = _.map(temperatures, function(temperature) {
        return -Math.abs(targetMeltingTemperature - temperature);
      });

      var optimalIndex = _.indexOf(scores, _.max(scores));
      var optimalPrimer = potentialPrimers[optimalIndex];
      var optimalTemperature = temperatures[optimalIndex];

      var resolvedPrimer = {
        sequence: optimalPrimer.sequence,
        meltingTemperature: optimalTemperature,
        gcContent: SequenceCalculations.gcContent(optimalPrimer.sequence),
        id: _.uniqueId(),
      };

      if(Math.abs(optimalTemperature - targetMeltingTemperature) <= meltingTemperatureTolerance) {
        resolve(resolvedPrimer);
      } else {
        reject({
          message: 'BEST FOUND',
          primer: resolvedPrimer
        });
      }

    }, (e) => console.log(e))
  }, (e) => console.log(e));
};

/*
*  Filter Predicates
*/
var makeMeltingTemperatureFilterPredicate = function(opts) {
  return function(primer) {
    return Math.abs(primer.meltingTemperature - opts.targetMeltingTemperature) <= opts.meltingTemperatureTolerance;
  };
};


var optimalPrimer3 = function(sequence, opts = {}) {
  _.defaults(opts, {
    minPrimerLength: 10,
    maxPrimerLength: 40,
    targetMeltingTemperature: 68,
    meltingTemperatureTolerance: 1.5,
    targetGcContent: 0.5,
    useIDT: true
  });
  var lengthRange = _.range(opts.minPrimerLength, opts.maxPrimerLength+1);

  var potentialPrimers = _.map(lengthRange, function(i) {
    var primerSequence = sequence.substr(0, i);
    return {
      sequence: primerSequence,
      meltingTemperature: SequenceCalculations.meltingTemperature(primerSequence),
    };
  });

  var meltingTemperatureFilterPredicate = makeMeltingTemperatureFilterPredicate(opts);
  var filteredPotentialPrimers = _.filter(potentialPrimers, meltingTemperatureFilterPredicate);

  if(_.isEmpty(filteredPotentialPrimers)) filteredPotentialPrimers = _.clone(potentialPrimers);

  return Q.promise(function(resolve, reject, notify) {
    var current = 0;
    var total = filteredPotentialPrimers.length;
    var notifyCurrent = function(i) { notify({current: i, total: total}); };
    var resolvePrimer;

    queryBestPrimer(filteredPotentialPrimers, opts.targetMeltingTemperature, opts.useIDT)
      .progress(function() {
        current++;
        notifyCurrent(current);
      })
      .then(resolve, function() {
        total += potentialPrimers.length;
        return queryBestPrimer(potentialPrimers, opts.targetMeltingTemperature, opts.useIDT)
          .then(resolve, function(data) {
            resolve(data.primer);
          });
      });

  }, (e) => console.log(e));



  // return Q.promise(function(resolve, reject, notify) {
  //   var current = 0;
  //   var total = filteredPotentialPrimers.length;
  //   var notifyCurrent = function(i) { notify({current: i, total: total}); };

  //   Q.all(_.map(filteredPotentialPrimers, function(primer) {
  //     return IDTMeltingTemperature(primer.sequence).then(function(temperature) {
  //       current++;
  //       notifyCurrent(current)
  //       return _.extend(primer, {IDTMeltingTemperature: temperature});
  //     });
  //   })).then(function(results) {
  //     window.truc = _.map(filteredPotentialPrimers, function(primer) {
  //       return {
  //         lastBase: primer.sequence.substr(primer.sequence.length-1, 1),
  //         meltingTemperature1: SequenceCalculations.meltingTemperature1(primer.sequence),
  //         meltingTemperature2: primer.meltingTemperature,
  //         IDTMeltingTemperature: primer.IDTMeltingTemperature
  //       }

  //     })
  //     console.log('here',_.map(truc, (p) => Math.abs(p.IDTMeltingTemperature - p.meltingTemperature2)))

  //       //p.meltingTemperature1, p.meltingTemperature2, p.IDTMeltingTemperature]),


  //     notifyCurrent(total);

  //     var temperatures = _.pluck(results, 'IDTMeltingTemperature');

  //     console.log(potentialPrimers)

  //     var scores = _.map(temperatures, function(temperature) {
  //       return -Math.abs(opts.targetMeltingTemperature - temperature);
  //     });

  //     var optimalIndex = _.indexOf(scores, _.max(scores));
  //     var optimalPrimer = filteredPotentialPrimers[optimalIndex];

  //     resolve({
  //       sequence: optimalPrimer.sequence,
  //       meltingTemperature: temperatures[optimalIndex],
  //       gcContent: SequenceCalculations.gcContent(optimalPrimer.sequence)
  //     });

  //   }).catch((e) => console.log('insideer', e));
  // }).catch((e) => console.log('outsideer', e));
};


// Some rudimentary tests
if(false) {
  import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
  var sequence1 = 'AAAAAAATGATTTTTTTGGCAATTTTAGATTTAAAATCTTTAGTACTCAATGCAATAAATTATTGGGGTCCTAAAAATAATAATGGCATACAGGGTGGTGATTTTGGTTACCCTATATCAGAAAAACAAATAGATACGTCTATTATAACTTCTACTCATCCTCGTTTAATTCCACATGATTTAACAATTCCTCAAAATTTAGAAACTATTTTTACTACAACTCAAGTATTAACAAATAATACAGATTTACAACAAAGTCAAACTGTTTCTTTTGCTAAAAAAACAACGACAACAACTTCAACTTCAACTACAAATGGTTGGACAGAAGGTGGGAAAATTTCAGATACATTAGAAGAAAAAGTAAGTGTATCTATTCCTTTTATTGGAGAGGGAGGAGGAAAAAACAGTACAACTATAGAAGCTAATTTTGCACATAACTCTAGT';
  var sequence1Reversed = SequenceTransforms.toReverseComplements(sequence1);
  var sequence2 = 'ATAGAAGCTAATTTTGCACATAACTCTAGTACTACTACTTTTCAACAGGCTTCAACTGATATAGAGTGGAATATTTCACAACCAGTATTGGTTCCCCCACGTAAACAAGTTGTAGCAACATTAGTTATTATGGGAGGTAATTTTACTATTCCTATGGATTTGATGACTACTATAGATTCTACAGAACATTATAGTGGTTATCCAATATTAACATGGATATCGAGCCCCGATAATAGTTATAATGGTCCATTTATGAGTTGGTATTTTGCAAATTGGCCCAATTTACCATCGGGGTTTGGTCCTTTAAATTCAGATAATACGGTCACTTATACAGGTTCTGTTGTAAGTCAAGTATCAGCTGGTGTATATGCCACTGTACGATTTGATCAATATGATATACACAATTTAAGGACAATTGAAAAAACTTGGTATGCACGACATGC';
  var sequence2Reversed = SequenceTransforms.toReverseComplements(sequence2);
  var polyASequence = 'GAAAGAAGAAGAAGAAGAAGAAGAAGAAAAAAA';

  var opts = {
    targetMeltingTemperature: 63.5,
    meltingTemperatureTolerance: 1.5,
    useIDT: false
  };

  var checkPromisedResults = function(promisedResult, testLabel, options={}) {
    Q.when(promisedResult).then(function(result) {
      options = _.defaults(options, {
        gcContentGreaterThan: 0.3,
        minimumMeltingTemperature: 62,
      });
      console.log(`Testing ${testLabel} with result:`, result);
      console.assert(result.meltingTemperature <= 65, `meltingTemperature should be <= 65 but is ${result.meltingTemperature}`);
      console.assert(result.meltingTemperature >= options.minimumMeltingTemperature,
        `meltingTemperature should be >= ${options.minimumMeltingTemperature} but is ${result.meltingTemperature}`);
      console.assert(result.gcContent <= 0.7, `gcContent should be <= 0.7 but is ${result.gcContent}`);
      console.assert(result.gcContent >= options.gcContentGreaterThan, `gcContent should be >= ${options.gcContentGreaterThan} but is ${result.gcContent}`);
    });
  };

  // Tests
  checkPromisedResults(optimalPrimer3(sequence1, opts), 'sequence1', {gcContentGreaterThan: 0.15, minimumMeltingTemperature: 61.8});
  checkPromisedResults(optimalPrimer3(sequence1Reversed, opts), 'sequence1Reversed');
  checkPromisedResults(optimalPrimer3(sequence2, opts), 'sequence2');
  checkPromisedResults(optimalPrimer3(sequence2Reversed, opts), 'sequence2Reversed');
  checkPromisedResults(optimalPrimer3(polyASequence, opts), 'polyASequence', {gcContentGreaterThan: 0.26});
}


export default optimalPrimer3;
