import {assertIsInstance} from '../../../common/lib/testing_utils';
import ChildSequence from './child_sequence';
import Primer from './primer';


class Product extends ChildSequence {
  setup() {
    super.setup();
    if(!(this.primer instanceof Primer)) {
      this.primer.parentSequence = this.parentSequence;
      this.primer = new Primer(this.primer);
    }
  }

  get requiredFields() {
    return super.requiredFields.concat([
      'primer',
    ]);
  }

  validate() {
    assertIsInstance(this.primer, Primer, 'primer');
    super.validate();
  }
}


export default Product;
