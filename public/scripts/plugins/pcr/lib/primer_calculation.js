import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import Q from 'q';
import IDT from './idt_query';
import handleError from '../../../common/lib/handle_error';
import {defaultSequencingPrimerOptions, defaultPCRPrimerOptions} from './primer_defaults'


var checkForPolyN = SequenceCalculations.checkForPolyN;
var gcContent = SequenceCalculations.gcContent;

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

    }, handleError);
  }, handleError);
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

  }, handleError);



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


var logger = function(...msg) {
  if(false) {
    console.log(...msg);
  }
};


class PotentialPrimer {
  constructor (sequence, options, deferred) {
    this.sequence = sequence;
    this.opts = options;
    this.i = 0;
    this.size = options.minPrimerLength;
    this.potentialPrimer = undefined;

    this.deferred = deferred;
  }

  findPrimer () {
    logger('findPrimer start');
    while(this.i <= (this.sequence.length - this.opts.minPrimerLength)) {
      logger('findPrimer loop', this.i, this.size, this.potentialPrimer);
      if(!this.updatePotentialPrimer()) break; // fail

      var polyNPresent = checkForPolyN(this.potentialPrimer);
      if(polyNPresent) {
        this.i += (polyNPresent.location + polyNPresent.repeated - this.opts.maxPolyN);
        continue;
      }

      if(this.goodGCContent()) {
        var ourTm = SequenceCalculations.meltingTemperature(this.potentialPrimer);
        if(ourTm > (this.opts.targetMeltingTemperature + this.opts.meltingTemperatureTolerance + this.opts.IDTmeltingTemperatureProximity)) {
          this.i += 1;
        } else if (ourTm < (this.opts.targetMeltingTemperature - this.opts.meltingTemperatureTolerance - this.opts.IDTmeltingTemperatureProximity)) {
          this.growOrShiftPotentialPrimer();
        } else {
          // Our calculated Tm seems good so check with IDT.
          // Now we are waiting on IDT to confirm if we have found a primer
          // with a good Tm.
          this.checkWithIDT(ourTm);
          return;
        }
      } else {
        this.growOrShiftPotentialPrimer();
      }
    }

    logger('FAIL to findPrimer');
    // We have failed to find a good primer.
    this.deferred.reject(undefined);
    return;
  }

  updatePotentialPrimer () {
    if((this.i + this.size) <= this.sequence.length) {
      this.potentialPrimer = this.sequence.substr(this.i, this.size);
      return true;
    }
    logger('updatePotentialPrimer failed');
  }

  goodGCContent () {
    var targetGcContentTolerance = this.opts.targetGcContentTolerance;
    var targetGcContent = this.opts.targetGcContent;

    var GC = gcContent(this.potentialPrimer);
    return ((GC <= (targetGcContent + targetGcContentTolerance)) && (GC >= (targetGcContent - targetGcContentTolerance)))
  }

  growOrShiftPotentialPrimer (incrementSize=1) {
    this.size += incrementSize;
    if(this.size > this.opts.maxPrimerLength) {
      this.size = this.opts.minPrimerLength;
      this.i += 1;
    }
  }

  shiftPotentialPrimer () {
    this.size = this.opts.minPrimerLength;
    this.i += 1;
  }

