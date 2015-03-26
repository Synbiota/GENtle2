import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import Q from 'q';
import IDT from './idt_query';
import {handleError, namedHandleError} from '../../../common/lib/handle_error';
import {filterPrimerOptions, defaultSequencingPrimerOptions, defaultPCRPrimerOptions} from './primer_defaults';
import Primer from './primer';


var checkForPolyN = SequenceCalculations.checkForPolyN;
var gcContent = SequenceCalculations.gcContent;


var IDTMeltingTemperatureCache = {};

var IDTMeltingTemperature = function(sequence) {
  // throw "NOT STUBBED!"  // TODO, make this conditional on tests running
  return IDT(sequence).then((result) => {
    return parseFloat(result.MeltTemp);
  });
};


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
var stubOutIDTMeltingTemperature = function() {
  var oldIDTMeltingTemperature = IDTMeltingTemperature;
  var stubbedIDTMeltingTemperature = function(potentialPrimer) {
    return Q.promise(function(resolve) {
      var Tms = {
        'AAAGGGAAAGGGAAAGGGAAAGGG': 66.6,
        'GGGGTCCTAAAAATAATAATGGCATACAGG': 65.4,
        'GGGGTCCTAAAAATAATAATGGCATACAG': 64,
        'GGGTCCTAAAAATAATAATGGCATACAGGG': 65.4,
        'GGGTCCTAAAAATAATAATGGCATACAGG': 64,
        'AATAATAATGGCATACAGGGTGGTG': 63.1,
        'CTCTAGTACTACTACTTTTCAACAGGC': 62.4,
        'CGTACAGCACGTATGGTTCA': 61.9,

        'GAGGGAGAGGTTATTTTCCTTATCTATGTG': 64.4,
        'GTGTATCTATTCCTTTTATTGGAGAGGGAG': 64.4, // inverse sequence

        'ATTGATTACGTACAGCACGTATGG': 62.8,
        'GGTATGCACGACATGCATTAGTTA': 63.1, // inverse sequence
        'CCATACGTGCTGTACGTAATCAAT': 62.8,
        'TAACTAATGCATGTCGTGCATACC': 63.1,

        'CTATCACAAGTGGGAACAATGTGG': 63.4,
        'AACAATGTGGCAAAAGGTACTCGTT': 65.6,
        'AAGGTACTCGTTTGACTTTGCA': 62.6,
        'GCTAAAGGCCGTCAAAGATGT': 62.9,
        'GCTAAAGGCCGTCAAAGATGTG': 63.6,
        'GCTAAAGGCCGTCAAAGATGTGT': 65.2,
        'GCTAAAGGCCGTCAAAGATGTGTA': 64.8,
        'GCTAAAGGCCGTCAAAGATGTGTAT': 65,
        'GCTAAAGGCCGTCAAAGATGTGTATA': 64.8,
        'GCTAAAGGCCGTCAAAGATGTGTATAT': 65,
        'GCTAAAGGCCGTCAAAGATGTGTATATA': 64.7,
        'GCTAAAGGCCGTCAAAGATGTGTATATAA': 65.1,
        'GCTAAAGGCCGTCAAAGATGTGTATATAAG': 65.3,
        'CTAAAGGCCGTCAAAGATGTGT': 62.8,
        'CTAAAGGCCGTCAAAGATGTGTA': 62.5,
        'CTAAAGGCCGTCAAAGATGTGTAT': 62.9,
        'CTAAAGGCCGTCAAAGATGTGTATA': 62.7,
        'CTAAAGGCCGTCAAAGATGTGTATATAAGC': 65.3,
        'TAAAGGCCGTCAAAGATGTGT': 62.2,
        'TTAAGACGGAGCACTATGCG': 61.7,
        'TTAAGACGGAGCACTATGCGG': 63.9,
        'AGAGACTTACCGCCCTCATA': 61.8,
        'AGAGACTTACCGCCCTCATAC': 62.7,
        'CCTATCTGACTGGTAATAGTTCGAACTACT': 64.9,
        'AGTCGTGCTAGATTTCTCAGTAAG': 61.8,
        'AGTCGTGCTAGATTTCTCAGTAAGA': 63.1,
        'AAAAGTAGCGAGACCTCACTTATG': 62.3,
        'CGTCCAATTACAGTACTCTTAAGACC': 62.6,
        'GCCCAAATTGCGGCTAACTC': 63.9,
        'AGGAGATTCATTGCACAAACAAGC': 64.2,
        'GTTAAGGTAAACTACGAGTTTGGTTAGAGG': 64.8,
        'GGCTTCAACTGATATAGAGTGGAAT': 62.3,

        'CATCGGGGTTTGGTCCTTTA': 61.9,
        'CCATCGGGGTTTGGTCCTTTA': 64.1,
        'CACGACATGCATTAGTTATTATGGG': 62,
        'TTCACTCCAGAGCGATGAAAA': 61.9,
        'ATTCACTCCAGAGCGATGAAAA': 62.3,
        'GAATTCTCATGACATTAACCTGCAG': 62.1,
        'GAATATAACCTTTCATTCCCAGCGGTC': 65.2,
        'AATATAACCTTTCATTCCCAGCGGTC': 64.9,
        'GCATGAGAGGCCATTTAATTATACG': 62,
        'TGAACGCTTGCTTGGTTCTG': 63.3,
        'TCGTTAATCGCTTCCATGCG': 62.8,
        'GGGGATCATTTTGCGCTTCA': 63.3,
        'GGGCTAGCAGGGAAAATAATGAATA': 62.9,
        'GTTCCATTATCAGGAGTGACATCT': 62,
        'CAGCTAGATCGATACGCGAAAATTT': 63.5,
        'CGAACAAACACGTTACTTAGAGGAAGA': 64.6,
        'CCGTAGGTGTCGTTAATCTTAGAGAT': 63.4,
        'GAGGACGTTACAAGTATTACTGTTAAGGAG': 64.4,
        'GGAAGAGTCTCGAGCAATTACTCAAAA': 64.8,
        'GGCGTGATTTTGTTTTACAAGGACA': 64.5,
        'TGGTATTGTTGGAGCACCTATTAC': 62.5,
        'GAAACCAAAGAACGCTATGCAATTC': 63.3,
        'GAGAGGGTATGACTGTCCATACTGAATATA': 64.7,
        'GTTGGAGATTGGTTTGAGCATCAAATG': 65,
        'TATGCTCGGGCTCTTGATCC': 63.4,
        'GAGACTGCTCATTGGATATTATCGA': 62.1,
        'GCCGATGCTTTTGCATACGTAT': 63.7,
        'TCATAGCTCACGCTGTAGGT': 62.5,
        'CACGTTAAGGGATTTTGGTCATG': 62,
        'TATCAAAATTGCTGTCTGCCAGGTG': 65.5,
        'ATCAAAATTGCTGTCTGCCAGGTG': 65.9,
        'TCAAAATTGCTGTCTGCCAGGTG': 65.7,
        'CAAAATTGCTGTCTGCCAGGTG': 64.4,
        'TAACCTTTCATTCCCAGCGG': 62.2,
        'CTCATCCTCGTTTAATTCCACATGA': 62.9,
        'TATCTATTCCTTTTATTGGAGAGGGAGGAG': 65,
        'ACTTGGTATGCACGACATGC': 62.9,
        'GGTATGCACGACATGCATTAGTT': 63.4,
        'TAACCTTTCATTCCCAGCGGTC': 64.4,
        'TGTTCCATTATCAGGAGTGACATC': 62.2,
        'CCGTAGGTGTCGTTAATCTTAGAGA': 63.1,
        'CGTTACAAGTATTACTGTTAAGGAGCG': 63.4,
        'GCCGATGCTTTTGCATACGTA': 63.4,
        'CTCATAGCTCACGCTGTAGG': 61.4,
        'TCTCATAGCTCACGCTGTAGG': 62.9,

        'ATTTTGCACATAACTCTAGT': 55.2,
        'AATTTTGCACATAACTCTAGT': 56.1,
        'TAATTTTGCACATAACTCTAGT': 56.2,
        'CTAATTTTGCACATAACTCTAGT': 57.1,
        'GCTAATTTTGCACATAACTCTAGT': 59.7,
        'AAAAAAATGATTTTTTTGGC': 53.2,
        'AAAAAAATGATTTTTTTGGCA': 55.3,
        'AAAAAAATGATTTTTTTGGCAA': 56.3,
        'AAAAAAATGATTTTTTTGGCAAT': 56.9,
        'AAAAAAATGATTTTTTTGGCAATT': 57.7,
        'AAAAAAATGATTTTTTTGGCAATTT': 58.5,
        'AAAAAAATGATTTTTTTGGCAATTTT': 59.2,
        'AAAAAAATGATTTTTTTGGCAATTTTA': 59.2,
        'AAAAAAATGATTTTTTTGGCAATTTTAG': 59.9,
        'AAAAAAATGATTTTTTTGGCAATTTTAGA': 61.1,
        'AAAAAAATGATTTTTTTGGCAATTTTAGAT': 61.5,

        'ACTAGAGTTATGTGCAAAAT': 55.2,
        'ACTAGAGTTATGTGCAAAATT': 56.1,
        'ACTAGAGTTATGTGCAAAATTA': 56.2,
        'ACTAGAGTTATGTGCAAAATTAG': 57.1,
        'ACTAGAGTTATGTGCAAAATTAGC': 59.7,
        'ACTAGAGTTATGTGCAAAATTAGCT': 61.1,
        'ACTAGAGTTATGTGCAAAATTAGCTT': 61.7,
        'ACTAGAGTTATGTGCAAAATTAGCTTC': 62.2,
        'ACTAGAGTTATGTGCAAAATTAGCTTCT': 63.4,
        'ACTAGAGTTATGTGCAAAATTAGCTTCTA': 63.2,
        'ACTAGAGTTATGTGCAAAATTAGCTTCTAT': 63.5,

        'ATAGAAGCTAATTTTGCACA': 55.8,
        'ATAGAAGCTAATTTTGCACAT': 56.5,
        'ATAGAAGCTAATTTTGCACATA': 56.6,
        'ATAGAAGCTAATTTTGCACATAA': 57.4,
        'ATAGAAGCTAATTTTGCACATAAC': 58.4,
        'ATAGAAGCTAATTTTGCACATAACT': 59.9,
        'ATAGAAGCTAATTTTGCACATAACTC': 60.5,
        'ATAGAAGCTAATTTTGCACATAACTCT': 61.8,
        'ATAGAAGCTAATTTTGCACATAACTCTA': 61.7,
        'ATAGAAGCTAATTTTGCACATAACTCTAG': 62.2,
        'ATAGAAGCTAATTTTGCACATAACTCTAGT': 63.5,

        'GCATGTCGTGCATACCAAGT': 62.9,

        'GAAAGAAGAAGAAGAAGAAG': 53.7,
        'GAAAGAAGAAGAAGAAGAAGA': 55.6,
        'GAAAGAAGAAGAAGAAGAAGAA': 56.4,
        'GAAAGAAGAAGAAGAAGAAGAAG': 57.3,
        'GAAAGAAGAAGAAGAAGAAGAAGA': 58.8,
        'GAAAGAAGAAGAAGAAGAAGAAGAA': 59.5,
        'GAAAGAAGAAGAAGAAGAAGAAGAAG': 60.1,
        'GAAAGAAGAAGAAGAAGAAGAAGAAGA': 61.4,
        'GAAAGAAGAAGAAGAAGAAGAAGAAGAA': 61.9,
        'GAAAGAAGAAGAAGAAGAAGAAGAAGAAA': 62.4,
        'GAAAGAAGAAGAAGAAGAAGAAGAAGAAAA': 62.8,

        'ATACGTCGCGCAGCTCA': 63.5,

        'TTGCTGGAATCGCCCGC': 65.2,

        'GCTGAGCCAT': 40.8,
        'GCTGAGCCATT': 43.6,
        'GCTGAGCCATTC': 46.7,
        'GCTGAGCCATTCC': 51.3,
        'GCTGAGCCATTCCC': 55.2,
        'GCTGAGCCATTCCCC': 58.7,
        'GCTGAGCCATTCCCCT': 60.8,
        'GCTGAGCCATTCCCCTT': 61.4,
        'GCTGAGCCATTCCCCTTC': 62.2,
        'GCTGAGCCATTCCCCTTCA': 64.1,

        'CTGAGCCATTCCCCTTCAGA': 63.4,
        'CTGAGCCATTCCCCTTCAGAT': 63.7,

        'CCCCTTACCCGCCGACGGGT': 72,
        'CCCCTTACCCGCCGACGGGTC': 71.9,
        'CCCCTTACCCGCCGACGGGTCA': 73.2,
        'CCCCTTACCCGCCGACGGGTCAA': 73.1,
        'CCCCTTACCCGCCGACGGGTCAAA': 73,
        'CCCCTTACCCGCCGACGGGTCAAAA': 73,
        'CCCCTTACCCGCCGACGGGTCAAAAT': 72.9,
        'CCCCTTACCCGCCGACGGGTCAAAATT': 72.8,

        'TCGCATTGTGCGGGGTCCAC': 69.2,
        'TCGCATTGTGCGGGGTCCACA': 70.7,
        'TCGCATTGTGCGGGGTCCACAT': 70.6,

        'AGTCCAACTTCGACAGGGATTCG': 65.8,
        'AGTCCAACTTCGACAGGGATTCGA': 67,

        'CAGTCCAACTTCGACAGGGATTCG': 66.3,
        'CAGTCCAACTTCGACAGGGATTCGA': 67.4,
      };
      var Tm = Tms[potentialPrimer];
      if(Tm) {
        console.log(`stubbedIDTMeltingTemperature received: ${potentialPrimer}, responding with Tm: ${Tm}`);
        resolve(Tm);
      } else {
        // Set to true to go and get the result from IDT and record it so that
        // we can update the Tms dictionary
        // Default this to false, we don't want to be hammering IDT during tests.
        var automaticallyGoToIDT = false;
        if(automaticallyGoToIDT) {
          console.warn(`Getting result from IDT for ${potentialPrimer} and storing on \`window.TmsFromIDT\`.  Please update the Tms dictionary.`);
          if(!window.TmsFromIDT) {
            window.TmsFromIDT = '';
          }
          oldIDTMeltingTemperature(potentialPrimer).then(function(Tm) {
            window.TmsFromIDT += `'${potentialPrimer}': ${Tm},`;
            resolve(Tm);
          });
        } else {
          throw `Unknown IDT Tm for ${potentialPrimer}.  Look up on https://www.idtdna.com/calc/analyzer with Mg++ Conc of 2mM, and add to \`Tms\` dict.`;
        }
      }
    });
  };
  IDTMeltingTemperature = stubbedIDTMeltingTemperature;
  return stubbedIDTMeltingTemperature;
};


