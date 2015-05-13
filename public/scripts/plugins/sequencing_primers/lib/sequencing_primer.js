import {assertIsNumber} from '../../../common/lib/testing_utils';
import Sequence from '../../pcr/lib/sequence';


class SequencingPrimerModel extends Sequence {
  optionalFields () {
    return [
      'id',
      'name',
      //'ourMeltingTemperature',
      'antisense',  // TODO, rename to `reverse`
      'offset',
    ];
  }

  requiredFields () {
    return [
      'sequence',
      'meltingTemperature',
      'gcContent',
    ];
  }

  validate () {
    assertIsNumber(this.meltingTemperature, 'meltingTemperature');
    assertIsNumber(this.gcContent, 'gcContent');
    // TODO:  WE MUST call super.validate, but it errors on not having
    // `from` and `to` values.
    // super.validate();
  }
}


export default SequencingPrimerModel;
