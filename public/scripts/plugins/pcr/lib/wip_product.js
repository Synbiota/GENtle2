import TemporarySequence from '../../../sequence/models/temporary_sequence';


class WipPcrProductSequence extends TemporarySequence {
  constructor() {
    super(...arguments);
    this.set('_type', 'wip_pcr_product', {silent: true});
  }

  get optionalFields() {
    return super.optionalFields.concat([
      'inProgress',
      'sourceSequenceName',
    ]);
  }
}


export default WipPcrProductSequence;
