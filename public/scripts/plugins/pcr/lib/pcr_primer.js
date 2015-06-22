import {assertIsInstance} from '../../../common/lib/testing_utils';
import ChildSequence from './child_sequence';
import Primer from './primer';


class PcrPrimer extends ChildSequence {
  setup(options) {
    super.setup(options);
    if(!(this.annealingRegion instanceof Primer)) {
      this.annealingRegion.parentSequence = this.parentSequence;
      this.annealingRegion = new Primer(this.annealingRegion, options);
    }
  }

  get requiredFields() {
    return super.requiredFields.concat([
      'annealingRegion',
    ]);
  }

  validate() {
    assertIsInstance(this.annealingRegion, Primer, 'annealingRegion');
    super.validate();
    this.annealingRegion.validate();
  }
}


export default PcrPrimer;