  checkWithIDT (logOurTm=undefined, logPreviousTmFromIDT=undefined) {
    var targetMeltingTemperature = this.opts.targetMeltingTemperature;
    var meltingTemperatureTolerance = this.opts.meltingTemperatureTolerance;
    var potentialPrimer = this.potentialPrimer;

    // debug logging
    var msg = `checkWithIDT, primer: ${potentialPrimer}`;
    if(logOurTm) msg += `, ourTm: ${logOurTm}`;
    if(logPreviousTmFromIDT) msg += `, previousTmFromIDT: ${logPreviousTmFromIDT}`;
    logger(msg);

    IDTMeltingTemperature(potentialPrimer)
    .then((TmFromIDT) => {
      if(TmFromIDT < (targetMeltingTemperature - meltingTemperatureTolerance)) {
        this.growOrShiftPotentialPrimer();
        // TODO there's a potential bug here.  We want to grow the primer and now ignore
        // our own Tm calcs, and just go with IDT... until the point at which we
        // shift and shrink back, at which point we then go back to checking with
        // our own calculation first.
        this.findPrimer();
      } else if(TmFromIDT > (targetMeltingTemperature + meltingTemperatureTolerance)) {
        this.size -= 1;
        if(this.size < this.opts.minPrimerLength) {
          // don't grow again, just shift by 1.
          this.shiftPotentialPrimer();
          this.findPrimer();
        } else {
          // Manually update primer based on new size.  No need to check if
          // succeeded as size is decreasing
          // Also no need to check GC and polyN as we'll do this later
          this.updatePotentialPrimer();
          this.checkWithIDT(undefined, TmFromIDT);
        }
      } else {
        // Check other parameters are still correct
        if(!this.goodGCContent()) {
          logger(`Good Tm ${TmFromIDT} but now GC content wrong: ${gcContent(this.potentialPrimer)}`);
          this.shiftPotentialPrimer();
          this.findPrimer();
        } else if(checkForPolyN(this.potentialPrimer)) {
          logger(`Good Tm ${TmFromIDT} but now polyN wrong: ${this.potentialPrimer} (n.b. never expecting to see this message)`);
          this.shiftPotentialPrimer();
          this.findPrimer();
        } else {
          // SUCCESS!
          logger('SUCCEED to findPrimer');
          this.deferred.resolve({
            sequence: this.potentialPrimer,
            from: this.i,
            to: this.i + potentialPrimer.length - 1,
            meltingTemperature: TmFromIDT,
            // Calculate it again.  We shouldn't need to check as with current
            // implementation (as of 2015-03-05) you can only reach here if
            // the gcContent for a shorter primer is valid.
            gcContent: gcContent(potentialPrimer),
          });
        }
      }
    }).catch(handleError);
  }

}


