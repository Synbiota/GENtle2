import {assertion, assertIsNumber} from '../../../common/lib/testing_utils';


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
    
    var msg = `Invalid \`from\`, \`to\` and \`antisense\` values: ${this.from}, ${this.to}, ${this.antisense}`;
    if(this.antisense) {
      assertion(this.from >= this.to, msg);
    } else {
      assertion(this.from <= this.to, msg);
    }

    if(this.sequence) {
      var len = this.sequence.length;
      assertion((len >= this.length()), `length of sequence: \`${len}\` is less than length of primer: ${this.length()} (\`from\` ${this.from} and \`to\` ${this.to})`);
    }
  }

  toJSON () {
    return _.reduce(this.allFields(), ((memo, field) => {
      memo[field] = this[field];
      return memo;
    }), {});
  }

  length () {
    return Math.abs(this.from - this.to) + 1;
  }

  duplicate () {
    var data = this.toJSON();
    delete data.id;
    return new this.constructor(data);
  }

  shift (count) {
    this.to += count;
    this.from += count;
  }
}


export default Sequence;
