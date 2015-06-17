import Sequence from '../../../sequence/models/sequence';
import _ from 'underscore';


class WipPcrProductSequence extends Sequence {
  defaults() {
    return _.extend(super.defaults(), {
      inProgress: true,
      _type: 'wip_pcr_product'
    });
  }

  get requiredFields() {
    return super.requiredFields.concat([
      // 'forwardPrimer',
      // 'reversePrimer',
      // 'stickyEnds'
    ]);
  }

  get optionalFields() {
    return super.optionalFields.concat([
      'inProgress',
      'sourceSequenceName',
      // the following might be unnecessary
      'forwardPrimer',
      'reversePrimer',
      'stickyEnds'
    ]);
  }
}


export default WipPcrProductSequence;
