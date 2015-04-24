import Sequence from '../models/sequence';
import {stubCurrentUser} from '../../common/tests/stubs';
import testAllSequenceModels from '../../library/models/tests/sequence_spec_mixin';


testAllSequenceModels(Sequence);


describe('BackboneSequenceModel', function() {
  var initialSequenceContent = 'ATCGATCGATCGATCG';
  var fixtures = function() {
    return [{
      name: 'Test sequence',
      sequence: initialSequenceContent,
      from: 0,
      to: initialSequenceContent.length-1,
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
  };
  var sequence;
  var baseSequenceModel;

  beforeEach(function() {
    stubCurrentUser();
    sequence = new Sequence(fixtures()[0]);
    baseSequenceModel = sequence.getBaseSequenceModel();

    spyOn(sequence, 'save'); // Disable save function
  });


  describe('creating and reading a sequence', function() {
    it('should be able to get the name', function() {
      expect(sequence.get('name')).toBeUndefined();
      expect(baseSequenceModel.name).toEqual('Test sequence');
    });

    it('should be able to get the sequence', function() {
      expect(sequence.get('sequence')).toBeUndefined();
      expect(baseSequenceModel.sequence).toEqual(initialSequenceContent);
    });

    it('should be able to get a subsequence', function() {
      expect(sequence.getSubSeq).toBeUndefined();
      expect(baseSequenceModel.getSubSeq(2,5)).toEqual('CGAT');
    });
  });


  describe('when inserting bases into a sequence', function() {
    beforeEach(function() {
      expect(sequence.insertBases).toBeUndefined();
      baseSequenceModel.insertBases('AAA', 3);
    });

    it('should update the sequence', function() {
      expect(baseSequenceModel.sequence).toEqual('ATCAAAGATCGATCGATCG');
      expect(baseSequenceModel.getSubSeq(3, 5)).toEqual('AAA');
      expect(sequence.save).toHaveBeenCalled();
    });

    it('should move the features', function() {
      var featureRange = baseSequenceModel.features[0].ranges[0];
      expect(featureRange.from).toEqual(6);
      expect(featureRange.to).toEqual(10);
    });
  });


  describe('when deleting bases from a sequence in the middle of a feature', function() {
    beforeEach(function() {
      baseSequenceModel.deleteBases(2, 2);
    });

    it('should update the sequence', function() {
      expect(baseSequenceModel.sequence).toEqual('ATATCGATCGATCG');
      expect(baseSequenceModel.getSubSeq(3, 5)).toEqual('TCG');
      expect(sequence.save).toHaveBeenCalled();
    });

    it('should move the beginning of the features', function() {
      var featureRange = baseSequenceModel.features[0].ranges[0];
      expect(featureRange.from).toEqual(2);
    });

    it('should move the end of the features', function() {
      var featureRange = baseSequenceModel.features[0].ranges[0];
      expect(featureRange.to).toEqual(5);
    });
  });


  describe('when deleting bases containing an entire sequence', function() {
    beforeEach(function() {
      baseSequenceModel.deleteBases(2, 6);
    });

    it('should update the sequence', function() {
      expect(baseSequenceModel.sequence).toEqual('ATATCGATCG');
      expect(baseSequenceModel.getSubSeq(3, 5)).toEqual('TCG');
      expect(sequence.save).toHaveBeenCalled();
    });

    it('should delete the feature', function() {
      var features = baseSequenceModel.features;
      expect(features.length).toEqual(0);
    });
  });
});
