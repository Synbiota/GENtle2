import sequenceModelFactory from '../factory';
// import {stubCurrentUser} from '../../common/tests/stubs';
import _ from 'underscore.mixed';
import Backbone from 'backbone';


// Todo – test with Backbone.Model instead of Backbone.DeepModel
var Sequence = sequenceModelFactory(Backbone.DeepModel);

var initialSequenceContent = 'ATCGATCGATCGATCG';
var initialSequenceLength = initialSequenceContent.length;
var stickyEnds = {
  start: {
    sequence: 'CCTGCAGTCAGTGGTCTCTAGAG',
    reverse: false,
    offset: 19,
    size: 4,
    name: "X",
  },
  end: {
    sequence: 'GAGATGAGACCGTCAGTCACGAG',
    reverse: true,
    offset: 19,
    size: 4,
    name: "Z'",
  }
};

var stickyEndedSequenceContent = stickyEnds.start.sequence + initialSequenceContent + stickyEnds.end.sequence;

var stickyEndedSequenceContentWithOverhang = stickyEndedSequenceContent.substring(stickyEnds.start.offset, stickyEndedSequenceContent.length - stickyEnds.end.offset);


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
},{
  name: 'Sticky Ended Sequence',
  sequence: stickyEndedSequenceContent,
  features: [{
    ranges: [{
      from: 0,
      to: 2
    }],
    name: 'Sticky End Feature',
    desc: 'This one will not show on clipped sticky ends.',
    type: 'gene',
  },{
    ranges: [{
      from: 1,
      to: 30
    }],
    name: 'Start Clipped Feature',
    desc: 'This one will be a shortened feature for clipped sticky end format.',
    type: 'gene',
  },{
    ranges: [{
      from: 24,
      to: 27
    }],
    name: 'Normal Feature',
    desc: 'This one will not be affected by clipped sticky ends.',
    type: 'gene',
  },{
    ranges: [{
      from: 30,
      to: stickyEndedSequenceContent.length - 2
    }],
    name: 'End Clipped Feature',
    desc: 'This one will be shortened at the end for clipped sticky end format.',
    type: 'gene',
  }
  ],
  stickyEnds: stickyEnds
}

];

var opts;

var sequence, stickyEndedSequence;

var setStickyEndFormat = function(format) {
  beforeEach(function() {
    stickyEndedSequence.setStickyEndFormat(format);  
  });
};

beforeEach(function() {
  sequence = new Sequence(fixtures[0]);
  stickyEndedSequence = new Sequence(fixtures[1]);

  spyOn(sequence, 'save'); // Disable save function
  spyOn(sequence, 'throttledSave');
  spyOn(stickyEndedSequence, 'save');
  spyOn(stickyEndedSequence, 'throttledSave');
});


describe('creating and reading a sequence', function() {

  it('should be able to get the name', function() {
    expect(sequence.get('name')).toEqual('Test sequence');
  });

  describe('without sticky ends', function(){
    it('should be able to get the sequence', function() {
      expect(sequence.get('sequence')).toEqual(initialSequenceContent);
    });

    it('should be able to get a subsequence', function() {
      expect(sequence.getSubSeq(2,5)).toEqual('CGAT');
    });
  });

  describe('with sticky ends', function(){

    describe('with full sticky end formatting', function(){
      beforeEach(function() {
        stickyEndedSequence.setStickyEndFormat('full');
      });

      it('should be able to get the sequence', function() {
        expect(stickyEndedSequence.get('sequence')).toEqual(stickyEndedSequenceContent);
      });

      it('should be able to get a subsequence', function() {
        expect(stickyEndedSequence.getSubSeq(2,5)).toEqual('TGCA');
      });
    });

    describe('with overhang sticky end formatting', function(){
      it('should be able to get the sequence', function() {
        expect(stickyEndedSequence.get('sequence')).toEqual(stickyEndedSequenceContentWithOverhang);
      });

      it('should be able to get a subsequence', function() {
        expect(stickyEndedSequence.getSubSeq(2,5)).toEqual('AGAT');
      });
    });

    describe('with sticky ends removed', function(){
      beforeEach(function() {
        stickyEndedSequence.setStickyEndFormat('none');
      });

      it('should be able to get the sequence', function() {
        expect(stickyEndedSequence.get('sequence')).toEqual(initialSequenceContent);
      });

      it('should be able to get a subsequence', function() {
        expect(stickyEndedSequence.getSubSeq(2,5)).toEqual('CGAT');
      });
    });

  });

});

