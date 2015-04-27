/**
 * @module gentle-plugins
 * @submodule pcr
 */
import _ from 'underscore';
import {assertIsInstance} from '../../../common/lib/testing_utils';
import ChildSequenceModel from '../../../library/models/child_sequence';
import PcrPrimerModel from './primer';

/**
 * Represents a PCR product including it's nucleotide sequence (DNA bases).
 * @class PcrProductSequenceModel
 * @constructor
 */
class PcrProductSequenceModel extends ChildSequenceModel {
  requiredFields() {
    var fields = super.requiredFields();
    return _.unique(fields.concat([
      'meltingTemperature',
      'forwardAnnealingRegionPrimerModel',
      'reverseAnnealingRegionPrimerModel',
      'forwardPrimer',
      'reversePrimer',
    ]));
  }

  primerModelFields() {
    return [
      'forwardAnnealingRegionPrimerModel',
      'reverseAnnealingRegionPrimerModel',
      //TODO: use Models to represent primers
      // 'forwardPrimer',
      // 'reversePrimer',
    ];
  }

  _setupNestedClasses() {
    super._setupNestedClasses();
    _.each(this.primerModelFields(), (field) => {
      if(this[field].constructor !== PcrPrimerModel) {
        this[field] = new PcrPrimerModel(this[field]);
      }
    });
  }

  validate() {
    _.each(this.primerModelFields(), (field) => {
      assertIsInstance(this[field], PcrPrimerModel, field);
    });
    super.validate();
  }
}


PcrProductSequenceModel.className = 'PcrProductSequenceModel';


export default PcrProductSequenceModel;
