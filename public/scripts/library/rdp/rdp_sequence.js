import {version1GenericPreProcessor} from 'gentle-utils/preprocessor';
import PcrProductSequence from '../../plugins/pcr/lib/product';
import RdpEdit from './rdp_edit';
import SequencesCollection from '../../sequence/models/sequences';
import tracedLog from '../../common/lib/traced_log';


class RdpSequence extends PcrProductSequence {
  constructor(attrs, ...args) {
    var rdpPcrProduct = 'rdp_pcr_product';
    if(attrs._type && attrs._type !== rdpPcrProduct) {
      throw new TypeError(`RdpSequence expected _type of "${rdpPcrProduct}" but was "${attrs._type}"`);
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


var version1RdpSequencePreProcessor = version1GenericPreProcessor('rdpEdits');
RdpSequence.registerPreProcessor(version1RdpSequencePreProcessor);
RdpSequence.registerAssociation(RdpEdit, 'rdpEdit', true);

SequencesCollection.registerConstructor(RdpSequence, 'rdp_pcr_product');

export default RdpSequence;
