import Sequence from '../../../sequence/models/sequence';


class PcrProductSequence extends Sequence {
  get requiredFields() {
    return super.requiredFields.concat([
      'forwardPrimer',
      'reversePrimer',
      'stickyEnds',
    ]);
  }
}


export default PcrProductSequence;
