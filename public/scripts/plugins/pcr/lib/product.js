import Sequence from '../../../sequence/models/sequence';


class PcrProductSequence extends Sequence {
  constructor(attrs, ...args) {
    attrs.readOnly = true;
    super(attrs, ...args);
    this.set({_type: 'pcr_product'}, {silent: true});
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
