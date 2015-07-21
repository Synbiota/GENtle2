import {version1GenericPreProcessor} from 'gentle-utils/preprocessor';
import PcrProductSequence from '../../plugins/pcr/lib/product';
import RdpEdit from './rdp_edit';
import SequencesCollection from '../../sequence/models/sequences';


class RdpPcrSequence extends PcrProductSequence {
  constructor(attrs, ...args) {
    var rdpPcrProduct = 'rdp_pcr_product';
    if(attrs._type && attrs._type !== rdpPcrProduct) {
      throw new TypeError(`RdpPcrSequence expected _type of "${rdpPcrProduct}" but was "${attrs._type}"`);
    }
    super(attrs, ...args);
    this.set({_type: rdpPcrProduct}, {silent: true});
  }

  get requiredFields() {
    return super.requiredFields.concat([
      // stickyEnds, forwardPrimer and reversePrimer are requiredFields of PcrProductSequence
      'sourceSequenceName',
      'shortName',
      'partType',
      'rdpEdits'
    ]);
  }
}


var version1RdpPcrSequencePreProcessor = version1GenericPreProcessor('rdpEdits');
RdpPcrSequence.registerPreProcessor(version1RdpPcrSequencePreProcessor);
RdpPcrSequence.registerAssociation(RdpEdit, 'rdpEdit', true);

SequencesCollection.registerConstructor(RdpPcrSequence, 'rdp_pcr_product');

export default RdpPcrSequence;