var restoreIDTMeltingTemperature = function(oldIDTMeltingTemperature) {
  return function() {
    console.log('Restoring IDTMeltingTemperature function');
    IDTMeltingTemperature = oldIDTMeltingTemperature;
  };
};



// Some tests
if(false) {
  var bothEndsSequence = 'ATTGATTACGTACAGCACGTATGG' + 'AAAAAA' + 'GTGTATCTATTCCTTTTATTGGAGAGGGAG';
  var sequence1 = 'AAAAAAATGATTTTTTTGGCAATTTTAGATTTAAAATCTTTAGTACTCAATGCAATAAATTATTGGGGTCCTAAAAATAATAATGGCATACAGGGTGGTGATTTTGGTTACCCTATATCAGAAAAACAAATAGATACGTCTATTATAACTTCTACTCATCCTCGTTTAATTCCACATGATTTAACAATTCCTCAAAATTTAGAAACTATTTTTACTACAACTCAAGTATTAACAAATAATACAGATTTACAACAAAGTCAAACTGTTTCTTTTGCTAAAAAAACAACGACAACAACTTCAACTTCAACTACAAATGGTTGGACAGAAGGTGGGAAAATTTCAGATACATTAGAAGAAAAAGTAAGTGTATCTATTCCTTTTATTGGAGAGGGAGGAGGAAAAAACAGTACAACTATAGAAGCTAATTTTGCACATAACTCTAGT';
  var sequence1Reversed = SequenceTransforms.toReverseComplements(sequence1);
  var sequence2 = 'ATAGAAGCTAATTTTGCACATAACTCTAGTACTACTACTTTTCAACAGGCTTCAACTGATATAGAGTGGAATATTTCACAACCAGTATTGGTTCCCCCACGTAAACAAGTTGTAGCAACATTAGTTATTATGGGAGGTAATTTTACTATTCCTATGGATTTGATGACTACTATAGATTCTACAGAACATTATAGTGGTTATCCAATATTAACATGGATATCGAGCCCCGATAATAGTTATAATGGTCCATTTATGAGTTGGTATTTTGCAAATTGGCCCAATTTACCATCGGGGTTTGGTCCTTTAAATTCAGATAATACGGTCACTTATACAGGTTCTGTTGTAAGTCAAGTATCAGCTGGTGTATATGCCACTGTACGATTTGATCAATATGATATACACAATTTAAGGACAATTGAAAAAACTTGGTATGCACGACATGC';
  var sequence2Reversed = SequenceTransforms.toReverseComplements(sequence2);
  var polyASequence = 'GAAAGAAGAAGAAGAAGAAGAAGAAGAAAAAAA';

  var checkResult = function(primer, testLabel, expectations={}) {
    expectations = _.defaults(expectations, {
      gcContentGreaterThan: 0.3,
      gcContentLessThan: 0.7,
      minimumMeltingTemperature: 62,
      maximumMeltingTemperature: 65,
      optimal: true,
    });
    console.log(`Testing ${testLabel} with primer:`, primer);
    console.assert(primer.meltingTemperature >= expectations.minimumMeltingTemperature,
      `meltingTemperature should be >= ${expectations.minimumMeltingTemperature} but is ${primer.meltingTemperature}`);
    console.assert(primer.meltingTemperature <= expectations.maximumMeltingTemperature,
      `meltingTemperature should be <= ${expectations.maximumMeltingTemperature} but is ${primer.meltingTemperature}`);
    console.assert(primer.gcContent >= expectations.gcContentGreaterThan, `gcContent should be >= ${expectations.gcContentGreaterThan} but is ${primer.gcContent}`);
    console.assert(primer.gcContent <= expectations.gcContentLessThan, `gcContent should be <= ${expectations.gcContentLessThan} but is ${primer.gcContent}`);
    console.assert(primer.optimal === expectations.optimal, "Should have " + (expectations.optimal ? "" : "not ") + "been an optimal primer but was" + (expectations.optimal ? " not." : "."));

    var fieldsToCheck = [
      ['expectedSequence', 'sequence'],
      ['expectedFrom', 'from'],
      ['expectedTo', 'to'],
    ];
    _.each(fieldsToCheck, function(fieldPair) {
      var expectation = expectations[fieldPair[0]];
      var field = fieldPair[1];
      var actual = primer[field];
      if(expectation) {
        console.assert(actual === expectation, `expected ${field}: ${expectation} but got ${actual}`);
      }
    });
  };

  var oldIDTMeltingTemperature = stubOutIDTMeltingTemperature();

  var optimalPrimer4_TestFactory = function(sequence, testLabel, expectations, options={}) {
    console.log(`Set up optimalPrimer4 test for ${testLabel}`);
    var optimalPrimer4_TestFinished = Q.defer();

    optimalPrimer4(sequence, options).then(
    function(primer){
      console.log(`Got optimalPrimer4 results for ${testLabel}, primer:`, primer);
      checkResult(primer, testLabel, expectations);
      optimalPrimer4_TestFinished.resolve();
    }).done();
    return optimalPrimer4_TestFinished.promise;
  };


  /******************************
   * TESTS
   ******************************/
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
  Q.all([
      /*********************
       * Sequencing primer
       *********************/
      optimalPrimer4_TestFactory(bothEndsSequence,
      'optimalPrimer4 for Sequencing primer with bothEndsSequence',
      {expectedSequence: 'ATTGATTACGTACAGCACGTATGG', expectedFrom: 0, expectedTo: 23},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: false})),

      optimalPrimer4_TestFactory(bothEndsSequence,
      'optimalPrimer4 for Sequencing primer with bothEndsSequence',
      {expectedSequence: 'GTGTATCTATTCCTTTTATTGGAGAGGGAG', expectedFrom: 30, expectedTo: 59},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: true})),
      
      optimalPrimer4_TestFactory(sequence1,
      'optimalPrimer4 for Sequencing primer with sequence1',
      {expectedSequence: 'AATAATAATGGCATACAGGGTGGTG'},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: false})),

      optimalPrimer4_TestFactory(sequence1,
      'optimalPrimer4 for Sequencing primer with sequence1',
      {expectedSequence: 'TATCTATTCCTTTTATTGGAGAGGGAGGAG'},
      defaultSequencingPrimerOptions()),
      
      optimalPrimer4_TestFactory(sequence2,
      'optimalPrimer4 for Sequencing primer with sequence2',
      {expectedSequence: 'CTCTAGTACTACTACTTTTCAACAGGC'},
      defaultSequencingPrimerOptions({findFrom3PrimeEnd: false})),

      optimalPrimer4_TestFactory(sequence2,
      'optimalPrimer4 for Sequencing primer with sequence2',
      {expectedSequence: 'ACTTGGTATGCACGACATGC'},
      defaultSequencingPrimerOptions()),

      /**************
       * PCR primers
       **************/
      optimalPrimer4_TestFactory(sequence1,
      'optimalPrimer4 for PCR primer with sequence1 so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)',
      {
        expectedSequence: 'AAAAAAATGATTTTTTTGGCAATTTTAG',
        gcContentGreaterThan: 0.1,
        minimumMeltingTemperature: 59.5,
        maximumMeltingTemperature: 60.5,
        optimal: false,
      },
      defaultPCRPrimerOptions()),

      optimalPrimer4_TestFactory(sequence1Reversed,
      'optimalPrimer4 for PCR primer with sequence1Reversed so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)',
      {
        expectedSequence: 'ACTAGAGTTATGTGCAAAATTAGC',
        gcContentGreaterThan: 0.33,
        minimumMeltingTemperature: 59.6,
        maximumMeltingTemperature: 59.8,
        optimal: false,
      },
      defaultPCRPrimerOptions()),

      optimalPrimer4_TestFactory(sequence2,
      'optimalPrimer4 for PCR primer with sequence2 so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)',
      {
        expectedSequence: 'ATAGAAGCTAATTTTGCACATAACT',
        gcContentGreaterThan: 0.28,
        minimumMeltingTemperature: 59.8,
        maximumMeltingTemperature: 60,
        optimal: false,
      },
      defaultPCRPrimerOptions()),

      optimalPrimer4_TestFactory(sequence2Reversed,
      'optimalPrimer4 for PCR primer with sequence2Reversed so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)',
      {
        expectedSequence: 'GCATGTCGTGCATACCAAGT',
        gcContentGreaterThan: 0.49,
        minimumMeltingTemperature: 62.8,
        maximumMeltingTemperature: 63,
        optimal: false,
      },
      defaultPCRPrimerOptions()),

      optimalPrimer4_TestFactory(polyASequence,
      'optimalPrimer4 for PCR primer with polyASequence so using defaultPCRPrimerOptions (limiting to not allowShift from start base, etc)',
      {
        expectedSequence: 'GAAAGAAGAAGAAGAAGAAGAAGAAG',
        gcContentGreaterThan: 0.34,
        minimumMeltingTemperature: 60,
        maximumMeltingTemperature: 60.2,
        optimal: false,
      },
      defaultPCRPrimerOptions()),

      optimalPrimer4_TestFactory('ATACGTCGCGCAGCTCAAGCCGCTGATTCCGGCGCAATAT',
      'Test ignoring `from` and `to` parameters',
      {
        expectedSequence: 'ATACGTCGCGCAGCTCA',
        gcContentGreaterThan: 0.34,
        minimumMeltingTemperature: 63.4,
        maximumMeltingTemperature: 63.6,
        optimal: true,
      },
      {
        "from":9,  // should be ignored.
        "to":149,  // should be ignored.
        "name":"vioA",
        "targetMeltingTemperature":65,
        "stickyEnds":{
          "name":"X-Z'",
          "startName":"X",
          "endName":"Z'",
          "start":"CCTGCAGTCAGTGGTCTCTAGAG",
          "end":"GAGATGAGACCGTCAGTCACGAG",
          "startOffset":19,
          "endOffset":-19
        },
        "minPrimerLength":10,
        "maxPrimerLength":40,
        "meltingTemperatureTolerance":1.5,
        "targetGcContent":0.5,
        "useIDT":true,
        "returnNearestIfNotBest":true,
        "allowShift":false,
        "findFrom3PrimeEnd":false,
        "maxPolyN":3,
        "targetGcContentTolerance":0.1,
        "IDTmeltingTemperatureProximity":0.5
      })

  ]).then(restoreIDTMeltingTemperature(oldIDTMeltingTemperature));

}


export default {optimalPrimer4, stubOutIDTMeltingTemperature, restoreIDTMeltingTemperature};
