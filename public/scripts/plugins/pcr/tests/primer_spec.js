import _ from 'underscore';
import {assertIsNumber, stubAssertion} from '../../../common/lib/testing_utils';
import Primer from '../lib/primer';


var testResults = [];
var oldAssertion;

var getFailures = function() {
  return _.filter(testResults, (testResult) => !testResult.test);
};

var testForNoFailures = function() {
  return getFailures().length === 0;
};

describe('pcr primer class', function() {
  beforeEach(function() {
    if(!oldAssertion) {
      var newAssertion = function(test, message) {
        testResults.push({test, message});
      };
      oldAssertion = stubAssertion(newAssertion);
    }
  });

  it('can instantiate', function() {
    var primerGood = new Primer({
      sequence: 'AGCTAAAAAAAAAA',
      from: 5,
      to: 10,
      meltingTemperature: 48,
      gcContent: 0.5,
    });
    expect(testForNoFailures()).toBeTruthy();
    testResults = [];
  });

  it('should be an error about `from` being more than `sequence.length`', function() {
    var primerSequenceTooShort = new Primer({
      sequence: 'AGCT',
      from: 5,
      to: 10,
      meltingTemperature: 48,
      gcContent: 0.5,
    });
    var failures = getFailures();
    expect(failures.length).toEqual(1);
    expect(failures[0].test).toEqual(false);
    expect(failures[0].message).toEqual("length of sequence '4' is less than length of primer '6' (`from` 5 and `to` 10)");
    testResults = [];
  });

  it('should error about a missing required field', function() {
    var primerMissingField = new Primer({
      from: 5,
      to: 10,
      meltingTemperature: 48,
      gcContent: 0.5,
    });
    var failures = getFailures();
    expect(failures.length).toEqual(1);
    expect(failures[0].test).toEqual(false);
    expect(failures[0].message).toEqual("Field `sequence` is absent");
    testResults = [];
  });

  it('should error about invalid `from`, `to` and `reverse` values', function() {
    var primerInvalidFromToFieldValues = new Primer({
      sequence: 'AGCTAAAAAAAAAA',
      from: 5,
      to: 10,
      reverse: true,
      meltingTemperature: 48,
      gcContent: 0.5,
    });
    var failures = getFailures();
    expect(failures.length).toEqual(1);
    expect(failures[0].test).toEqual(false);
    expect(failures[0].message).toEqual("Invalid `from`, `to` and `reverse` values: 5, 10, true");
    testResults = [];
  });

  it('teardown', function() {
    stubAssertion(oldAssertion);
  });
});
