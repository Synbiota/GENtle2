import _ from 'underscore';
import SequencingPrimerModel from './sequencing_primer';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';


var universalPrimers = function() {
  var primers = [
  {
    sequence: 'TGCCACCTGACGTCTAAGAA',
    name: "Sybiota universal forward primer version 1.0",
    meltingTemperature: 63,
    gcContent: 0.5,
  },
  {
    sequence: 'ATTACCGCCTTTGAGTGAGC', // reverse complement of: GCTCACTCAAAGGCGGTAAT
    name: "Sybiota universal reverse primer version 1.0",
    meltingTemperature: 62.4,
    gcContent: 0.5,
  },
  {
    sequence: 'CGCAGCGAGTCAGTGAG',
    name: "Sybiota universal forward primer version 2.0",
    meltingTemperature: 61.8,
    gcContent: 0.647,
  },
  {
    sequence: 'AATACGCCCGGTAGTGATC', // reverse complement: GATCACTACCGGGCGTATT
    name: "Sybiota universal reverse primer version 2.0",
    antisense: true,
    meltingTemperature: 61,
    gcContent: 0.526,
  }
  ];

  return _.map(primers, (primerAttributes) => new SequencingPrimerModel(primerAttributes));
};


/**
 * @function findPrimers
 * @param  {string} sequenceBases
 * @param  {array}  universalPrimerModels   Array of `SequencingPrimerModel`s
 *                                          representing possible universal primers.
 * @return {object} Object with keys `forwardSequencePrimer`, `reverseSequencePrimer`.
 *                  These will have values of `SequencingPrimerModel` or `undefined`
 */
var findPrimers = function(sequenceBases, universalPrimerModels) {
  var forwardPrimerInSequence = function(universalPrimer, findLast=false) {
    var found = false;
    if(!universalPrimer.antisense) {
      var regexp = new RegExp(universalPrimer.sequence, 'ig');
      var position;
      while(regexp.exec(sequenceBases)) {
        found = true;
        position = regexp.lastIndex - universalPrimer.sequence.length;
        if(!findLast) break;
      }
      if(found) {
        universalPrimer.from = position;
        universalPrimer.to = position + universalPrimer.sequence.length - 1;
      }
    }
    return found;
  };
  var forwardSequencePrimer = _.find(universalPrimerModels, forwardPrimerInSequence);

  var reversePrimerInSequence = function(universalPrimer) {
    var found = false;
    if(universalPrimer.antisense) {
      var attributes = universalPrimer.toJSON();
      attributes.sequence = SequenceTransforms.toReverseComplements(universalPrimer.sequence);
      attributes.antisense = false;
      var sequenceModel = new SequencingPrimerModel(attributes);

      found = forwardPrimerInSequence(sequenceModel, true);
      if(found) {
        universalPrimer.from = sequenceModel.to;
        universalPrimer.to = sequenceModel.from - 1; // May be equal to -1
      }
    }
    return found;
  };
  var reverseSequencePrimer = _.find(universalPrimerModels, reversePrimerInSequence);

  return {forwardSequencePrimer, reverseSequencePrimer};
};


export default {universalPrimers, findPrimers};
