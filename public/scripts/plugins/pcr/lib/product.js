import Sequence from '../../../sequence/models/sequence';


class PcrProductSequence extends Sequence {
  constructor(attrs, ...args) {
    attrs._type = 'pcr_product';
    attrs.readOnly = true;
    super(attrs, ...args);
  }

  get requiredFields() {
    return super.requiredFields.concat([
      'forwardPrimer',
      'reversePrimer',
      'stickyEnds'
    ]);
  }
}


export default PcrProductSequence;
