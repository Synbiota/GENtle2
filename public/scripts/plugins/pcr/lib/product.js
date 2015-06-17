import TemporarySequence from '../../../sequence/models/temporary_sequence';


class PcrProductSequence extends TemporarySequence {
  get requiredFields() {
    return super.requiredFields.concat([
      'forwardPrimer',
      'reversePrimer',
      'stickyEnds',
    ]);
  }
}


export default PcrProductSequence;
