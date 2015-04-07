//TODO: fix this to use 'underscore.mixed' alias import path
// import _ from 'underscore.mixed';
import _ from './../../../common/lib/underscore.mixed';

import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import Q from 'q';
import IDT from './idt_query';
import {namedHandleError} from '../../../common/lib/handle_error';
import {filterPrimerOptions, defaultPCRPrimerOptions} from './primer_defaults';
import Primer from './primer';


var checkForPolyN = SequenceCalculations.checkForPolyN;
var gcContent = SequenceCalculations.gcContent;


var IDTMeltingTemperatureCache = {};

var _IDTMeltingTemperature = function(sequence) {
  var cached = IDTMeltingTemperatureCache[sequence];
  if(cached) return cached;

  if(window.TESTS_RUNNING) throw "IDTMeltingTemperature NOT STUBBED!";
  return IDT(sequence).then((result) => {
    return parseFloat(result.MeltTemp);
  });
};
// _IDTMeltingTemperature is used to restore after stubbing
var IDTMeltingTemperature = _IDTMeltingTemperature;


var logger = function(...msg) {
  if(false) {
    console.log(...msg);
  }
};


class PotentialPrimer {
  constructor (sequence, options, deferred) {
    this.opts = options;
    this.sequence = sequence;
    this.i = 0;
    this.size = this.opts.minPrimerLength;
    this.allowShift = this.opts.allowShift;
    this.potentialPrimer = undefined;

    this.deferred = deferred;

    this.returnNearestIfNotBest = this.opts.returnNearestIfNotBest;
    this.assessedPrimersSequences = {};
    this.assessedPrimers = [];
  }

