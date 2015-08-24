import _ from 'underscore';
import {version1GenericPreProcessor} from 'gentledna-utils/dist/preprocessor';
import SequenceModel from '../../../sequence/models/sequence';
import SequencesCollection from '../../../sequence/models/sequences';
import PcrPrimer from './pcr_primer';


var pcr_product = 'pcr_product';

class PcrProductSequence extends SequenceModel {
  constructor(attrs, ...args) {
    attrs.readOnly = true;
    super(attrs, ...args);
    this.set({_type: pcr_product}, {silent: true});
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
    ]);
  }

  get optionalFields() {
    return super.optionalFields.concat([
      'stickyEnds',
    ]);
  }

  validateFields(attributes) {
    var errors = super.validateFields(attributes);
    return errors;
  }
}


var version1forwardPrimerPreProcessor = version1GenericPreProcessor('forwardPrimer');
var version1reversePrimerPreProcessor = version1GenericPreProcessor('reversePrimer');
PcrProductSequence.registerPreProcessor(version1forwardPrimerPreProcessor);
PcrProductSequence.registerPreProcessor(version1reversePrimerPreProcessor);
PcrProductSequence.registerAssociation(PcrPrimer, 'forwardPrimer', false);
PcrProductSequence.registerAssociation(PcrPrimer, 'reversePrimer', false);

SequencesCollection.registerConstructor(PcrProductSequence, pcr_product);

export default PcrProductSequence;
