import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from 'gentle-sequence-transforms';
import Q from 'q';
import IDT from './idt_query';
import {namedHandleError} from '../../../common/lib/handle_error';
import Primer from './primer';
import SequenceRange from '../../../library/sequence-model/range';
import errors from './errors';


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


class PotentialPrimer {
  /**
   * @method _getSequenceToSearch
   * Function extracted to static method to aid testing.  Ultimately it returns
   * attributes which should be applied to the potentialPrimerModel.
   * @param  {PotentialPrimer} potentialPrimerModel
   * @return {Object} Contains the following keys:
   *                  * totalSequenceLength
   *                  * frm
   *                  * sequenceToSearch
   */
  static _getSequenceToSearch(potentialPrimerModel) {
    var primer = potentialPrimerModel;
    var totalSequenceLength = primer.sequenceModel.getLength(primer.sequenceModel.STICKY_END_FULL);

    var frm = primer.sequenceOptions.frm;
    if(primer.sequenceOptions.findOnReverseStrand) {
      frm = totalSequenceLength - frm;
      frm = Math.max(0, frm - primer.sequenceOptions.maxSearchSpace);
    }

    var to = frm + primer.sequenceOptions.maxSearchSpace - 1;
    var sequenceToSearch = primer.sequenceModel.getSubSeq(frm, to, primer.sequenceModel.STICKY_END_FULL);
    if(primer.sequenceOptions.findOnReverseStrand) {
      sequenceToSearch = SequenceTransforms.toReverseComplements(sequenceToSearch);
    }

    // Check there are enough bases to satisfy the minimum size for a primer
    // (a valid primer may of course still not be found)
    if(sequenceToSearch.length < primer.options.minPrimerLength) {
      var data = {sequenceToSearch, minPrimerLength: primer.options.minPrimerLength};
      if(primer.sequenceOptions.findOnReverseStrand) {
        primer.deferred.reject(new errors.SequenceTooShort({
          message: "sequence is too short to leave enough sequence length to find the primer",
          data,
        }));
      } else {
        primer.deferred.reject(new errors.SequenceTooShort({
          message: "`sequenceOptions.frm` is too large or sequence is too short to leave enough sequence length to find the primer",
          data,
        }));
      }
    }
    return {
      totalSequenceLength,
      frm,
      sequenceToSearch,
    };
  }

