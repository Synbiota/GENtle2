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

    // Data validation
    this.validate();
  }

  allFields () {
    return this.requiredFields().concat(['id', 'name', 'antisense']);
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
      assertion(this.from < this.to, msg);
    }

    var len = (this.sequence || '').length;
    assertion((Math.abs(this.to - this.from) + 1) <= len, `length ${len} is less than \`from\` ${this.from} and \`to\` ${this.to}`);
  }

  toJSON () {
    return _.reduce(this.allFields(), ((memo, field) => {
      memo[field] = this[field];
      return memo;
    }), {});
  }

  duplicate () {
    var data = this.toJSON();
    delete data.id;
    return new Primer(data);
  }

  shift (count) {
    this.to += count;
    this.from += count;
  }
}


export default Sequence;
