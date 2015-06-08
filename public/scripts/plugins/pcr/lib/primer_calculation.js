import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import Q from 'q';
import IDT from './idt_query';
import {namedHandleError} from '../../../common/lib/handle_error';
import Primer from './primer';


var checkForPolyN = SequenceCalculations.checkForPolyN;
var gcContent = SequenceCalculations.gcContent;


var _IDTMeltingTemperature = function(sequence) {
  //TODO make this work
  if(window.TESTS_RUNNING) throw "NOT STUBBED!";
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
  constructor (sequenceBases, options) {
    this.sequence = sequenceBases;
    this.i = 0;
    this.minPrimerLength = options.minPrimerLength;
    this.size = this.minPrimerLength;
    this.allowShift = options.allowShift;
    this.findFrom3PrimeEnd = options.findFrom3PrimeEnd;
    this.potentialPrimer = undefined;

    this.deferred = Q.defer();

    this.returnNearestIfNotBest = options.returnNearestIfNotBest;
    this.maxPolyN = options.maxPolyN;
    this.targetGcContent = options.targetGcContent;
    this.maxPrimerLength = options.maxPrimerLength;
    this.minPrimerLength = options.minPrimerLength;
    this.targetGcContentTolerance = options.targetGcContentTolerance;
    this.targetMeltingTemperature = options.targetMeltingTemperature;
    this.meltingTemperatureTolerance = options.meltingTemperatureTolerance;
    this.IDTmeltingTemperatureProximity = options.IDTmeltingTemperatureProximity;

    this.assessedPrimersSequences = {};
    this.assessedPrimers = [];

    var totalProgress = options.maxPrimerLength - options.minPrimerLength + 1;
    this.progress = {
      current: 0,
      total: 0,
      isFallback: false,
      initialTotal: totalProgress * 3/2
    };
    this.incrementProgressTotal(this.progress.initialTotal);
    this.deferred.notify(this.progress);
  }

  findPrimer () {
    logger('findPrimer start');
    while(this.i <= (this.sequence.length - this.minPrimerLength)) {
      if(!this.updatePotentialPrimer()) break; // fail
      logger('findPrimer loop', this.i, this.size, this.goodGCContent(), this.polyNPresent(), this.potentialPrimer);
      if(!this.allowShift && (this.i > 0)) break; // fail
      this.assessedPrimersSequences[this.potentialPrimer] = undefined;

      var polyNIsPresent = this.polyNPresent();
      if(polyNIsPresent && !this.returnNearestIfNotBest) {
        this.i += (polyNIsPresent.location + polyNIsPresent.repeated - this.maxPolyN);
        continue;
      }

      if(this.goodGCContent()) {
        var ourTm = SequenceCalculations.meltingTemperature(this.potentialPrimer);
        var largest = this.targetMeltingTemperature + this.meltingTemperatureTolerance + this.IDTmeltingTemperatureProximity;
        var smallest = this.targetMeltingTemperature - this.meltingTemperatureTolerance - this.IDTmeltingTemperatureProximity;
        logger('ourTm', this.potentialPrimer, ourTm, 'largest, smallest: ', largest, smallest);
        if(ourTm > largest) {
          this.i += 1;
        } else if (ourTm < smallest) {
          this.growOrShiftPotentialPrimer();
        } else {
          // Our calculated Tm seems good so check with IDT.
          // Now we are waiting on IDT to confirm if we have found a primer
          // with a good Tm.
          this.checkWithIDT(ourTm).then(() => this.notifyProgress());
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
    var len = this.sequence.length;
    if((this.i + this.size) <= len) {
      if(this.findFrom3PrimeEnd) {
        this.potentialPrimer = this.sequence.substr(len-this.i-this.size, this.size);
      } else {
        this.potentialPrimer = this.sequence.substr(this.i, this.size);
      }
      return true;
    }
    logger('updatePotentialPrimer failed');
  }

  polyNPresent () {
    var present = checkForPolyN(this.potentialPrimer, {maxPolyN: this.maxPolyN});
    return present;
  }

  goodGCContent () {
    var GC = gcContent(this.potentialPrimer);
    return ((GC <= (this.targetGcContent + this.targetGcContentTolerance)) && (GC >= (this.targetGcContent - this.targetGcContentTolerance)));
  }

  growOrShiftPotentialPrimer (incrementSize=1) {
    this.size += incrementSize;
    if(this.size > this.maxPrimerLength) {
      this.notifyProgress();
      this.incrementProgressTotal(this.progress.initialTotal);
      this.size = this.minPrimerLength;
      this.i += 1;
    }
  }

  shiftPotentialPrimer () {
    this.size = this.minPrimerLength;
    this.i += 1;
  }

  checkWithIDT (logOurTm=undefined, logPreviousTmFromIDT=undefined) {
    var targetMeltingTemperature = this.targetMeltingTemperature;
    var meltingTemperatureTolerance = this.meltingTemperatureTolerance;
    var potentialPrimer = this.potentialPrimer;

    // debug logging
    var msg = `checkWithIDT, primer: ${potentialPrimer}`;
    if(logOurTm) msg += `, ourTm: ${logOurTm}`;
    if(logPreviousTmFromIDT) msg += `, previousTmFromIDT: ${logPreviousTmFromIDT}`;
    logger(msg);

    return IDTMeltingTemperature(potentialPrimer)
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
        if(this.size < this.minPrimerLength) {
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

    this.incrementProgressTotal(bestSequencesWithOurTms.length);

    var primerTmPromises = _.map(bestSequencesWithOurTms, ({primerSequence}) => {
      return IDTMeltingTemperature(primerSequence)
        .then((data) => {
          this.notifyProgress();
          return data;
        });
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
    return -Math.abs(this.targetMeltingTemperature - Tm);
  }

  toPrimer (primerSequence, TmFromIDT, ourTm) {
    var to, frm;
    if(this.findFrom3PrimeEnd) {
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

  notifyProgress() {
    this.progress.current ++;
    this.deferred.notify(this.progress);
  }

  incrementProgressTotal(totalIncrement) {
    var progress = this.progress;
    var current = progress.current;
    var total = progress.total;
    var newCurrent = current > 0 ? current * totalIncrement / (total - current) : 0;
    progress.total = totalIncrement + newCurrent;
    progress.current = newCurrent;
  }

}


/**
 * @function optimalPrimer4
 * Has defaults for PCR primers but can be used for finding any primer.
 * @param  {String} sequenceBases
 * @param  {Object} opts
 * @return {Promise}
 */
var optimalPrimer4 = function(sequenceBases, opts) {
  var potentialPrimer = new PotentialPrimer(sequenceBases, opts);
  potentialPrimer.findPrimer();
  return potentialPrimer.deferred.promise;
};


/**
 * @function getSequenceBaseNumberAndLength
 * @param  {String} sequenceBases
 * @param  {Integer} maxSearchSpace
 * @param  {Boolean} reverseStrand=false  Take subsequence from reverseStrand.
 * @param  {Integer} frm  The base from which the subsequence starts (or if on
 *                        the reverseStrand, the base at which the subsequence
 *                        ends).
 * @return {Object} Contains calculated `frm` and `lengthToTake` values.
 */
var getSequenceBaseNumberAndLength = function(sequenceBases, maxSearchSpace, reverseStrand=false, frm=undefined) {
  var lengthToTake;
  if(reverseStrand) {
    if(_.isUndefined(frm)) frm = sequenceBases.length - 1;
    lengthToTake = Math.min(frm + 1, maxSearchSpace);
    frm = Math.max(0, frm - maxSearchSpace + 1);
  } else {
    if(_.isUndefined(frm)) frm = 0;
    lengthToTake = maxSearchSpace;
  }
  return {frm, lengthToTake};
};


/**
 * @function getSequenceToSearch
 * @param  {String} sequenceBases
 * @param  {Integer} minPrimerLength
 * @param  {Integer} maxSearchSpace
 * @param  {Boolean} reverseStrand=false  Take subsequence from reverseStrand.
 * @param  {Integer} frm  The base from which the subsequence starts (or if on
 *                        the reverseStrand, the base at which the subsequence
 *                        ends).
 * @return {Object}  `sequenceToSearch` and `frm` used.
 */
var getSequenceToSearch = function(sequenceBases, minPrimerLength, maxSearchSpace, reverseStrand=false, frmBase=undefined) {
  var {frm, lengthToTake} = getSequenceBaseNumberAndLength(sequenceBases, maxSearchSpace, reverseStrand, frmBase);

  var sequenceToSearch;
  sequenceToSearch = sequenceBases.substr(frm, lengthToTake);
  if(reverseStrand) {
    sequenceToSearch = SequenceTransforms.toReverseComplements(sequenceToSearch);
  }

  if(sequenceToSearch.length < minPrimerLength) {
    if(reverseStrand) {
      throw "getSequenceToSearch `frm` is too small or sequence is too short to leave enough sequence length to find the primer";
    } else {
      throw "getSequenceToSearch `frm` is too large or sequence is too short to leave enough sequence length to find the primer";
    }
  }

  return {sequenceToSearch, frm};
};


/**
 * @function getSequenceToSearchUsingPrimer
 * This function is used for obtaining the next sequence to
 * search for a primer in when you have a previous primer 5' to this sequence
 * of interest when the next primer should be located.
 *
 * @param  {String} sequenceBases
 * @param  {Integer} minPrimerLength
 * @param  {Integer} maxSearchSpace
 * @param  {Boolean} reverseStrand  Take subsequence from reverseStrand.
 * @param  {Primer} primer
 * @return {Object}  `sequenceToSearch` and `frm` used.
 */
var getSequenceToSearchUsingPrimer = function(sequenceBases, minPrimerLength, maxSearchSpace, primer) {
  var correctedFrom = primer.reverse ? primer.to : (primer.to + 1);
  return getSequenceToSearch(sequenceBases, minPrimerLength, maxSearchSpace, primer.reverse, correctedFrom);
};


// Stubs for tests
var stubOutIDTMeltingTemperature = function(newFunction) {
  if(!_.isFunction(newFunction)) console.error('newFunction is not a function!', newFunction);
  IDTMeltingTemperature = newFunction;
};

var restoreIDTMeltingTemperature = function() {
  IDTMeltingTemperature = _IDTMeltingTemperature;
};


export default {
  optimalPrimer4,
  getSequenceToSearch,
  getSequenceToSearchUsingPrimer,
  stubOutIDTMeltingTemperature,
  _IDTMeltingTemperature,
  restoreIDTMeltingTemperature,
};
