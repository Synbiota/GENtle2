import {assertIsInstance} from '../../../common/lib/testing_utils';
import ChildSequence from './child_sequence';
import Primer from './primer';


class Product extends ChildSequence {
  setup(options) {
    super.setup(options);
    if(!(this.primer instanceof Primer)) {
      this.primer.parentSequence = this.parentSequence;
      this.primer = new Primer(this.primer, options);
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
    this.primer.validate();
  }
}


export default Product;
