import _ from 'underscore';
import BaseSequenceModel from '../../library/models/sequence';


class BaseSequenceBackboneWrapper extends BaseSequenceModel {
  constructor(backboneModel, attributes) {
    this.backboneModel = backboneModel;
    super(attributes);
  }

  /*
   * Inserts a string of bases before a particular base position in the
   * sequence.
   * @method insertBases
   * @param  {String}  nucleotide bases to insert
   * @param  {Integer}  base to insert bases before (0 indexed)
   * @param  {Boolean}  update history
   * @return {Timestamp}  history timestamp of modification
   */
  insertBases(bases, beforeBase, updateHistory = true) {
    super.insertBases(bases, beforeBase, updateHistory);
    var timestamp;
    if (updateHistory) {
      timestamp = this.backboneModel.getHistory().add({
        type: 'insert',
        position: beforeBase,
        value: bases,
        operation: '@' + beforeBase + '+' + bases
      }).get('timestamp');
    }

    this.backboneModel.throttledSave();
    return timestamp;
  }

  /*
   * Deletes K bases from base postion N.
   * @method deleteBases
   * @param  {Integer}  base N to start deleting from
   * @param  {Integer}  delete K bases
   * @param  {Boolean}  update history
   * @return {Timestamp}  history timestamp of modification
   */
  deleteBases(firstBase, length, updateHistory = true) {
    var {sequenceBasesRemoved, moveFeaturesResult} = super.deleteBases(firstBase, length);
    var {previousFeatureStates, historyTimestamps} = moveFeaturesResult;
    var timestamp;
    if (updateHistory) {
      timestamp = this.backboneModel.getHistory().add({
        type: 'delete',
        value: sequenceBasesRemoved,
        position: firstBase,
        operation: '@' + firstBase + '-' + sequenceBasesRemoved,
        linked: historyTimestamps
      }).get('timestamp');
    }

    this.backboneModel.throttledSave();
    return timestamp;
  }

  /*
   * See {{#crossLink "BaseSequenceModel/moveFeatures:method"}}{{/crossLink}}
   * for method signature description.
   * @method moveFeatures
   * @return {Object}
   *   previousFeatureStates: {Array<Object{state,feature}>}
   *   historyTimestamps: {Array<historyTimestamp>}     history timestamps of modified features
   */
  moveFeatures(base, offset) {
    var {previousFeatureStates} = super.moveFeatures(base, offset);

    var historyTimestamps = [];
    _.each(previousFeatureStates, (featurePreviousState) => {
      var {state, feature} = featurePreviousState;

      if(state === 'edited') {
        historyTimestamps.push(this.backboneModel.recordFeatureHistoryEdit(feature, true));
      } else if(state === 'deleted') {
        historyTimestamps.push(this.backboneModel.recordFeatureHistoryDel(feature, true));
      } else {
        throw new Error(`Unsupported feature state: '${state}'`);
      }
    });

    if(previousFeatureStates.length) this.backboneModel.trigger('change change:features');
    return {previousFeatureStates, historyTimestamps};
  }

  /**
   * @method deleteFeature
   * @param  {Object} feature
   * @param  {Boolean} record
   * @return {undefined}
   */
  deleteFeature(feature, record) {
    super.deleteFeature(feature);

    if (record === true) {
      this.backboneModel.recordFeatureHistoryDel(feature, false, false);
    }
    this.backboneModel.throttledSave();
  }

}


export default BaseSequenceBackboneWrapper;
