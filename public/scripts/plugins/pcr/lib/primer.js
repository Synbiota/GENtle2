import {naiveReverseString} from '../../../common/lib/utils';


// Allows us to stub out in tests
var assertion = function(test, message) {
  console.assert(test, message);
};


class Primer {
  // TODO generalise this to a sequence annotation of another sequence
  constructor (data) {
    var id = _.uniqueId();
    _.defaults(data, {
      id: id,
      name: `Primer ${id}`,
      antisense: false,  // if true, it means it's an antisense primer for the sense strand
    });

    this.requiredFields = ['sequence', 'from', 'to', 'meltingTemperature', 'gcContent'];

    this.allFields = this.requiredFields.concat(['id', 'name', 'antisense']);

    _.each(this.allFields, (field) => {
      if(_.has(data, field)) this[field] = data[field];
    });

    // Data validation
    this.validate();
  }

  validate () {
    _.each(this.requiredFields, (field) => {
      assertion(_.has(this, field), `Testing presence of field ${field}`);
    });
    var msg = `Testing valid from, to and antisense values: ${this.from}, ${this.to}, ${this.antisense}`;
    assertion(_.isNumber(this.from) && !_.isNaN(this.from), '`from` should be a number');
    assertion(_.isNumber(this.to) && !_.isNaN(this.to), '`to` should be a number');
    if(this.antisense) {
      assertion(this.from >= this.to, msg);
    } else {
      assertion(this.from < this.to, msg);
    }
    var len = (this.sequence || '').length;
    assertion(Math.abs(this.to - this.from) <= len, `length ${len} is greater than \`from\` ${this.from} and \`to\` ${this.to}`);
  }

  toJSON () {
    return _.reduce(this.allFields, ((memo, field) => {
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

  reverse (startBpInParentSequence) {
    // Used by algorithms that treat sequences and their primers as 0 offset 
    // when they are actually dealing with a reversed sequence.
    var oldTo = this.to;
    this.to = startBpInParentSequence - this.from;
    this.from = startBpInParentSequence - oldTo;
    this.sequence = naiveReverseString(this.sequence);
  }

}


// Testing
if(false) {
  var oldAssertion = assertion;
  var testResults;
  assertion = function(test, message) {
    testResults.push({test, message});
  };
  var resetTestResults = function() {
    testResults = [];
  };
  resetTestResults();
  var testForNoFailures = function() {
    return _.filter(testResults, function(v){return !v.test;}).length === 0;
  };

  //  Tests
  var primerGood = new Primer({
    sequence: 'AGCTAAAAAAAAAA',
    from: 5,
    to: 10,
    meltingTemperature: 48,
    gcContent: 0.5,
  });
  console.assert(testForNoFailures, "There should be no error");
  resetTestResults();

  var primerSequenceTooShort = new Primer({
    sequence: 'AGCT',
    from: 5,
    to: 10,
    meltingTemperature: 48,
    gcContent: 0.5,
  });
  console.assert(testResults[8].test === false, "There should be an error about `from` being more than `sequence.length`");
  console.assert(testResults[8].message === "length 4 is greater than `from` 5 and `to` 10");
  resetTestResults();

  var primerMissingField = new Primer({
    from: 5,
    to: 10,
    meltingTemperature: 48,
    gcContent: 0.5,
  });

  console.assert(testResults[0].test === false, "There should be an error about a missing field");
  console.assert(testResults[0].message === "Testing presence of field sequence");
  resetTestResults();

  var primerInvalidFromToFieldValues = new Primer({
    sequence: 'AGCTAAAAAAAAAA',
    from: 5,
    to: 10,
    antisense: true,
    meltingTemperature: 48,
    gcContent: 0.5,
  });
  console.assert(testResults[7].test === false, "There should be an error about a missing field");
  console.assert(testResults[7].message === "Testing valid from, to and antisense values: 5, 10, true");
  resetTestResults();

  var primerReverse = new Primer({
    sequence: 'AGCTAAAAAAAAAA',
    from: 5,
    to: 10,
  });
  primerReverse.reverse(20);
  console.assert(testForNoFailures, "There should be no error");
  console.assert(primerReverse.to == 15);
  console.assert(primerReverse.from == 10);
  resetTestResults();

  assertion = oldAssertion;
}


export default Primer;
