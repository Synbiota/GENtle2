import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import Q from 'q';
import IDT from './idt_query';
import {namedHandleError} from '../../../common/lib/handle_error';
import Primer from './primer';
import SequenceRange from '../../../library/sequence-model/range';


var checkForPolyN = SequenceCalculations.checkForPolyN;
var gcContent = SequenceCalculations.gcContent;


var _IDTMeltingTemperature = function(sequence) {
  return IDT(sequence).then((result) => {
    return parseFloat(result.MeltTemp);
  });
};

// IDTMeltingTemperature is used to restore after stubbing
var IDTMeltingTemperature = function(sequence) {
  if(window.TESTS_RUNNING) throw "NOT STUBBED!";
  return _IDTMeltingTemperature(sequence);
};


var logger = function(...msg) {
  if(false) {
    console.log(...msg);
  }
};


/**
 * @function _getSequenceToSearch
 * function abstracted to aid testing.  Ultimately it sets several attributes on
 * the primerModel including:
 *   * totalSequenceLength
 *   * frm
 *   * sequenceToSearch
 * @param  {PotentialPrimer} primerModel
 */
var _getSequenceToSearch = function(primerModel) {
  primerModel.totalSequenceLength = primerModel.sequenceModel.getLength(primerModel.sequenceModel.STICKY_END_FULL);

  primerModel.frm = primerModel.sequenceOptions.from;
  if(primerModel.sequenceOptions.findOnReverseStrand) {
    primerModel.frm = primerModel.totalSequenceLength - primerModel.frm;
    primerModel.frm = Math.max(0, primerModel.frm - primerModel.sequenceOptions.maxSearchSpace);
  }
  // logger(primerModel.sequenceOptions.findOnReverseStrand, totalSequenceLength, `primerModel.sequenceOptions.from:${primerModel.sequenceOptions.from}, ${primerModel.frm}`)
  let to = primerModel.frm + primerModel.sequenceOptions.maxSearchSpace - 1;
  primerModel.sequenceToSearch = primerModel.sequenceModel.getSubSeq(primerModel.frm, to, primerModel.sequenceModel.STICKY_END_FULL);
  if(primerModel.sequenceOptions.findOnReverseStrand) {
    primerModel.sequenceToSearch = SequenceTransforms.toReverseComplements(primerModel.sequenceToSearch);
  }

  // Check there are enough bases to satisfy the minimum size for a primer
  // (a valid primer may of course still not be found)
  if(primerModel.sequenceToSearch.length < primerModel.options.minPrimerLength) {
    if(primerModel.sequenceOptions.findOnReverseStrand) {
      primerModel.deferred.reject("sequence is too short to leave enough sequence length to find the primer");
    } else {
      primerModel.deferred.reject("`sequenceOptions.from` is too large or sequence is too short to leave enough sequence length to find the primer");
    }
  }
};


