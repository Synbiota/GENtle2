/******************************************************************************
 *
 *   DEPRECATED - it doesn't make sense to have a product from only one
 *   forward primer.
 *
 ******************************************************************************/
import {assertIsInstance} from '../../../common/lib/testing_utils';
import Sequence from '../../../library/models/sequence';
import Primer from './primer';


class DeprecatedPcrProductSequenceModel extends Sequence {
  requiredFields() {
    console.warn('This class is deprecated.  Please use pcr_product.js');
    return [
      // 'sequence',
      'from',
      'to',
      'primer',
    ];
  }

  _setupNestedClasses() {
    super._setupNestedClasses();
    if(this.primer.constructor !== Primer) {
      this.primer = new Primer(this.primer);
    }
  }

  validate() {
    assertIsInstance(this.primer, Primer, 'primer');
    super.validate();
  }
}


export default DeprecatedPcrProductSequenceModel;
