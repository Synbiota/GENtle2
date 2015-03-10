import {assertIsInstance} from '../../../common/lib/testing_utils';
import Sequence from './sequence';
import Primer from './primer';


class Product extends Sequence {
  setup () {
    super.setup();
    if(this.primer.constructor !== Primer) {
      this.primer = new Primer(this.primer);
    }
  }

  requiredFields () {
    return [
      // 'sequence',
      'from', 'to', 'primer'];
  }

  validate () {
    assertIsInstance(this.primer, Primer, 'primer');
    super.validate();
  }
}


export default Product;