var optimalPrimer4 = function(sequence, opts={}) {
  opts = defaultPCRPrimerOptions(opts);

  var deferredPrimer = Q.defer();

  var potentialPrimer = new PotentialPrimer(sequence, opts, deferredPrimer);
  potentialPrimer.findPrimer();

  return deferredPrimer.promise;
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

  var checkResult = function(result, testLabel, options={}) {
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
    if(options.expectedSequence) {
      console.assert(result.sequence === options.expectedSequence, `expected sequence: ${options.expectedSequence} but got ${result.sequence}`);
    }
  };

  var asyncCheckResultFactory = function(testLabel, options={}) {
    return function(result) {
      checkResult(result, testLabel, options);
    };
  };

  var checkPromisedResults = function(promisedResult, testLabel, options={}) {
    Q.when(promisedResult).then(asyncCheckResultFactory(testLabel, options));
  };

  // Test optimalPrimer3
  checkPromisedResults(optimalPrimer3(sequence1, opts),
    'optimalPrimer3 with sequence1',
    {gcContentGreaterThan: 0.15, minimumMeltingTemperature: 61.8}
  );
  checkPromisedResults(optimalPrimer3(sequence1Reversed, opts),
    'optimalPrimer3 with sequence1Reversed'
  );
  checkPromisedResults(optimalPrimer3(sequence2, opts),
    'optimalPrimer3 with sequence2'
  );
  checkPromisedResults(optimalPrimer3(sequence2Reversed, opts),
    'optimalPrimer3 with sequence2Reversed'
  );
  checkPromisedResults(optimalPrimer3(polyASequence, opts),
    'optimalPrimer3 with polyASequence',
    {gcContentGreaterThan: 0.26}
  );

  // Test checkForPolyN
  console.assert(checkForPolyN('AAAAAA', {maxPolyN: 5}), 'Should have found a polyN sequence');
  console.assert(checkForPolyN('GGGGGG', {maxPolyN: 5}), 'Should have found a polyN sequence');
  console.assert(!checkForPolyN('AAAAA', {maxPolyN: 5}), 'Should not have found a polyN sequence');
  console.assert(!checkForPolyN('GGGGG', {maxPolyN: 5}), 'Should not have found a polyN sequence');
  console.assert(!checkForPolyN('AAAGAAA', {maxPolyN: 5}), 'Should not have found a polyN sequence');

  // Test checkForPolyN failEarly
  var result = checkForPolyN('AAAGGG', {maxPolyN: 2});
  console.assert(result.repeatedBase === 'G', `Should not fail early ${result.repeatedBase}`);
  console.assert(result.location === 3, `Should not fail early ${result.location}`);
  console.assert(result.repeated === 3, `Should not fail early ${result.repeated}`);
  var result = checkForPolyN('AAAGGG', {maxPolyN: 2, failEarly: true});
  console.assert(result.repeatedBase === 'A', `Should fail early ${result.repeatedBase}`);
  console.assert(result.location === 0, `Should fail early ${result.location}`);
  console.assert(result.repeated === 3, `Should fail early ${result.repeated}`);

  // Test gcContent
  console.assert(gcContent('AA') === 0, 'Expecting 0 GC content');
  console.assert(gcContent('GG') === 1, 'Expecting 1 GC content');
  console.assert(gcContent('AG') === 0.5, 'Expecting 0.5 GC content');


  // Test optimalPrimer4
  var oldIDTMeltingTemperature = IDTMeltingTemperature;
  var stubbedIDTMeltingTemperature = function(potentialPrimer) {
    return Q.promise(function(resolve) {
      var Tms = {
        'GGGGTCCTAAAAATAATAATGGCATACAGG': 65.6,
        'GGGGTCCTAAAAATAATAATGGCATACAG': 64.2,
        'GGGTCCTAAAAATAATAATGGCATACAGGG': 65.6,
        'GGGTCCTAAAAATAATAATGGCATACAGG': 64.2,
        'AATAATAATGGCATACAGGGTGGTG': 63.3,
        'CTCTAGTACTACTACTTTTCAACAGGC': 62.6,
      };
      var Tm = Tms[potentialPrimer];
      if(!Tm) throw `Unknown IDT Tm for ${potentialPrimer}.  Look up on https://www.idtdna.com/calc/analyzer with Mg++ Conc of 2mM, and add to \`Tms\` dict.`;
      console.log(`stubbedIDTMeltingTemperature received: ${potentialPrimer}, responding with Tm: ${Tm}`);
      resolve(Tm);
    });
  };
  IDTMeltingTemperature = stubbedIDTMeltingTemperature;

  var optimalPrimer4_TestFactory = function(sequence, testLabel, opts) {
    console.log(`Set up optimalPrimer4 test for ${testLabel}`);
    var optimalPrimer4_TestFinished = Q.defer();

    optimalPrimer4(sequence, defaultSequencingPrimerOptions()).then(
    function(optimalPrimer){
      console.log(`Got optimalPrimer4 results for ${testLabel}, optimalPrimer:`, optimalPrimer);
      checkResult(optimalPrimer, testLabel, opts);
      optimalPrimer4_TestFinished.resolve();
    });
    return optimalPrimer4_TestFinished.promise;
  };

  Q.all([
      optimalPrimer4_TestFactory(sequence1,
      'optimalPrimer4 with sequence1',
      {expectedSequence: 'AATAATAATGGCATACAGGGTGGTG'}),
      optimalPrimer4_TestFactory(sequence2,
      'optimalPrimer4 with sequence2',
      {expectedSequence: 'CTCTAGTACTACTACTTTTCAACAGGC'})
  ]).then(function () {
    console.log('Restoring IDTMeltingTemperature function');
    IDTMeltingTemperature = oldIDTMeltingTemperature;
  });

}


export default optimalPrimer3;
