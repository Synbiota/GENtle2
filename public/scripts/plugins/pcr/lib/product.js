import {version1GenericPreProcessor} from 'gentle-utils/preprocessor';
import Sequence from '../../../sequence/models/sequence';
import PcrPrimer from './pcr_primer';


class PcrProductSequence extends Sequence {
  constructor(attrs, ...args) {
    attrs.readOnly = true;
    super(attrs, ...args);
    this.set({_type: 'pcr_product'}, {silent: true});
  }

  defaults() {
    var defaults = super.defaults();
    return _.extend(super.defaults(), {
      displaySettings: _.extend({}, defaults.displaySettings, {
        rows: _.extend({}, defaults.displaySettings.rows || {}, {
          aaOffset: 1,
        })
      })
    });
  }

  get requiredFields() {
    return super.requiredFields.concat([
      'forwardPrimer',
      'reversePrimer',
      'stickyEnds'
    ]);
  }

  validateFields(attributes) {
    super.validateFields(attributes);
    // Remove once stickyEnds are a class in their own right and their
    // constructor would raise this error instead / return an empty stickyEnds
    // instance
    if(!attributes.stickyEnds) throw new TypeError(`stickyEnds provided as attribute but were: ${attributes.stickyEnds}`);
  }
}


var version1forwardPrimerPreProcessor = version1GenericPreProcessor('forwardPrimer');
var version1reversePrimerPreProcessor = version1GenericPreProcessor('reversePrimer');
PcrProductSequence.registerPreProcessor(version1forwardPrimerPreProcessor);
PcrProductSequence.registerPreProcessor(version1reversePrimerPreProcessor);
PcrProductSequence.registerAssociation(PcrPrimer, 'forwardPrimer', false);
PcrProductSequence.registerAssociation(PcrPrimer, 'reversePrimer', false);


export default PcrProductSequence;
