import Sequence from '../models/sequence';
import {stubCurrentUser} from '../../common/tests/stubs';
import _ from 'underscore.mixed'


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

beforeEach(function() {
  stubCurrentUser();
  sequence = new Sequence(fixtures[0]);
  stickyEndedSequence = new Sequence(fixtures[1]);

  spyOn(sequence, 'save'); // Disable save function
  spyOn(stickyEndedSequence, 'save');
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
        stickyEndedSequence.set('displaySettings.stickyEndFormat', 'full');
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
        stickyEndedSequence.set('displaySettings.stickyEndFormat', 'none');
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
      var sequenceLength = stickyEndedSequence.length();
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
      expect(sequence.save).toHaveBeenCalled();
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
        expect(stickyEndedSequence.get('sequence')).toEqual('CCTAAAGCAGTCAGTGGTCTCTAGAGATCGATCGATCGATCGGAGATGAGACCGTCAGTCACGAG');
        expect(stickyEndedSequence.getSubSeq(3, 5)).toEqual('AAA');
        expect(stickyEndedSequence.save).toHaveBeenCalled();
      });
    });

    describe('with overhang sticky end formatting', function(){

      beforeEach(function(){
        stickyEndedSequence.insertBases('AAA', 3);
      });

      it('should update the sequence', function() {
        expect(stickyEndedSequence.get('sequence')).toEqual('AGAAAAGATCGATCGATCGATCGGAGA');
        expect(stickyEndedSequence.getSubSeq(3, 5)).toEqual('AAA');
        expect(stickyEndedSequence.save).toHaveBeenCalled();
      });
    });

    describe('with sticky ends removed', function(){

      beforeEach(function(){
        stickyEndedSequence.set('displaySettings.stickyEndFormat', 'none');
        stickyEndedSequence.insertBases('AAA', 3);
      });

      it('should update the sequence', function() {
        expect(stickyEndedSequence.get('sequence')).toEqual('ATCAAAGATCGATCGATCG');
        expect(stickyEndedSequence.getSubSeq(3, 5)).toEqual('AAA');
        expect(stickyEndedSequence.save).toHaveBeenCalled();
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

describe('when deleting bases from a stickyEnded sequence', function(){


  describe('with full sticky end formatting', function(){
    beforeEach(function(){
      stickyEndedSequence.set('displaySettings.stickyEndFormat', 'full');
      stickyEndedSequence.deleteBases(21, 26);
    });

    it('should update the sequence', function(){
      expect(stickyEndedSequence.trueGet('sequence')).toEqual('CCTGCAGTCAGTGGTCTCTAGACCGTCAGTCACGAG');
      expect(stickyEndedSequence.save).toHaveBeenCalled();
    });
  });

  describe('with overhang sticky end formatting', function(){
    beforeEach(function(){
      stickyEndedSequence.deleteBases(21, 16);
    });

    it('should update the sequence', function(){
      expect(stickyEndedSequence.trueGet('sequence')).toEqual('CCTGCAGTCAGTGGTCTCTAGAGATCGATCGATCGATCGGCACGAG');
      expect(stickyEndedSequence.save).toHaveBeenCalled();
    });
  });

  describe('with none sticky end formatting', function(){
    beforeEach(function(){
      stickyEndedSequence.set('displaySettings.stickyEndFormat', 'none');
      stickyEndedSequence.deleteBases(21, 16);
    });

    it('should update the sequence', function(){
      expect(stickyEndedSequence.trueGet('sequence')).toEqual('CCTGCAGTCAGTGGTCTCTAGAGATCGATCGATCGATCGGAGATAG');
      expect(stickyEndedSequence.save).toHaveBeenCalled();
    });
  });


});
