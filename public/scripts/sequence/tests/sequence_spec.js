import Sequence from '../models/sequence';
import {stubCurrentUser} from '../../common/tests/stubs';


var initialSequenceContent = 'ATCGATCGATCGATCG';
var initialSequenceLength = initialSequenceContent.length;

var fixtures = [{
  name: 'Test sequence',
  sequence: initialSequenceContent,
  features: [{
    ranges: [{
      from: 3,
      to: 7
    }],
    name: 'test feature',
    desc: 'test feature description',
    type: 'gene'
  }]
}];

var sequence;

beforeEach(function() {
  stubCurrentUser();
  sequence = new Sequence(fixtures[0]);

  spyOn(sequence, 'save'); // Disable save function
});


describe('creating and reading a sequence', function() {
  it('should be able to get the name', function() {
    expect(sequence.get('name')).toEqual('Test sequence');
  });

  it('should be able to get the sequence', function() {
    expect(sequence.get('sequence')).toEqual(initialSequenceContent);
  });

  it('should be able to get a subsequence', function() {
    expect(sequence.getSubSeq(2,5)).toEqual('CGAT');
  });

});


describe('when inserting bases into a sequence', function() {

  beforeEach(function() {
    sequence.insertBases('AAA', 3);
  });

  it('should update the sequence', function() {
    expect(sequence.get('sequence')).toEqual('ATCAAAGATCGATCGATCG');
    expect(sequence.getSubSeq(3, 5)).toEqual('AAA');
    expect(sequence.save).toHaveBeenCalled();
  });

  it('should move the features', function() {
    var featureRange = sequence.get('features.0.ranges.0');
    expect(featureRange.from).toEqual(6);
    expect(featureRange.to).toEqual(10);
  });
});


describe('when deleting bases from a sequence in the middle of a feature', function() {

  beforeEach(function() {
    sequence.deleteBases(2, 2);
  });

  it('should update the sequence', function() {
    expect(sequence.get('sequence')).toEqual('ATATCGATCGATCG');
    expect(sequence.getSubSeq(3, 5)).toEqual('TCG');
    expect(sequence.save).toHaveBeenCalled();
  });

  it('should move the beginning of the features', function() {
    var featureRange = sequence.get('features.0.ranges.0');
    expect(featureRange.from).toEqual(2);
  });

  it('should move the end of the features', function() {
    var featureRange = sequence.get('features.0.ranges.0');
    expect(featureRange.to).toEqual(5);
  });
});


describe('when deleting bases containing an entire sequence', function() {

  beforeEach(function() {
    sequence.deleteBases(2, 6);
  });

  it('should update the sequence', function() {
    expect(sequence.get('sequence')).toEqual('ATATCGATCG');
    expect(sequence.getSubSeq(3, 5)).toEqual('TCG');
    expect(sequence.save).toHaveBeenCalled();
  });

  it('should delete the feature', function() {
    var features = sequence.get('features');
    expect(features.length).toEqual(0);
  });
});
