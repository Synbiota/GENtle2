import _ from 'underscore';
import {assertion, assertIsInstance} from '../../../common/lib/testing_utils';
import SequenceModel from '../../../sequence/models/sequence';
import SequenceRange from '../../../library/sequence-model/range';


class ChildSequence {
  constructor(attributes) {
    // FIXME:  `uniqueId` does not work across browser sessions.
    var id = _.uniqueId();
    _.defaults(attributes, {
      id: id,
      name: `Child sequence ${id}`,
      // if true, it means it's a reverse (antisense) sequence, complementary to
      // the forward (sense) strand.
      reverse: false,
    });

    _.each(this.allFields, (field) => {
      if(_.has(attributes, field)) this[field] = attributes[field];
    });

    // Run any setup required
    this.setup();

    // Data validation
    this.validate();
  }

  setup() {
    if(!(this.range instanceof SequenceRange)) {
      this.range = new SequenceRange(this.range);
    }
  }

  get allFields() {
    return this.requiredFields.concat(this.optionalFields);
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
      'reverse',
    ];
  }

  getSequence() {
    return this.parentSequence.getSubSeq(this.range.from, this.range.to, this.parentSequence.STICKY_END_FULL);
  }

  validate() {
    _.each(this.requiredFields, (field) => {
      assertion(_.has(this, field), `Field \`${field}\` is absent`);
    });
    assertIsInstance(this.parentSequence, SequenceModel, 'assertIsInstance');
    assertIsInstance(this.range, SequenceRange, 'range');
  }

  toJSON() {
    return _.reduce(this.allFields, ((memo, field) => {
      memo[field] = this[field];
      return memo;
    }), {});
  }

  getLength() {
    return this.range.size;
  }
}


export default ChildSequence;
