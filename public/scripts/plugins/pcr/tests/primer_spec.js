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

var expectNoFailures = function() {
  var errors = getFailures();
  expect(errors.length === 0).toBeTruthy(`There were ${errors.length} errors.  See console.`);
  if(errors.length) console.error(errors);
};

describe('Primer', function() {
  beforeAll(function() {
    var newAssertion = function(test, message, value=undefined) {
      testResults.push({test, message, value});
    };
    oldAssertion = stubAssertion(newAssertion);
  });

  afterAll(function() {
    stubAssertion(oldAssertion);
  });

  afterEach(function() {
    testResults = [];
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
    expectNoFailures();
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
  });

  it('should return the theoretical and practical meltingTemperature', function() {
    var primer = new Primer({
      parentSequence: new SequenceModel({sequence: 'ATGCATGCATGCATGCATGC'}),
      range: {
        from: 5,
        size: 5,
      },
      meltingTemperature: 48,
      gcContent: 0.5,
    });
    expectNoFailures();
    expect(Primer.PRACTICAL_MELTING_TEMPERATURE_DIFF).toEqual(5);
    expect(primer.theoreticalMeltingTemperature).toEqual(48);
    expect(primer.practicalMeltingTemperature).toEqual(48-Primer.PRACTICAL_MELTING_TEMPERATURE_DIFF);
  });
});
