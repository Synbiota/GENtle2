import _ from 'underscore';
import {stubCurrentUser} from '../../../common/tests/stubs';
import {stubAssertion} from '../../../common/lib/testing_utils';
import Primer from '../lib/primer';
import SequenceModel from '../../../sequence/models/sequence';


stubCurrentUser();

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
      var newAssertion = function(test, message, value=undefined) {
        testResults.push({test, message, value});
      };
      oldAssertion = stubAssertion(newAssertion);
    }
  });

  it('can instantiate', function() {
    new Primer({
      parentSequence: new SequenceModel({sequence: 'ATGCATGCATGCATGCATGC'}),
      range: {
        from: 5,
        size: 5,
      },
      meltingTemperature: 48,
      gcContent: 0.5,
    });
    expect(testForNoFailures()).toBeTruthy();
    testResults = [];
  });

  it('should be an error about `from` and `to` being more than `sequence.length`', function() {
    new Primer({
      parentSequence: new SequenceModel({sequence: 'ATGC'}),
      range: {
        from: 5,
        size: 5,
      },
      meltingTemperature: 48,
      gcContent: 0.5,
    });
    var failures = getFailures();
    expect(failures.length).toEqual(2);
    expect(failures[0].test).toEqual(false);
    expect(failures[0].message).toEqual("Range.from should be < len");
    testResults = [];
  });

  it('should error about a missing required field', function() {
    // Primer missing a field
    new Primer({
      range: {
        from: 5,
        size: 5,
      },
      meltingTemperature: 48,
      gcContent: 0.5,
    });
    var failures = getFailures();
    expect(failures.length).toEqual(1);
    // TODO make that test work on circleci
    // expect(failures[0].message.match("`parentSequence` should be a instance of SequenceModel")).toBeTruthy();
    testResults = [];
  });

  it('teardown', function() {
    stubAssertion(oldAssertion);
  });
});
