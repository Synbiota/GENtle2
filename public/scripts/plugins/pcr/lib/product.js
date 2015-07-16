import {version1GenericPreProcessor} from 'gentle-utils/preprocessor';
import Sequence from '../../../sequence/models/sequence';
import PcrPrimer from './pcr_primer';


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


var version1forwardPrimerPreProcessor = version1GenericPreProcessor('forwardPrimer');
var version1reversePrimerPreProcessor = version1GenericPreProcessor('reversePrimer');
PcrProductSequence.registerPreProcessor(version1forwardPrimerPreProcessor);
PcrProductSequence.registerPreProcessor(version1reversePrimerPreProcessor);
PcrProductSequence.registerAssociation(PcrPrimer, 'forwardPrimer', false);
PcrProductSequence.registerAssociation(PcrPrimer, 'reversePrimer', false);


export default PcrProductSequence;
