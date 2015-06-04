import _ from 'underscore';
import SequencingPrimerModel from './sequencing_primer';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import SequenceRange from '../../../library/sequence-model/range';


var forwardUniversalPrimers = function() {
  return [
  {
    sequence: 'TGCCACCTGACGTCTAAGAA',
    name: "Sybiota universal forward primer version 1.0",
    meltingTemperature: 63,
    gcContent: 0.5,
  },
  {
    sequence: 'CGCAGCGAGTCAGTGAG',
    name: "Sybiota universal forward primer version 2.0",
    meltingTemperature: 61.8,
    gcContent: 0.647,
  },
  ];
};


var reverseUniversalPrimers = function() {
  return [
  {
    // forward strand, reverse complement is:  ATTACCGCCTTTGAGTGAGC
    sequence: 'GCTCACTCAAAGGCGGTAAT',
    name: "Sybiota universal reverse primer version 1.0",
    meltingTemperature: 62.4,
    gcContent: 0.5,
  },
  {
    // forward strand, reverse complement is:  AATACGCCCGGTAGTGATC
    sequence: 'GATCACTACCGGGCGTATT',
    name: "Sybiota universal reverse primer version 2.0",
    reverse: true,
    meltingTemperature: 61,
    gcContent: 0.526,
  },
  ];
};


/**
 * @function findUniversalPrimer
 * @param  {SequenceModel}  sequenceModel
 * @param  {Array}  universalPrimers  Array of objects representing possible
 *                                    universal primers.
 * @param  {Boolean} findLast=false
 * @return {SequencingPrimerModel or undefined}
 */
var findUniversalPrimer = function(sequenceModel, universalPrimers, findLast=false) {
  var sequenceBases = sequenceModel.getSequence(sequenceModel.STICKY_END_FULL);
  var primerModel;
  var primerInSequence = function(universalPrimer) {
    var regexp = new RegExp(universalPrimer.sequence, 'ig');
    var position;
    while(regexp.exec(sequenceBases)) {
      position = regexp.lastIndex - universalPrimer.sequence.length;
      if(!findLast) break;
    }
    if(position !== undefined) {
      var rangeModel = new SequenceRange({
        from: position,
        size: universalPrimer.sequence.length,
        reverse: false,
      });
      primerModel = new SequencingPrimerModel({
        parentSequence: sequenceModel,
        name: universalPrimer.name,
        range: rangeModel,
        meltingTemperature: universalPrimer.meltingTemperature,
        gcContent: universalPrimer.gcContent,
      });
    }
    return primerModel;
  };
  _.find(universalPrimers, primerInSequence);
  return primerModel;
};


/**
 * @function findPrimers
 * @param  {SequenceModel} sequenceModel
 * @param  {Array}  forwardPrimers  Array of objects representing possible
 *                                  forward universal primers.
 * @param  {Array}  reversePrimers  Array of objects representing possible
 *                                  reverse universal primers.
 * @return {Object} Object with keys `forwardSequencePrimer`, `reverseSequencePrimer`.
 *                  These will have values of `SequencingPrimerModel` or `undefined`
 */
var findPrimers = function(sequenceModel, forwardPrimers, reversePrimers) {
  var forwardSequencePrimer = findUniversalPrimer(sequenceModel, forwardPrimers);
  var reverseSequencePrimer = findUniversalPrimer(sequenceModel, reversePrimers, true);

  if(reverseSequencePrimer) {
    reverseSequencePrimer.range.reverse = true;
  }

  return {forwardSequencePrimer, reverseSequencePrimer};
};


var findPrimersHelper = function(sequenceModel) {
  return findPrimers(sequenceModel, forwardUniversalPrimers(), reverseUniversalPrimers());
};


export default {
  forwardUniversalPrimers,
  reverseUniversalPrimers,
  findPrimers,
  findPrimersHelper,
};