describe('getting features from sticky ended sequences', function(){

  var features;
  var originalCoords = _.pluck(fixtures[1].features, 'ranges');

  describe('with full sticky end formatting', function(){
    beforeEach(function(){
      features = stickyEndedSequence.get('features', {
        stickyEndFormat: 'full'
      });
    });

    it('should not distort any features', function(){
      var coords = _.pluck(features, 'ranges');

      var zippedCoords = _.zip(originalCoords, coords);

      var hasDistortedFeature = _.some(zippedCoords, function(set){
                                  return ((set[0].from != set[1].from) || (set[0].to != set[1].to));
                                });

      expect(hasDistortedFeature).toBe(false);

    });
  });

  describe('with overhang sticky end formatting', function(){
    beforeEach(function(){
      features = stickyEndedSequence.get('features');
    });

    it('should set features beyond the overhang as [0,0]', function(){
      expect(features[0].ranges[0].from).toEqual(0);
      expect(features[0].ranges[0].to).toEqual(0);
    });

    it('should shorten features that extend beyond the beginning of the overhang to start at 0', function(){
      expect(features[1].ranges[0].from).toEqual(0);
    });

    it('should adjust the position of features on the sequence by the leading sticky end offset', function(){
      expect(features[1].ranges[0].to).toEqual(originalCoords[1][0].to - stickyEnds.start.offset);

      expect(features[2].ranges[0].from).toEqual(originalCoords[2][0].from - stickyEnds.start.offset);
      expect(features[2].ranges[0].to).toEqual(originalCoords[2][0].to - stickyEnds.start.offset);

      expect(features[3].ranges[0].from).toEqual(originalCoords[3][0].from - stickyEnds.start.offset);
    });

    it('should shorten features that extend beyond the end of the overhang to end at sequence length', function(){
      var sequenceLength = stickyEndedSequence.getLength();
      expect(features[3].ranges[0].to).toEqual(sequenceLength - 1);
    });


  });

  describe('without sticky ends', function(){
    beforeEach(function(){
      stickyEndedSequence.get('features', {
        stickyEndFormat: 'none'
      });
    });
  });

});

describe('when inserting bases into a sequence', function() {

  describe('without sticky ends', function(){

    beforeEach(function(){
      sequence.insertBases('AAA', 3);
    });

    it('should update the sequence', function() {
      expect(sequence.get('sequence')).toEqual('ATCAAAGATCGATCGATCG');
      expect(sequence.getSubSeq(3, 5)).toEqual('AAA');
      expect(sequence.throttledSave).toHaveBeenCalled();
    });

    it('should move the features', function() {
      var featureRange = sequence.get('features.0.ranges.0');
      expect(featureRange.from).toEqual(6);
      expect(featureRange.to).toEqual(10);
    });
  });

  describe('with sticky ends', function(){

    describe('with full sticky end formatting', function(){

      beforeEach(function(){
        stickyEndedSequence.setStickyEndFormat('full');
        stickyEndedSequence.insertBases('AAA', 3);
      });

      it('should update the sequence', function() {
        expect(stickyEndedSequence.get('sequence')).toEqual('CCTAAAGCAGTCAGTGGTCTCTAGAGATCGATCGATCGATCGGAGATGAGACCGTCAGTCACGAG');
        expect(stickyEndedSequence.getSubSeq(3, 5)).toEqual('AAA');
        expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
      });
    });

    describe('with overhang sticky end formatting', function(){

      beforeEach(function(){
        stickyEndedSequence.insertBases('AAA', 3);
      });

      it('should update the sequence', function() {
        expect(stickyEndedSequence.get('sequence')).toEqual('AGAAAAGATCGATCGATCGATCGGAGA');
        expect(stickyEndedSequence.getSubSeq(3, 5)).toEqual('AAA');
        expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
      });
    });

    describe('with sticky ends removed', function(){

      beforeEach(function(){
        stickyEndedSequence.setStickyEndFormat('none');
        stickyEndedSequence.insertBases('AAA', 3);
      });

      it('should update the sequence', function() {
        expect(stickyEndedSequence.get('sequence')).toEqual('ATCAAAGATCGATCGATCG');
        expect(stickyEndedSequence.getSubSeq(3, 5)).toEqual('AAA');
        expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
      });
    });

  });
});


describe('when deleting bases from a sequence in the middle of a feature', function() {

  beforeEach(function() {
    sequence.deleteBases(2, 2);
  });

  it('should update the sequence', function() {
    expect(sequence.get('sequence')).toEqual('ATATCGATCGATCG');
    expect(sequence.getSubSeq(3, 5)).toEqual('TCG');
    expect(sequence.throttledSave).toHaveBeenCalled();
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
    expect(sequence.throttledSave).toHaveBeenCalled();
  });

  it('should delete the feature', function() {
    var features = sequence.get('features');
    expect(features.length).toEqual(0);
  });
});

