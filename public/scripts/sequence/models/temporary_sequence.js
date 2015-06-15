import _ from 'underscore';
import Sequence from './sequence';


class TemporarySequenceModel extends Sequence {
  constructor(attributes, options={}) {
    options.disabledSave = true;
    super(attributes, options);
  }

  asSequence() {
    return new Sequence(this.attributes);
  }
}


TemporarySequenceModel.ensureTemporary = function(sequence, silenceWarning=false) {
  if(!(sequence.constructor instanceof TemporarySequenceModel)) {
    if(!silenceWarning) {
      console.warn('Sequence should be a TemporarySequence');
    }
    if(sequence.attributes) {
      sequence = new TemporarySequenceModel(_.deepClone(sequence.attributes));
    } else {
      throw "Must provide a Backbone model instance";
    }
  }
  return sequence;
};


export default TemporarySequenceModel;
