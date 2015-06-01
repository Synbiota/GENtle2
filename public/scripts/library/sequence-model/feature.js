import SequenceRange from './range';


class SequenceFeature {
  name: String;
  desc: String;
  ranges: Array;  // Array of `SequenceRange`s
  _type: String;
  _id: Integer;  // May be undefined
  // note, gene, protein, product, bound_moiety, may also be present.

  constructor(name, desc, ranges, _type, _id, other={}) {
    this.name = name || '';
    this.desc = desc || '';
    this.ranges = ranges || [];
    this._type = _type || '';
    this._id = _id || _.uniqueId();
    _.each(_.pairs(other), function(pair) {
      let key = pair[0];
      if(this[key]) throw new Error(`Attribute "${key}" already exists on SequenceFeature.`)
      this[key] = pair[1];
    })
  }
}


/**
 * @method  newFromOld
 * Creates a SequenceFeature instance from the old feature objects.
 * @param  {Object} oldFeature
 * @return {SequenceFeature}
 */
SequenceFeature.newFromOld = function(oldFeature) {
  oldFeature = _.deepClone(oldFeature);
  var ranges = _.map(oldFeature.ranges, function(range) {
    return SequenceRange.newFromOld(range);
  });
  var other = {}; //_.keys(oldFeature);
  return new SequenceFeature(oldFeature.name, oldFeature.desc, ranges, oldFeature._type, oldFeature._id, other);
};


export default SequenceFeature;