describe('when deleting bases from a stickyEnded sequence', function(){


  describe('with full sticky end formatting', function(){
    setStickyEndFormat('full');

    beforeEach(function(){
      stickyEndedSequence.deleteBases(21, 26);
    });

    it('should update the sequence', function(){
      expect(stickyEndedSequence.superGet('sequence')).toEqual('CCTGCAGTCAGTGGTCTCTAGACCGTCAGTCACGAG');
      expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
    });
  });

  describe('with overhang sticky end formatting', function(){
    beforeEach(function(){
      stickyEndedSequence.deleteBases(21, 16);
    });

    it('should update the sequence', function(){
      expect(stickyEndedSequence.superGet('sequence')).toEqual('CCTGCAGTCAGTGGTCTCTAGAGATCGATCGATCGATCGGCACGAG');
      expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
    });
  });

  describe('with none sticky end formatting', function(){
    setStickyEndFormat('none');

    beforeEach(function(){
      stickyEndedSequence.deleteBases(21, 16);
    });

    it('should update the sequence', function(){
      expect(stickyEndedSequence.superGet('sequence')).toEqual('CCTGCAGTCAGTGGTCTCTAGAGATCGATCGATCGATCGGAGATAG');
      expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
    });
  });


});

describe('#selectableRange', function() {
  describe('with overhang sticky end formatting', function() {
    it('should return the boundaries of the sequence without the overhang', function() {
      expect(stickyEndedSequence.selectableRange()).toEqual([0, 19]);
      expect(stickyEndedSequence.selectableRange(true)).toEqual([4, 23]);
    });
  });

  describe('without overhang sticky end formatting', function() {
    setStickyEndFormat();

    it('should return the boundaries of the entire sequence', function() {
      expect(stickyEndedSequence.selectableRange()).toEqual([0, 61]);
    });
  });
});

describe('#editableRange', function() {
  describe('with overhang sticky end formatting', function() {
    it('should return the boundaries of the sequence without the sticky ends', function() {
      expect(stickyEndedSequence.editableRange()).toEqual([4, 19]);
    });
  });

  describe('without overhang sticky end formatting', function() {
    setStickyEndFormat();

    it('should return the boundaries of the entire sequence', function() {
      expect(stickyEndedSequence.selectableRange()).toEqual([0, 61]);
    });
  });
});

describe('#isBaseEditable', function() {
  var baseShouldBeEditable = function(editable, strict, base) {
    // console.log('isBaseEditable', base, stickyEndedSequence.isBaseEditable(base))
    expect(stickyEndedSequence.isBaseEditable(base, strict)).toEqual(editable);
  };

  var shouldWork = function(editableBases, nonEditableBases = [], strict = false) {
    it('should return true for editable bases', function() {
      editableBases.forEach(_.partial(baseShouldBeEditable, true, strict));
    });

    it('should return false for non editable bases', function() {
      nonEditableBases.forEach(_.partial(baseShouldBeEditable, false, strict));
    });
  };

  describe('in strict mode', function() {
    describe('with overhang sticky end formatting', function() {
      setStickyEndFormat('overhang');
      shouldWork([4, 10, 12, 19], [0, 2, 20, 21, 40], true);
    });

    describe('with full sticky end formatting', function() {
      setStickyEndFormat('full');
      shouldWork([19, 20, 27, 38].concat([0, 3, 49, 39]), [], true);
    });
  });

  describe('in non-strict mode', function() {
    describe('with overhang sticky end formatting', function() {
      setStickyEndFormat('overhang');
      shouldWork([4, 10, 12, 19, 20], [0, 2, 21, 40], false);
    });

    describe('with full sticky end formatting', function() {
      setStickyEndFormat('full');
      shouldWork([19, 20, 27, 38, 39].concat([0, 3, 49]), [], false);
    });
  });
});

describe('#isRangeEditable', function() {
  var rangeShouldBeEditable = function(editable, range) {
    expect(stickyEndedSequence.isRangeEditable(...range)).toEqual(editable);
  };

  var shouldWork = function(editableRanges, nonEditableRanges = []) {
    it('should return true for editable ranges', function() {
      editableRanges.forEach(_.partial(rangeShouldBeEditable, true));
    });

    it('should return false for non editable ranges', function() {
      nonEditableRanges.forEach(_.partial(rangeShouldBeEditable, false));
    });
  };

  describe('with overhang sticky end formatting', function() {
    var nonEditableRanges = [
      [0, 3],
      [2, 6],
      [17, 24],
      [4, 20],
    ];

    var editableRanges = [
      [4, 19],
      [7, 15]
    ];
    setStickyEndFormat('overhang');
    shouldWork(editableRanges, nonEditableRanges);
  });

  describe('with full sticky end formatting', function() {
    var nonEditableRanges = [
      [0, 3],
      [2, 6],
      [17, 24],
      [4, 20],
    ];

    var editableRanges = [
      [4, 19],
      [7, 15]
    ];
    setStickyEndFormat('full');
    shouldWork(editableRanges.concat(nonEditableRanges), []);
  });
});

