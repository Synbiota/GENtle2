import _ from 'underscore';
import Sequence from './sequence';


var TemporarySequenceModel = Sequence.extend({
  save: function() {
    // noop
    return this;
  },

  asSequence: function () {
    return new Sequence(this.attributes);
  },
});


TemporarySequenceModel.ensureTemporary = function(sequence, silenceWarning=false) {
  if(sequence.constructor !== TemporarySequenceModel) {
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
