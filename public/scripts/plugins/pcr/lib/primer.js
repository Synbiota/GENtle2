import {assertIsNumber} from '../../../common/lib/testing_utils';
import ChildSequence from './child_sequence';


class Primer extends ChildSequence {
  /**
   * PRACTICAL_MELTING_TEMPERATURE_DIFF  The value to be subtracted from
   *   theoretical melting temperatures to yield the experiment's temperature
   *   the annealing will be occuring under.
   */
  static get PRACTICAL_MELTING_TEMPERATURE_DIFF() {
    return 5;
  }

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

  get theoreticalMeltingTemperature() {
    return this.meltingTemperature;
  }

  get practicalMeltingTemperature() {
    return this.meltingTemperature - Primer.PRACTICAL_MELTING_TEMPERATURE_DIFF;
  }

  validate() {
    assertIsNumber(this.meltingTemperature, 'meltingTemperature');
    assertIsNumber(this.gcContent, 'gcContent');
    super.validate();
  }
}


export default Primer;
