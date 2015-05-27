import Sequence from '../models/sequence';
import {stubCurrentUser} from '../../common/tests/stubs';
import _ from 'underscore.mixed';


var initialSequenceContent = 'ATCGATCGATCGATCG';
var stickyEnds = {
  start: {
    sequence: 'CCTGCAGTCAGTGGTCTCT' + 'AGAG',
    reverse: false,
    offset: 19,
    size: 4,
    name: "X",
  },
  end: {
    sequence: 'GAGA' + 'TGAGACCGTCAGTCACGAG',
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
},
{
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
},
{
  name: 'Empty Sticky Ended Sequence',
  sequence: stickyEnds.start.sequence + stickyEnds.end.sequence,
  features: [],
  stickyEnds: stickyEnds
},
{
  name: 'Empty Sequence',
  sequence: '',
  features: []
}
];


var sequence, stickyEndedSequence, stickyEndedEmptySequence, emptySequence;

var setStickyEndFormat = function(format) {
  beforeEach(function() {
    stickyEndedSequence.set('displaySettings.stickyEndFormat', format);  
  });
};

beforeEach(function() {
  stubCurrentUser();
  sequence = new Sequence(fixtures[0]);
  stickyEndedSequence = new Sequence(fixtures[1]);
  stickyEndedEmptySequence = new Sequence(fixtures[2]);
  emptySequence = new Sequence(fixtures[3]);

  // Disable save function
  spyOn(sequence, 'save');
  spyOn(sequence, 'throttledSave');
  spyOn(stickyEndedSequence, 'save');
  spyOn(stickyEndedSequence, 'throttledSave');
  spyOn(stickyEndedEmptySequence, 'save');
  spyOn(stickyEndedEmptySequence, 'throttledSave');
  spyOn(emptySequence, 'save');
  spyOn(emptySequence, 'throttledSave');
});


