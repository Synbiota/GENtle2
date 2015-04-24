import BaseSequenceModel from '../../library/models/sequence';


class BaseSequenceBackboneWrapper extends BaseSequenceModel {
  constructor(backboneModel, attributes) {
    this.backboneModel = backboneModel;
    super(attributes);
  }

  /*
  @method insertBases  Inserts a string of bases before a particular base 
                       position in the sequence.
  @param  {String}  nucleotide bases to insert
  @param  {Integer}  base to insert bases before (0 indexed)
  @param  {Boolean}  update history
  @return {Timestamp}  history timestamp of modification
   */  
  insertBases(bases, beforeBase, updateHistory) {
    super.insertBases(bases, beforeBase, updateHistory);
    return this.backboneModel._insertBases(bases, beforeBase, updateHistory);
  }

  /*
  @method deleteBases  Deletes K bases from base postion N
  @param  {Integer}  base N to start deleting from
  @param  {Integer}  delete K bases
  @param  {Boolean}  update history
  @return {Timestamp}  history timestamp of modification
   */
  deleteBases(firstBase, length, updateHistory) {
    var {sequenceBasesRemoved, moveFeaturesResult} = super.deleteBases(firstBase, length);
    var {previousFeatureStates, historyTimestamps} = moveFeaturesResult;
    return this.backboneModel._deleteBases(firstBase, updateHistory, sequenceBasesRemoved, historyTimestamps)
  }

  /*
  @method moveFeatures  See BaseSequenceModel for method signature description
  @return {Object}
      previousFeatureStates: {Array<Object{state,feature}>}  
      historyTimestamps: {Array<historyTimestamp>}     history timestamps of modified features
   */
  moveFeatures(base, offset) {
    var {previousFeatureStates} = super.moveFeatures(base, offset);
    var historyTimestamps = this.backboneModel._moveFeatures(previousFeatureStates);
    return {previousFeatureStates, historyTimestamps};
  }
}


export default BaseSequenceBackboneWrapper;