class PotentialPrimer {
  /**
   * @constructor PotentialPrimer
   * @param  {SequenceModel} sequenceModel
   * @param  {Object} sequenceOptions  Keys: `from`, `maxSearchSpace`, `findOnReverseStrand`
   * @param  {Object} options
   */
  constructor(sequenceModel, sequenceOptions, options) {
    this.deferred = Q.defer();

    this.sequenceModel = sequenceModel;
    this.sequenceOptions = sequenceOptions;
    this.options = options;
    _getSequenceToSearch(this);

    this.i = 0;
    this.minPrimerLength = options.minPrimerLength;
    this.size = this.minPrimerLength;
    this.allowShift = options.allowShift;
    this.findFrom3PrimeEnd = options.findFrom3PrimeEnd;
    this.potentialPrimer = undefined;

    this.returnNearestIfNotBest = options.returnNearestIfNotBest;
    this.maxPolyN = options.maxPolyN;
    this.targetGcContent = options.targetGcContent;
    this.maxPrimerLength = options.maxPrimerLength;
    this.minPrimerLength = options.minPrimerLength;
    this.targetGcContentTolerance = options.targetGcContentTolerance;
    this.targetMeltingTemperature = options.targetMeltingTemperature;
    this.meltingTemperatureTolerance = options.meltingTemperatureTolerance;
    this.IDTmeltingTemperatureProximity = options.IDTmeltingTemperatureProximity;

    this.primersEncountered = {};

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

  findPrimer() {
    logger('findPrimer start');
    while(this.i <= (this.sequenceToSearch.length - this.minPrimerLength)) {
      if(!this.updatePotentialPrimer()) break; // fail
      logger(`findPrimer loop. findOnReverseStrand:${this.sequenceOptions.findOnReverseStrand}, ` +
        `frm:${this.frm}, i:${this.i}, size:${this.size}, GC:${this.goodGCContent()}, ` +
        `polyN:${!!this.polyNPresent()}, ${this.potentialPrimer}`
      );
      if(!this.allowShift && (this.i > 0)) break; // fail
      this.storePrimer();

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
          this.checkWithIDT(ourTm)
          .then(() => this.notifyProgress())
          .done();
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
      this.nearestBestPrimer()
      .then((nearestBestPrimer) => {
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

  updatePotentialPrimer() {
    var len = this.sequenceToSearch.length;
    if((this.i + this.size) <= len) {
      if(this.findFrom3PrimeEnd) {
        this.potentialPrimer = this.sequenceToSearch.substr(len-this.i-this.size, this.size);
      } else {
        this.potentialPrimer = this.sequenceToSearch.substr(this.i, this.size);
      }
      return true;
    }
    logger('updatePotentialPrimer failed');
  }

  polyNPresent() {
    var present = checkForPolyN(this.potentialPrimer, {maxPolyN: this.maxPolyN});
    return present;
  }

  goodGCContent() {
    var GC = gcContent(this.potentialPrimer);
    return ((GC <= (this.targetGcContent + this.targetGcContentTolerance)) && (GC >= (this.targetGcContent - this.targetGcContentTolerance)));
  }

  growOrShiftPotentialPrimer(incrementSize=1) {
    this.size += incrementSize;
    if(this.size > this.maxPrimerLength) {
      this.notifyProgress();
      this.incrementProgressTotal(this.progress.initialTotal);
      this.size = this.minPrimerLength;
      this.i += 1;
    }
  }

  shiftPotentialPrimer() {
    this.size = this.minPrimerLength;
    this.i += 1;
  }

  checkWithIDT(logOurTm=undefined, logPreviousTmFromIDT=undefined) {
    var targetMeltingTemperature = this.targetMeltingTemperature;
    var meltingTemperatureTolerance = this.meltingTemperatureTolerance;

    // debug logging
    var msg = `checkWithIDT, primer: ${this.potentialPrimer}`;
    if(logOurTm) msg += `, ourTm: ${logOurTm}`;
    if(logPreviousTmFromIDT) msg += `, previousTmFromIDT: ${logPreviousTmFromIDT}`;
    logger(msg);

    return IDTMeltingTemperature(this.potentialPrimer)
    .then((TmFromIDT) => {
      this.storePrimer(TmFromIDT, logOurTm);
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
          logger(`Good Tm ${TmFromIDT} but now GC content wrong: ${gcContent(this.potentialPrimer)}`);
          this.shiftPotentialPrimer();
          this.findPrimer();
        } else if(this.polyNPresent()) {
          logger(`Good Tm ${TmFromIDT} but now polyN wrong: ${this.potentialPrimer} (n.b. never expecting to see this message)`);
          this.shiftPotentialPrimer();
          this.findPrimer();
        } else {
          // SUCCESS!
          var primerAttributes = this.primersEncountered[this.potentialPrimer];
          var resultingPrimer = this.toPrimer(primerAttributes);
          resultingPrimer.optimal = true;
          logger('SUCCEED to findPrimer', this.potentialPrimer, JSON.stringify(resultingPrimer, null, 2));
          this.deferred.resolve(resultingPrimer);
        }
      }
    }).catch(namedHandleError('primer_calculation, checkWithIDT'));
  }

  storePrimer(TmFromIDT=undefined, ourTm=undefined) {
    var attributes = {
      primerSequenceBases: this.potentialPrimer,
      i: this.i,
    };
    if(TmFromIDT !== undefined) attributes.meltingTemperature = TmFromIDT;
    if(ourTm !== undefined) attributes.ourMeltingTemperature = ourTm;

    var existingAttributes = this.primersEncountered[this.potentialPrimer] || {};
    this.primersEncountered[this.potentialPrimer] = _.extend(existingAttributes, attributes);
  }

  nearestBestPrimer() {
    // Get the Tm any potential primer sequences that lack them so that they can
    // all be scored
    var attributesOfPotentialPrimers = _.values(this.primersEncountered);
    var primerAttributesWithOurTms = _.map(attributesOfPotentialPrimers, (primerAttributes) => {
      var ourTm = SequenceCalculations.meltingTemperature(primerAttributes.primerSequenceBases);
      var score = this.scoreTm(ourTm);
      primerAttributes.ourMeltingTemperature = ourTm;
      primerAttributes.score = score;
      return primerAttributes;
    });
    var sortedPrimerAttributesWithOurTms = _.sortBy(primerAttributesWithOurTms, ({score}) => score);
    sortedPrimerAttributesWithOurTms.reverse();

    var maxIdtQueries = 30;
    var bestPrimerAttributesWithOurTm = sortedPrimerAttributesWithOurTms.slice(0, maxIdtQueries);
    if(sortedPrimerAttributesWithOurTms.length > maxIdtQueries) console.warn(`We were about to send ${sortedPrimerAttributesWithOurTms.length} queries to IDT but will only send ${bestPrimerAttributesWithOurTm.length}`);

    this.incrementProgressTotal(bestPrimerAttributesWithOurTm.length);

    var primerTmPromises = _.map(bestPrimerAttributesWithOurTm, ({primerSequenceBases}) => {
      return IDTMeltingTemperature(primerSequenceBases)
        .then((IdtTemp) => {
          this.notifyProgress();
          return IdtTemp;
        });
    });

    var promiseNearestBestPrimer = Q.all(primerTmPromises)
    .then((temperatures) => {
      var assessedPrimerAttributes = [];
      _.each(temperatures, (IdtTemp, i) => {
        var primerAttributes = bestPrimerAttributesWithOurTm[i];
        primerAttributes.meltingTemperature = IdtTemp;
        assessedPrimerAttributes.push(primerAttributes);
      });

      // Score them by the Tm values from IDT
      var scores = _.map(assessedPrimerAttributes, _.bind(this.scorePrimer, this));
      var optimalIndex = _.indexOf(scores, _.max(scores));
      var nearestBestPrimerAttributes = assessedPrimerAttributes[optimalIndex];
      return this.toPrimer(nearestBestPrimerAttributes);
    });
    return promiseNearestBestPrimer;
  }

  scorePrimer(primerAttributes) {
    return this.scoreTm(primerAttributes.meltingTemperature);
  }

  scoreTm(Tm) {
    return -Math.abs(this.targetMeltingTemperature - Tm);
  }

  toPrimer(primerAttributes) {
    var {primerSequenceBases, i, meltingTemperature, ourMeltingTemperature} = primerAttributes;
    logger(primerAttributes, 'from3Prime:', this.findFrom3PrimeEnd, 'onRev:', this.sequenceOptions.findOnReverseStrand, 'frm:', this.frm, this.sequenceToSearch.length, this.totalSequenceLength);
    let frm;
    // Correct the frm value to be the correct value within the sequence of
    // bases in this.sequenceToSearch
    if(this.findFrom3PrimeEnd) {
      frm = this.sequenceToSearch.length - i - primerSequenceBases.length;
    } else {
      frm = i;
    }

    // Correct the frm value to account for the position of `this.sequenceToSearch`
    // within the parentSequence
    if(this.sequenceOptions.findOnReverseStrand) {
      frm = this.sequenceToSearch.length - frm - primerSequenceBases.length;
    }
    frm = this.frm + frm;

    var primer = new Primer({
      parentSequence: this.sequenceModel,
      range: new SequenceRange({
        from: frm,
        size: primerSequenceBases.length,
        reverse: this.sequenceOptions.findOnReverseStrand,
      }),
      meltingTemperature: meltingTemperature,
      ourMeltingTemperature: ourMeltingTemperature,
      // Calculate it again.  We shouldn't need to check as with current
      // implementation (as of 2015-03-05) you can only reach here if
      // the gcContent for a shorter primer is valid.
      gcContent: gcContent(primerSequenceBases),
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
 * Used for finding any primer.
 *
 * @param  {SequenceModel} sequenceModel
 * @param  {Object} sequenceOptions
 * @param  {Object} opts
 * @return {Promise}
 */
var optimalPrimer4 = function(sequenceModel, sequenceOptions, opts) {
  sequenceOptions = _.defaults(sequenceOptions, {
    from: 0,
    maxSearchSpace: sequenceModel.getLength(sequenceModel.STICKY_END_FULL),
    findOnReverseStrand: false,
  });

  var potentialPrimer = new PotentialPrimer(sequenceModel, sequenceOptions, opts);
  potentialPrimer.findPrimer();
  return potentialPrimer.deferred.promise;
};


// Stubs for tests
var oldIDTMeltingTemperature;
var stubOutIDTMeltingTemperature = function(newFunction) {
  if(!_.isFunction(newFunction)) console.error('newFunction is not a function!', newFunction);
  if(!oldIDTMeltingTemperature) oldIDTMeltingTemperature = IDTMeltingTemperature;
  IDTMeltingTemperature = newFunction;
};

var restoreIDTMeltingTemperature = function() {
  IDTMeltingTemperature = _IDTMeltingTemperature;
  oldIDTMeltingTemperature = undefined;
};


export default {
  _getSequenceToSearch,
  optimalPrimer4,
  stubOutIDTMeltingTemperature,
  _IDTMeltingTemperature,
  restoreIDTMeltingTemperature,
};
