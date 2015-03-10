import {assertIsNumber, stubAssertion} from '../../../common/lib/testing_utils';
import Sequence from './sequence';


class Primer extends Sequence {
  requiredFields () {
    return ['sequence', 'from', 'to', 'meltingTemperature', 'gcContent'];
  }

  validate () {
    assertIsNumber(this.meltingTemperature, 'meltingTemperature');
    assertIsNumber(this.gcContent, 'gcContent');
    super();
  }
}


// Testing
if(false) {
  var newAssertion = function(test, message) {
    testResults.push({test, message});
  };
  var oldAssertion = stubAssertion(newAssertion);
  
  var testResults;
  var resetTestResults = function() {
    testResults = [];
  };
  resetTestResults();

  var getFailures = function() {
    return _.filter(testResults, function(v){return !v.test;});
  };
  var testForNoFailures = function() {
    return getFailures().length === 0;
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
  var failures = getFailures();
  console.assert(failures.length === 1, 'There should be a failure');
  console.assert(failures[0].test === false, "There should be an error about `from` being more than `sequence.length`");
  console.assert(failures[0].message === "length 4 is less than `from` 5 and `to` 10");
  resetTestResults();

  var primerMissingField = new Primer({
    from: 5,
    to: 10,
    meltingTemperature: 48,
    gcContent: 0.5,
  });
  var failures = getFailures();
  console.assert(failures.length === 2, 'There should be a failure');
  console.assert(failures[0].test === false, "There should be an error about a missing field");
  console.assert(failures[0].message === "Field `sequence` is absent");
  resetTestResults();

  var primerInvalidFromToFieldValues = new Primer({
    sequence: 'AGCTAAAAAAAAAA',
    from: 5,
    to: 10,
    antisense: true,
    meltingTemperature: 48,
    gcContent: 0.5,
  });
  var failures = getFailures();
  console.assert(failures.length === 1, 'There should be a failure');
  console.assert(failures[0].test === false, "There should be an error about a missing field");
  console.assert(failures[0].message === "Invalid `from`, `to` and `antisense` values: 5, 10, true");
  resetTestResults();


  stubAssertion(oldAssertion);
}


export default Primer;