describe('creating and reading a sequence', function() {

  it('should be able to get the name', function() {
    expect(sequence.get('name')).toEqual('Test sequence');
  });

  describe('without sticky ends', function(){
    it('should be able to get the sequence', function() {
      expect(sequence.getSequence()).toEqual(initialSequenceContent);
    });

    it('should be able to get a subsequence', function() {
      expect(sequence.getSubSeq(2,5)).toEqual('CGAT');
    });
  });

  describe('with sticky ends', function() {

    describe('with full sticky end formatting', function(){
      beforeEach(function() {
        stickyEndedSequence.set('displaySettings.stickyEndFormat', 'full');
      });

      it('should be able to get the sequence', function() {
        expect(stickyEndedSequence.getSequence()).toEqual(stickyEndedSequenceContent);
      });

      it('should be able to get a subsequence', function() {
        expect(stickyEndedSequence.getSubSeq(2,5)).toEqual('TGCA');
      });
    });

    describe('with overhang sticky end formatting', function(){
      it('should be able to get the sequence', function() {
        expect(stickyEndedSequence.getSequence()).toEqual(stickyEndedSequenceContentWithOverhang);
      });

      it('should be able to get a subsequence', function() {
        expect(stickyEndedSequence.getSubSeq(2,5)).toEqual('AGAT');
      });
    });

    describe('with sticky ends removed', function(){
      beforeEach(function() {
        stickyEndedSequence.set('displaySettings.stickyEndFormat', 'none');
      });

      it('should be able to get the sequence', function() {
        expect(stickyEndedSequence.getSequence()).toEqual(initialSequenceContent);
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
      features = stickyEndedSequence.getFeatures();
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
      features = stickyEndedSequence.getFeatures();
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
      expect(sequence.getSequence()).toEqual('ATCAAAGATCGATCGATCG');
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
        stickyEndedSequence.set('displaySettings.stickyEndFormat', 'full');
        stickyEndedSequence.insertBases('AAA', 3);
      });

      it('should update the sequence', function() {
        expect(stickyEndedSequence.getSequence()).toEqual('CCTAAAGCAGTCAGTGGTCTCTAGAGATCGATCGATCGATCGGAGATGAGACCGTCAGTCACGAG');
        expect(stickyEndedSequence.getSubSeq(3, 5)).toEqual('AAA');
        expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
      });
    });

    describe('with overhang sticky end formatting', function(){

      beforeEach(function(){
        stickyEndedSequence.insertBases('AAA', 3);
      });

      it('should update the sequence', function() {
        expect(stickyEndedSequence.getSequence()).toEqual('AGAAAAGATCGATCGATCGATCGGAGA');
        expect(stickyEndedSequence.getSubSeq(3, 5)).toEqual('AAA');
        expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
      });
    });

    describe('with sticky ends removed', function(){

      beforeEach(function(){
        stickyEndedSequence.set('displaySettings.stickyEndFormat', 'none');
        stickyEndedSequence.insertBases('AAA', 3);
      });

      it('should update the sequence', function() {
        expect(stickyEndedSequence.getSequence()).toEqual('ATCAAAGATCGATCGATCG');
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
    expect(sequence.getSequence()).toEqual('ATATCGATCGATCG');
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
    expect(sequence.getSequence()).toEqual('ATATCGATCG');
    expect(sequence.getSubSeq(3, 5)).toEqual('TCG');
    expect(sequence.throttledSave).toHaveBeenCalled();
  });

  it('should delete the feature', function() {
    var features = sequence.getFeatures();
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
      expect(stickyEndedSequence.trueGet('sequence')).toEqual('CCTGCAGTCAGTGGTCTCTAGACCGTCAGTCACGAG');
      expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
    });
  });

  describe('with overhang sticky end formatting', function(){
    beforeEach(function(){
      stickyEndedSequence.deleteBases(21, 16);
    });

    it('should update the sequence', function(){
      expect(stickyEndedSequence.trueGet('sequence')).toEqual('CCTGCAGTCAGTGGTCTCTAGAGATCGATCGATCGATCGGCACGAG');
      expect(stickyEndedSequence.throttledSave).toHaveBeenCalled();
    });
  });

  describe('with none sticky end formatting', function(){
    setStickyEndFormat('none');

    beforeEach(function(){
      stickyEndedSequence.deleteBases(21, 16);
    });

    it('should update the sequence', function(){
      expect(stickyEndedSequence.trueGet('sequence')).toEqual('CCTGCAGTCAGTGGTCTCTAGAGATCGATCGATCGATCGGAGATAG');
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
      var range = stickyEndedSequence.editableRange();
      expect(range.from).toEqual(4);
      // NOTE: remember range.to is exclusive so 21 is *not* included in range
      expect(range.to).toEqual(21);
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
  var basesShouldBeEditable = function(editableBases, strict) {
    editableBases.forEach(function(baseNumber) {
      it('should return true for editable base number ' + baseNumber, function() {
        expect(stickyEndedSequence.isBaseEditable(baseNumber, strict)).toEqual(true);
      });
    });
  };

  var basesShouldNotBeEditable = function(nonEditableBases, strict) {
    nonEditableBases.forEach(function(baseNumber) {
      it('should return false for editable base number ' + baseNumber, function() {
        expect(stickyEndedSequence.isBaseEditable(baseNumber, strict)).toEqual(false);
      });
    });
  };

  describe('in strict mode', function() {
    var strict = true;
    describe('with overhang sticky end formatting', function() {
      setStickyEndFormat('overhang');
      basesShouldBeEditable([4, 19], strict);
      basesShouldNotBeEditable([3, 20], strict);
    });

    describe('with full sticky end formatting', function() {
      setStickyEndFormat('full');
      basesShouldBeEditable([0, 61], strict);
      basesShouldNotBeEditable([-1, 62], strict);
    });
  });

  describe('in non-strict mode', function() {
    var strict = false;
    describe('with overhang sticky end formatting', function() {
      setStickyEndFormat('overhang');
      basesShouldBeEditable([4, 20], strict);
      basesShouldNotBeEditable([3, 21], strict);
    });

    describe('with full sticky end formatting', function() {
      setStickyEndFormat('full');
      basesShouldBeEditable([0, 62], strict);
      basesShouldNotBeEditable([-1, 63], strict);
    });
  });
});


describe('#ensureBaseIsEditable', function() {
  describe('with overhang sticky end formatting', function() {
    setStickyEndFormat('overhang');

    describe('and without being strict', function() {
      it('should correct uneditable bases', function() {
        expect(stickyEndedSequence.ensureBaseIsEditable(4)).toEqual(4);
        expect(stickyEndedSequence.ensureBaseIsEditable(3)).toEqual(4);
        expect(stickyEndedSequence.ensureBaseIsEditable(20)).toEqual(20);
        expect(stickyEndedSequence.ensureBaseIsEditable(21)).toEqual(20);
      });
    });

    describe('and with being strict', function() {
      it('should correct uneditable bases', function() {
        expect(stickyEndedSequence.ensureBaseIsEditable(4, true)).toEqual(4);
        expect(stickyEndedSequence.ensureBaseIsEditable(3, true)).toEqual(4);
        expect(stickyEndedSequence.ensureBaseIsEditable(19, true)).toEqual(19);
        expect(stickyEndedSequence.ensureBaseIsEditable(20, true)).toEqual(19);
      });
    });
  });

  describe('with overhang sticky end formatting and no sequence length', function() {
    setStickyEndFormat('overhang');

    describe('and without being strict', function() {
      it('should correct uneditable bases', function() {
        expect(stickyEndedEmptySequence.ensureBaseIsEditable(4)).toEqual(4);
        expect(stickyEndedEmptySequence.ensureBaseIsEditable(3)).toEqual(4);
        expect(stickyEndedEmptySequence.ensureBaseIsEditable(5)).toEqual(4);
      });
    });

    describe('and with being strict', function() {
      it('should correct uneditable bases', function() {
        expect(stickyEndedEmptySequence.ensureBaseIsEditable(4, true)).toEqual(4);
        expect(stickyEndedEmptySequence.ensureBaseIsEditable(3, true)).toEqual(4);
        expect(stickyEndedEmptySequence.ensureBaseIsEditable(5, true)).toEqual(4);
      });
    });
  });

  describe('with an empty sequence', function() {
    setStickyEndFormat('overhang');

    describe('and without being strict', function() {
      it('should correct uneditable bases', function() {
        expect(emptySequence.ensureBaseIsEditable(0)).toEqual(0);
        expect(emptySequence.ensureBaseIsEditable(-1)).toEqual(0);
        expect(emptySequence.ensureBaseIsEditable(1)).toEqual(0);
      });
    });

    describe('and with being strict', function() {
      it('should correct uneditable bases', function() {
        expect(emptySequence.ensureBaseIsEditable(0, true)).toEqual(0);
        expect(emptySequence.ensureBaseIsEditable(-1, true)).toEqual(0);
        expect(emptySequence.ensureBaseIsEditable(1, true)).toEqual(0);
      });
    });
  });
});


describe('#isRangeEditable', function() {
  var shouldWork = function(editableRanges, nonEditableRanges) {
    editableRanges.forEach(function(range) {
      it('should return true for editable range ' + JSON.stringify(range), function() {
        expect(stickyEndedSequence.isRangeEditable(...range)).toEqual(true);
      });
    });

    nonEditableRanges.forEach(function(range) {
      it('should return false for non editable range ' + JSON.stringify(range), function() {
        expect(stickyEndedSequence.isRangeEditable(...range)).toEqual(false);
      });
    });
  };

  var nonEditableRanges = [
    [3, 6],
    [18, 21],
  ];

  var editableRanges = [
    [4, 6],
    [18, 20]
  ];

  describe('with overhang sticky end formatting', function() {
    setStickyEndFormat('overhang');
    shouldWork(editableRanges, nonEditableRanges);
  });

  describe('with full sticky end formatting', function() {
    setStickyEndFormat('full');
    shouldWork(editableRanges.concat(nonEditableRanges), []);
  });
});

