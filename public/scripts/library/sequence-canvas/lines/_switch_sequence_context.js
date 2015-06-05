export default function switchFeatureContext(fn) {
  return function() {
    var args = _.toArray(arguments);
    var sequence = this.sequenceCanvas.sequence;
    var context = (this.features === undefined) ? sequence : { 
      attributes: {
        features: this.features 
      }
    };

    args.shift();

    return sequence[fn].apply(context, args);
  }
}
