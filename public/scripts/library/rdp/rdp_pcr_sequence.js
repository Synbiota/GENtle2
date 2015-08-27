import {version1GenericPreProcessor} from 'gentledna-utils/dist/preprocessor';
import PcrProductSequence from '../../plugins/pcr/lib/product';
import RdpEdit from './rdp_edit';
import SequencesCollection from '../../sequence/models/sequences';


var rdpPcrProduct = 'rdp_pcr_product';

class RdpPcrSequence extends PcrProductSequence {
  constructor(attrs, ...args) {
    if(attrs._type && attrs._type !== rdpPcrProduct) {
      throw new TypeError(`RdpPcrSequence expected _type of "${rdpPcrProduct}" but was "${attrs._type}"`);
    }
    super(attrs, ...args);
    this.set({_type: rdpPcrProduct}, {silent: true});
  }

  get requiredFields() {
    return super.requiredFields.concat([
      // forwardPrimer and reversePrimer are requiredFields of PcrProductSequence
      'stickyEnds',
      'sourceSequenceName',
      'shortName',
      'partType',
      'rdpEdits'
    ]);
  }

  get optionalFields() {
    return _.reject(super.optionalFields, (field) => field === 'stickyEnds');
  }
}


var version1RdpPcrSequencePreProcessor = version1GenericPreProcessor('rdpEdits');
RdpPcrSequence.registerPreProcessor(version1RdpPcrSequencePreProcessor);
RdpPcrSequence.registerAssociation(RdpEdit, 'rdpEdit', true);

SequencesCollection.registerConstructor(RdpPcrSequence, rdpPcrProduct);

export default RdpPcrSequence;
