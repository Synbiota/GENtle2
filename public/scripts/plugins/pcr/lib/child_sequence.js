import _ from 'underscore';
import {assertion, assertIsInstance} from '../../../common/lib/testing_utils';
import SequenceModel from '../../../sequence/models/sequence';
import SequenceRange from '../../../library/sequence-model/range';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';


class ChildSequence {
  constructor(attributes) {
    // FIXME:  `uniqueId` does not work across browser sessions.
    var id = _.uniqueId();
    _.defaults(attributes, {
      id: id,
      name: `Child sequence ${id}`,
    });

    _.each(this.allFields, (field) => {
      let writable = true;
      let configurable = true;
      if(_.has(attributes, field)) {
        // Makes non-enumerable fields we want to remain hidden and only used by
        // the class instance.  e.g. Which won't be found with `for(x of this)`
        let enumerable = !_.contains(this.nonEnumerableFields, field);
        if(!enumerable) {
          configurable = writable = false;
        }
        let value = attributes[field];
        Object.defineProperty(this, field, {enumerable, value, writable, configurable});
      }
    });

    // Run any setup required
    this.setup();

    // Data validation
    this.validate();
  }

  setup() {
    if(this.range && !(this.range instanceof SequenceRange)) {
      this.range = new SequenceRange(this.range);
    }
  }

  get allFields() {
    return this.requiredFields.concat(this.optionalFields);
  }

  /**
   * @method  nonEnumerableFields
   * @return {Array}
   */
  get nonEnumerableFields() {
    return [
      'parentSequence',
    ];
  }

  get requiredFields() {
    return [
      'parentSequence',
      'range',
    ];
  }

  get optionalFields() {
    return [
      'id',
      'name',
    ];
  }

  getSequence() {
    if(this.range.size === 0) return '';
    let subSubsequence = this.parentSequence.getSubSeq(this.range.from, this.range.to - 1, this.parentSequence.STICKY_END_FULL);
    if(this.range.reverse) {
      subSubsequence = SequenceTransforms.toReverseComplements(subSubsequence);
    }
    return subSubsequence;
  }

  validate() {
    _.each(this.requiredFields, (field) => {
      assertion(_.has(this, field), `Field \`${field}\` is absent`);
    });
    assertIsInstance(this.parentSequence, SequenceModel, 'parentSequence');
    assertIsInstance(this.range, SequenceRange, 'range');

    if(this.parentSequence && this.range) {
      let len = this.parentSequence.getLength(this.parentSequence.STICKY_END_FULL);
      assertion(this.range.from >= 0,  'Range.from should be >= 0');
      assertion(this.range.from < len, 'Range.from should be < len');
      assertion(this.range.to >= 0,    'Range.to should be >= 0');
      assertion(this.range.to <= len,  'Range.to should be <= len');
    }
  }

  toJSON() {
    let attributes = _.reduce(this.allFields, ((memo, field) => {
      if(_.contains(this.nonEnumerableFields, field)) {
        // skip
      } else {
        memo[field] = this[field];
      }
      return memo;
    }), {});
    return attributes;
  }

  getLength() {
    return this.range.size;
  }
}


export default ChildSequence;
