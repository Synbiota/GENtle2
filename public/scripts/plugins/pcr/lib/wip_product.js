import Sequence from '../../../sequence/models/sequence';


class WipPcrProductSequence extends Sequence {
  constructor(attributes, ...other) {
    var wip_pcr_product = 'wip_pcr_product';
    if(attributes._type && attributes._type !== wip_pcr_product) {
      throw new TypeError(`WipPcrProductSequence expected _type of "${wip_pcr_product}" but was "${attributes._type}"`);
    }
    attributes._type = wip_pcr_product;
    super(attributes, ...other);
  }

  get optionalFields() {
    return super.optionalFields.concat([
      'inProgress',
      'sourceSequenceName',
    ]);
  }
}


export default WipPcrProductSequence;