  findPrimer () {
    logger('findPrimer start');
    while(this.i <= (this.sequence.length - this.opts.minPrimerLength)) {
      if(!this.updatePotentialPrimer()) break; // fail
      logger('findPrimer loop', this.i, this.size, this.goodGCContent(), this.polyNPresent(), this.potentialPrimer);
      if(!this.allowShift && (this.i > 0)) break; // fail
      this.assessedPrimersSequences[this.potentialPrimer] = undefined;

      var polyNIsPresent = this.polyNPresent();
      if(polyNIsPresent && !this.returnNearestIfNotBest) {
        this.i += (polyNIsPresent.location + polyNIsPresent.repeated - this.opts.maxPolyN);
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

    // We have failed to find a good primer.
    var msg = 'FAIL to findPrimer';
    if(this.returnNearestIfNotBest) {
      logger('FAILED to find a perfect primer, returning the best primer we have');
      this.nearestBestPrimer().then((nearestBestPrimer) => {
        if(nearestBestPrimer) {
          nearestBestPrimer.optimal = false;
          this.deferred.resolve(nearestBestPrimer);
        } else {
          logger(msg + '. Searched for nearestBestPrimer');
          this.deferred.reject(msg);
        }
      }).done();
    } else {
      logger(msg + '. No nearestBestPrimer search');
      this.deferred.reject(msg);
    }
    return;
  }

  updatePotentialPrimer () {
    if((this.i + this.size) <= this.sequence.length) {
      if(this.opts.findFrom3PrimeEnd) {
        var len = this.sequence.length;
        this.potentialPrimer = this.sequence.substr(len-this.i-this.size, this.size);
      } else {
        this.potentialPrimer = this.sequence.substr(this.i, this.size);
      }
      return true;
    }
    logger('updatePotentialPrimer failed');
  }

  polyNPresent () {
    var present = checkForPolyN(this.potentialPrimer, {maxPolyN: this.opts.maxPolyN});
    return present;
  }

  goodGCContent () {
    var targetGcContentTolerance = this.opts.targetGcContentTolerance;
    var targetGcContent = this.opts.targetGcContent;

    var GC = gcContent(this.potentialPrimer);
    return ((GC <= (targetGcContent + targetGcContentTolerance)) && (GC >= (targetGcContent - targetGcContentTolerance)));
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
      this.storePrimer(potentialPrimer, TmFromIDT, logOurTm);
      // TODO remove assumption that increasing/decreasing potential primer size
      // increases/decreases Tm.
      if(TmFromIDT < (targetMeltingTemperature - meltingTemperatureTolerance)) {
        this.growOrShiftPotentialPrimer();
        // TODO there's a potential bug here.  We want to grow the primer and now ignore
        // our own Tm calcs, and just go with IDT... until the point at which we
        // shift and shrink back, at which point we want to then go back to checking with
        // our own calculation first.
        // This is currently unimplemented and may result in missing
        // potential primers.
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
          logger(`Good Tm ${TmFromIDT} but now GC content wrong: ${gcContent(potentialPrimer)}`);
          this.shiftPotentialPrimer();
          this.findPrimer();
        } else if(this.polyNPresent()) {
          logger(`Good Tm ${TmFromIDT} but now polyN wrong: ${potentialPrimer} (n.b. never expecting to see this message)`);
          this.shiftPotentialPrimer();
          this.findPrimer();
        } else {
          // SUCCESS!
          logger('SUCCEED to findPrimer');
          var resultingPrimer = this.toPrimer(potentialPrimer, TmFromIDT);
          resultingPrimer.optimal = true;
          this.deferred.resolve(resultingPrimer);
        }
      }
    }).catch(namedHandleError('primer_calculation, checkWithIDT'));
  }

  storePrimer (primerSequence, TmFromIDT, ourTm) {
    this.assessedPrimers.push(this.toPrimer(primerSequence, TmFromIDT, ourTm));
    delete this.assessedPrimersSequences[primerSequence];
  }

  nearestBestPrimer () {
    // Get the Tm any potential primer sequences that lack them so that they can
    // all be scored
    var potentialSequences = _.keys(this.assessedPrimersSequences);
    var sequencesWithOurTms = _.map(potentialSequences, (primerSequence) => {
      var ourTm = SequenceCalculations.meltingTemperature(primerSequence);
      var score = this.scoreTm(ourTm);
      return {primerSequence, ourTm, score};
    });
    var sortedSequencesWithOurTms = _.sortBy(sequencesWithOurTms, ({score}) => score);
    sortedSequencesWithOurTms.reverse();

    var maxIdtQueries = 30;
    var bestSequencesWithOurTms = sortedSequencesWithOurTms.slice(0, maxIdtQueries);
    if(sortedSequencesWithOurTms.length > maxIdtQueries) console.warn(`We were about to send ${sortedSequencesWithOurTms.length} queries to IDT but will only send ${bestSequencesWithOurTms.length}`);

    var primerTmPromises = _.map(bestSequencesWithOurTms, ({primerSequence}) => {
      return IDTMeltingTemperature(primerSequence);
    });

    var promiseNearestBestPrimer = Q.all(primerTmPromises).then((temperatures) => {
      _.each(temperatures, (IdtTemp, i) => {
        var primerAttributes = bestSequencesWithOurTms[i];
        this.storePrimer(primerAttributes.primerSequence, IdtTemp, primerAttributes.ourTm);
      });
    }).then(() => {
      // Score them by the Tm values from IDT
      var scores = _.map(this.assessedPrimers, _.bind(this.scorePrimer, this));
      var optimalIndex = _.indexOf(scores, _.max(scores));
      var nearestBestPrimer = this.assessedPrimers[optimalIndex];
      return nearestBestPrimer;
    });
    return promiseNearestBestPrimer;
  }

  scorePrimer (primer) {
    return this.scoreTm(primer.meltingTemperature);
  }

  scoreTm (Tm) {
    return -Math.abs(this.opts.targetMeltingTemperature - Tm);
  }

  toPrimer (primerSequence, TmFromIDT, ourTm) {
    var to, frm;
    if(this.opts.findFrom3PrimeEnd) {
      frm = this.sequence.length - this.i - primerSequence.length;
      to = this.sequence.length - this.i - 1;
    } else {
      frm = this.i;
      to = this.i + primerSequence.length - 1;
    }

    var primer = new Primer({
      sequence: primerSequence,
      from: frm,
      to: to,
      meltingTemperature: TmFromIDT,
      ourMeltingTemperature: ourTm,
      // Calculate it again.  We shouldn't need to check as with current
      // implementation (as of 2015-03-05) you can only reach here if
      // the gcContent for a shorter primer is valid.
      gcContent: gcContent(primerSequence),
    });
    return primer;
  }

}


var optimalPrimer4 = function(sequence, opts={}) {
  opts = filterPrimerOptions(opts);
  opts = defaultPCRPrimerOptions(opts);

  var deferredPrimer = Q.defer();

  var potentialPrimer = new PotentialPrimer(sequence, opts, deferredPrimer);
  potentialPrimer.findPrimer();

  return deferredPrimer.promise;
};


// Stubs for tests
var stubOutIDTMeltingTemperature = function(newFunction) {
  if(!_.isFunction(newFunction)) console.error('newFunction is not a function!', newFunction);
  IDTMeltingTemperature = newFunction;
};

var restoreIDTMeltingTemperature = function() {
  IDTMeltingTemperature = _IDTMeltingTemperature;
};


export default {optimalPrimer4, stubOutIDTMeltingTemperature, _IDTMeltingTemperature, restoreIDTMeltingTemperature};
