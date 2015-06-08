import {toArray} from 'underscore';

export default function switchFeatureContext(fn) {
  return function() {
    var args = toArray(arguments);
    var sequence = this.sequenceCanvas.sequence;
    var context = (this.features === undefined) ? 
      sequence : 
      sequence.clone().set({ 
        features: this.features 
      }, {silent: true});

    return sequence[fn].apply(context, args);
  };
}
