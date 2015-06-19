import {assertIsNumber} from '../../../common/lib/testing_utils';
import ChildSequence from './child_sequence';


class Primer extends ChildSequence {
  get requiredFields() {
    return super.requiredFields.concat([
      'meltingTemperature',
      'gcContent',
    ]);
  }

  get optionalFields() {
    return super.optionalFields.concat([
      'ourMeltingTemperature',
    ]);
  }

  validate() {
    assertIsNumber(this.meltingTemperature, 'meltingTemperature');
    assertIsNumber(this.gcContent, 'gcContent');
    super.validate();
  }
}


export default Primer;
