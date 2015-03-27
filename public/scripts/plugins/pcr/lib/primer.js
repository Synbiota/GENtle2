import {assertIsNumber} from '../../../common/lib/testing_utils';
import Sequence from './sequence';


class Primer extends Sequence {
  optionalFields () {
    var fields =  super.optionalFields();
    fields.push('ourMeltingTemperature');
    return fields;
  }

  requiredFields () {
    return ['sequence', 'from', 'to', 'meltingTemperature', 'gcContent'];
  }

  validate () {
    assertIsNumber(this.meltingTemperature, 'meltingTemperature');
    assertIsNumber(this.gcContent, 'gcContent');
    super.validate();
  }
}


export default Primer;
