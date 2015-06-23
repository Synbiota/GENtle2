import {version1GenericPreProcessor} from 'gentle-utils/preprocessor';
import PcrProductSequence from '../../plugins/pcr/lib/product';
import RdpEdit from './rdp_edit';
import SequencesCollection from '../../sequence/models/sequences';


class RdpSequence extends PcrProductSequence {
  constructor(attrs, ...args) {
    var rdp_pcr_product = 'rdp_pcr_product';
    if(attrs._type && attrs._type !== rdp_pcr_product) {
      throw new TypeError(`RdpSequence expected _type of "${rdp_pcr_product}" but was "${attrs._type}"`);
    }
    attrs._type = rdp_pcr_product;
    super(attrs, ...args);
  }

  get requiredFields() {
    return super.requiredFields.concat([
      // stickyEnds, forwardPrimer and reversePrimer are requiredFields of PcrProductSequence
      'sourceSequenceName',
      'shortName',
      'partType',
      'rdpEdits',
    ]);
  }
}


var version1RdpSequencePreProcessor = version1GenericPreProcessor('rdpEdits');
RdpSequence.registerPreProcessor(version1RdpSequencePreProcessor);
RdpSequence.registerAssociation(RdpEdit, 'rdpEdit', true);

SequencesCollection.registerConstructor(RdpSequence, 'rdp_pcr_product');

export default RdpSequence;
