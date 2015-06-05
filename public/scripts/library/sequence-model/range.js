

/**
 * @class SequenceRange
 * @attribute {Integer}  from  Value is 0 based.
 *                             Is always <= `to()`.
 */
class SequenceRange {
  from: number;
  size: number;
  reverse: boolean;

  constructor({from, size, reverse = false}) {
    this.from = from;
    this.size = size;
    this.reverse = reverse;
  }
  get to() { return this.from + this.size; }
}


/**
 * @method  newFromOld
 * Creates a SequenceRange instance from an old range object, correcting
 * for the new range in the process (where `to` is exclusive not inclusive).
 * @param  {Object} oldRange
 * @return {SequenceRange}
 */
SequenceRange.newFromOld = function(oldRange) {
  var newRange = {
    from: oldRange.from
  };
  var to = oldRange.to;
  if(oldRange.reverseComplement) {
    newRange.from = oldRange.to + 1;
    to = oldRange.from;
  }
  newRange.size = to + 1 - newRange.from;
  newRange.reverse = oldRange.reverseComplement;
  return new SequenceRange(newRange);
};


export default SequenceRange;
