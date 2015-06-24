import {assertIsNumber, assertIsBoolean} from '../../common/lib/testing_utils';


/**
 * @class SequenceRange
 * @attribute {Integer}  from  Value is 0 based.
 *                             Is always <= `to()`.
 */
class SequenceRange {
  // from: number;
  // size: number;
  // reverse: boolean;

  constructor({from, size, reverse = false}) {
    this.from = from;
    this.size = size;
    this.reverse = reverse;
    assertIsNumber(this.from, 'from');
    assertIsNumber(this.size, 'size');
    assertIsBoolean(this.reverse, 'reverse');
  }
  get to() { return this.from + this.size; }
}


/**
 * @method  newFromOld
 * Creates a SequenceRange instance from an old range object, correcting
 * for the new range in the process (where `to` is exclusive not inclusive).
 * @param  {Object}   oldRange
 * @param  {String}   oldReverseName
 * @param  {Boolean}  returnObject
 * @return {SequenceRange}
 */
SequenceRange.newFromOld = function(oldRange, oldReverseName='reverseComplement', returnObject=false) {
  var newRange = {
    from: oldRange.from
  };
  var to = oldRange.to;
  if(oldRange[oldReverseName]) {
    newRange.from = oldRange.to + 1;
    to = oldRange.from;
  }
  newRange.size = to + 1 - newRange.from;
  newRange.reverse = oldRange[oldReverseName];
  return returnObject ? newRange : new SequenceRange(newRange);
};


export default SequenceRange;
