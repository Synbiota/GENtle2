/**
 * @module gentle-plugins
 * @submodule pcr
 */
import _ from 'underscore';
import {assertIsNumber} from '../../../common/lib/testing_utils';
import ChildSequenceModel from '../../../library/models/child_sequence';

/**
 * Used for both the annealing region and the full pcr primer (annealing
 * region + stickyends)
 * @class PcrPrimerModel
 * @constructor
 */
class PcrPrimerModel extends ChildSequenceModel {
  requiredFields() {
    var fields = super.requiredFields();
    return _.unique(fields.concat([
      'meltingTemperature',
      'gcContent',
    ]));
  }

  optionalFields() {
    var fields = super.optionalFields();
    fields.push('ourMeltingTemperature');
    return _.unique(fields);
  }

  validate() {
    super.validate();
    assertIsNumber(this.from, 'from');
    assertIsNumber(this.to, 'to');
    assertIsNumber(this.meltingTemperature, 'meltingTemperature');
    assertIsNumber(this.gcContent, 'gcContent');
  }
}


PcrPrimerModel.className = 'PcrPrimerModel';


export default PcrPrimerModel;
