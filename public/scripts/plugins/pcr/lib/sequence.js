import {assertion, assertIsNumber} from '../../../common/lib/testing_utils';
import deprecated from '../../../library/utils/deprecated_method';


class Sequence {
  constructor (data) {
    var id = _.uniqueId();
    _.defaults(data, {
      id: id,
      name: `Sequence ${id}`,
      // if true, it means it's an antisense sequence, complementary to the
      // sense strand
      antisense: false,
    });

    _.each(this.allFields(), (field) => {
      if(_.has(data, field)) this[field] = data[field];
    });

    // Run any setup required
    this.setup();

    // Data validation
    this.validate();
  }

  setup () {
  }

  allFields () {
    return this.requiredFields().concat(this.optionalFields());
  }

  optionalFields () {
    return ['id', 'name', 'antisense'];
  }

  requiredFields () {
    return ['sequence', 'from', 'to'];
  }

  validate () {
    _.each(this.requiredFields(), (field) => {
      assertion(_.has(this, field), `Field \`${field}\` is absent`);
    });

    assertIsNumber(this.from, 'from');
    assertIsNumber(this.to, 'to');

    // TODO move this to a childSequence model and use the
    // validForParentSequence method
    var msg = `Invalid \`from\`, \`to\` and \`antisense\` values: ${this.from}, ${this.to}, ${this.antisense}`;
    if(this.antisense) {
      assertion(this.from > this.to, msg);
    } else {
      assertion(this.from <= this.to, msg);
    }

    if(this.sequence) {
      var len = this.sequence.length;
      assertion((len >= this.getLength()), `length of sequence '${len}' is less than length of primer '${this.getLength()}' (\`from\` ${this.from} and \`to\` ${this.to})`);
    }
  }

  toJSON () {
    return _.reduce(this.allFields(), ((memo, field) => {
      memo[field] = this[field];
      return memo;
    }), {});
  }

  // TODO remove this function and rely on this.antisense/reverse and this.from
  length () {
    deprecated(this, 'length', 'getLength');
    return this.getLength();
  }

  getLength () {
    var val = Math.abs(this.from - this.to);
    if(!this.antisense) val += 1;
    return val;
  }

  duplicate () {
    var data = this.toJSON();
    delete data.id;
    return new this.constructor(data);
  }

  // TODO move this method to a childSequence model
  validForParentSequence (sequenceLength) {
    return (
      this.from >= 0 &&
      this.to >= (this.antisense ? -1 : 0) &&
      this.from < sequenceLength &&
      this.to < (this.antisense ? (sequenceLength - 1) : sequenceLength)
    );
  }

  // TODO move this method to a childSequence model
  shift (count) {
    this.to += count;
    this.from += count;
  }

  reverseDirection () {
    var tmp = this.from;
    if(this.antisense) {
      this.from = this.to + 1;
      this.to = tmp;
    } else {
      this.from = this.to;
      this.to = tmp - 1;
    }
    this.antisense = !this.antisense;
  }

}


export default Sequence;