  /**
   * @constructor PotentialPrimer
   * @param  {SequenceModel} sequenceModel
   * @param  {Object} sequenceOptions  Keys:
   *     `frm`: The first base (0 indexed, and relative to the whole sequence (sticky ends included, using
   *             `STICKY_END_FULL`).  If `findOnReverseStrand` is `true` then `frm` refers to the reverse strand,
   *             indexed from the end. e.g. if sequence.getLength(STICKY_END_FULL) returns 10, and
   *             `findOnReverseStrand` is `true`, then a value of `frm` of 3 refers to bases 7 (10 - 3).
   *             NOTE:  the `frm` value then set on the PotentialPrimer instance refers to the position on the forward
   *             strand which will be the lower bound used when calculating the subSequence of the sequenceModel,
   *             regardless of `findOnReverseStrand`.
   *     `maxSearchSpace`:  The maxmimum number of bases which can be searched to find a valid primer.
   *     `findOnReverseStrand`
   * @param  {Object} options
   */
  constructor(sequenceModel, sequenceOptions, options) {
    this.deferred = Q.defer();

    this.sequenceModel = sequenceModel;
    this.sequenceOptions = sequenceOptions;
    this.options = options;
    var vals = PotentialPrimer._getSequenceToSearch(this);
    // Could use _.extend but want to be explicit about what we're doing.
    this.totalSequenceLength = vals.totalSequenceLength;
    this.frm = vals.frm;
    this.sequenceToSearch = vals.sequenceToSearch;

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

    this.checkSelfDimers = options.checkSelfDimers;
    this.selfDimersRejectionThreshold = options.selfDimersRejectionThreshold;

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

      if(!this.selfDimersOk()) {
        this.shiftPotentialPrimer();
        continue;
      }

      if(this.goodGCContent()) {
        var ourTm = SequenceCalculations.meltingTemperature(this.potentialPrimer);
        var largest = this.targetMeltingTemperature + this.meltingTemperatureTolerance + this.IDTmeltingTemperatureProximity;
        var smallest = this.targetMeltingTemperature - this.meltingTemperatureTolerance - this.IDTmeltingTemperatureProximity;
        logger('ourTm', this.potentialPrimer, ourTm, 'largest, smallest: ', largest, smallest);
        if(ourTm > largest) {
          this.i += 1;
          continue;
        } else if (ourTm < smallest) {
          this.growOrShiftPotentialPrimer();
          continue;
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
        continue;
      }
    }

    // We have failed to find a good primer.
    var message = 'FAIL to findPrimer';
    var data = {returnNearestIfNotBest: this.returnNearestIfNotBest};
    if(this.returnNearestIfNotBest) {
      logger('FAILED to find a perfect primer, returning the best primer we have');
      this.nearestBestPrimer()
      .then((nearestBestPrimer) => {
        if(nearestBestPrimer) {
          nearestBestPrimer.optimal = false;
          this.deferred.resolve(nearestBestPrimer);
        } else {
          message += '. Searched for nearestBestPrimer.';
          logger(message);
          this.deferred.reject(new errors.NoPrimer({message, data}));
        }
      }).done();
    } else {
      message += '. nearestBestPrimer search not allowed.';
      logger(message);
      this.deferred.reject(new errors.NoPrimer({message, data}));
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

  selfDimersOk() {
    if(!this.checkSelfDimers) return true;

    const selfDimers = SequenceCalculations.selfDimers(
      this.potentialPrimer, 
      this.selfDimersRejectionThreshold
    );

    return selfDimers.length === 0; 
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
    })
    .catch((error) => {
      this.deferred.reject(new errors.IdtError({message: error.toString()}));
      namedHandleError('primer_calculation, checkWithIDT')(error);
    });
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

    // A rough measure of approximately how many queries it might be reasonable to make.
    var maxIdtQueries = this.maxPrimerLength - this.minPrimerLength + 1;
    var bestPrimerAttributesWithOurTm = sortedPrimerAttributesWithOurTms.slice(0, maxIdtQueries);
    if(sortedPrimerAttributesWithOurTms.length > maxIdtQueries) console.warn(`We were about to send ${sortedPrimerAttributesWithOurTms.length} queries to IDT but will only send ${bestPrimerAttributesWithOurTm.length}`);

    this.incrementProgressTotal(bestPrimerAttributesWithOurTm.length);

    var primerTmPromises = _.map(bestPrimerAttributesWithOurTm, ({primerSequenceBases}) => {
      return IDTMeltingTemperature(primerSequenceBases)
        .then((IdtTemp) => {
          this.notifyProgress();
          return IdtTemp;
        })
        .catch((error) => {
          this.deferred.reject(new errors.IdtError({message: error.toString()}));
          namedHandleError('primer_calculation, nearestBestPrimer')(error);
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
      if(nearestBestPrimerAttributes) {
        return this.toPrimer(nearestBestPrimerAttributes);
      } else {
        return nearestBestPrimerAttributes;
      }
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
    frm: 0,
    maxSearchSpace: opts.maxSearchSpace,
    findOnReverseStrand: false
  });

  _.defaults(opts, {
    checkSelfDimers: false,
    selfDimersRejectionThreshold: 4
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
  if(oldIDTMeltingTemperature) {
    IDTMeltingTemperature = oldIDTMeltingTemperature;
    oldIDTMeltingTemperature = undefined;
  } else {
    throw new Error('No oldIDTMeltingTemperature function to restore');
  }
};


export default {
  PotentialPrimer,
  optimalPrimer4,
  stubOutIDTMeltingTemperature,
  _IDTMeltingTemperature,
  restoreIDTMeltingTemperature,
};
