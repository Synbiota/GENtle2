import _ from 'underscore';


var testAllSequenceModels = function(SequenceModel) {
  describe('all sequence models', function() {
    var sequence1;
    var sequence2;
    var sequence3;

    beforeEach(function() {
      if(sequence1) return;
      sequence1 = new SequenceModel({
        sequence: 'CCCCCCCCCCCGGTACC',
        id: 1,
        stickyEnds: {
          // Leave a TA sticky end
          end: {
            reverse: false,
            offset: 2,
            size: 2,
          }
        },
        features: [{
          name: 'Sequence1Annotation',
          _type: 'sequence',
          ranges: [{
            from: 3,
            to: 8,
          }]
        },
        {
          name: 'Sequence1EndAnnotation',
          _type: 'sequence',
          ranges: [{
            from: 11, // let's say the GGTT is the RE site
            to: 14,
          }]
        }]
      });

      sequence2 = new SequenceModel({
        sequence: 'CCTACCCCCCCCCCC',
        id: 2,
        stickyEnds: {
          // Leave a AT sticky end
          start: {
            reverse: true,
            offset: 2,
            size: 2,
          }
        },
        features: [
        {
          name: 'Sequence2AnnotationShouldStay',
          _type: 'sequence',
          ranges: [{
            from: 2,
            to: 2,
          }]
        },
        {
          name: 'Sequence2AnnotationShouldBeRemoved',
          _type: 'sequence',
          ranges: [{
            from: 1,
            to: 2, // let's say the CCTT is the RE site
          }]
        }
        ]
      });

      sequence3 = new SequenceModel({
        sequence: 'GGGTACCGGGGGGGGGTAGG',
        id: 3,
        stickyEnds: {
          // Leave a AT sticky end
          start: {
            reverse: true,
            offset: 3,
            size: 2,
          },
          // Leave a TA sticky end
          end: {
            reverse: false,
            offset: 2,
            size: 2,
          }
        },
        features: [{
          name: 'Sequence3Annotation',
          _type: 'sequence',
          ranges: [{
            from: 17,
            to: 17,
          }]
        },
        {
          name: 'Sequence3AnnotationShouldBeRemoved',
          _type: 'sequence',
          ranges: [{
            from: 17,
            to: 18,
          }]
        },
        {
          name: 'Sequence3AnnotationShouldAlsoBeRemoved',
          _type: 'sequence',
          ranges: [{
            from: 18,
            to: 17,
          }]
        }]
      });

    }); //-beforeEach
    
    describe('sticky end functions', function() {
      it('isBeyondEndStickyEnd', function() {
        expect(sequence1.isBeyondEndStickyEnd(15)).toEqual(true);
        expect(sequence1.isBeyondEndStickyEnd(14, true)).toEqual(true);
        expect(sequence1.isBeyondEndStickyEnd(14)).toEqual(false);
        expect(sequence1.isBeyondEndStickyEnd(14, false)).toEqual(false);
      });

      it('isBeyondEndStickyEndOnBothStrands', function() {
        expect(sequence1.isBeyondEndStickyEndOnBothStrands(15)).toEqual(true);
        expect(sequence1.isBeyondEndStickyEndOnBothStrands(14)).toEqual(false);        
      });

      it('isBeyondStartStickyEnd', function() {
        expect(sequence2.isBeyondStartStickyEnd(1)).toEqual(true);
        expect(sequence2.isBeyondStartStickyEnd(2, true)).toEqual(false);
        expect(sequence2.isBeyondStartStickyEnd(2)).toEqual(true);
        expect(sequence2.isBeyondStartStickyEnd(2, false)).toEqual(true);
      });

      it('isBeyondStartStickyEndOnBothStrands', function() {
        expect(sequence2.isBeyondStartStickyEndOnBothStrands(1)).toEqual(true);
        expect(sequence2.isBeyondStartStickyEndOnBothStrands(2)).toEqual(false);
      });

      it('getStartStickyEndSequence', function() {
        expect(sequence1.getStartStickyEndSequence().sequence).toEqual('');
        expect(sequence1.getStartStickyEndSequence().isOnReverseStrand).toEqual(undefined);
        expect(sequence2.getStartStickyEndSequence().sequence).toEqual('AT');
        expect(sequence2.getStartStickyEndSequence().isOnReverseStrand).toEqual(true);
      });

      it('getEndStickyEndSequence', function() {
        expect(sequence1.getEndStickyEndSequence().sequence).toEqual('TA');
        expect(sequence1.getEndStickyEndSequence().isOnReverseStrand).toEqual(false);
        expect(sequence2.getEndStickyEndSequence().sequence).toEqual('');
        expect(sequence2.getEndStickyEndSequence().isOnReverseStrand).toEqual(undefined);
      });

      it('stickyEndConnects', function() {
        expect(sequence1.stickyEndConnects(sequence2)).toEqual(true);
        expect(sequence2.stickyEndConnects(sequence1)).toEqual(false);
      });
    }); //-describe('sticky end functions')

    describe('concatenateSequences', function() {
      it('concatenates sequence1, sequence2', function() {
        var concatenatedSequence = SequenceModel.concatenateSequences([sequence1, sequence2], false, false);
        expect(concatenatedSequence.get('sequence')).toEqual('CCCCCCCCCCCGGTA' + 'CCCCCCCCCCC');
        var features = concatenatedSequence.get('features');
        expect(features.length).toEqual(3);
        expect(features[0].name).toEqual('Sequence1Annotation');
        expect(features[0].ranges[0].from).toEqual(3);
        expect(features[0].ranges[0].to).toEqual(8);
        expect(features[1].name).toEqual('Sequence1EndAnnotation');
        expect(features[1].ranges[0].from).toEqual(11);
        expect(features[1].ranges[0].to).toEqual(14);
        expect(features[2].name).toEqual('Sequence2AnnotationShouldStay');
        expect(features[2].ranges[0].from).toEqual(13);
        expect(features[2].ranges[0].to).toEqual(13);
      });

      it('concatenates sequence1, sequence3, sequence2', function() {
        var concatenatedSequence = SequenceModel.concatenateSequences([sequence1, sequence3, sequence2], false, false);
        expect(concatenatedSequence.get('sequence')).toEqual('CCCCCCCCCCCGGTA' + 'CCGGGGGGGGGTA' + 'CCCCCCCCCCC');
        var features = concatenatedSequence.get('features');
        expect(features.length).toEqual(4);
        expect(features[0].name).toEqual('Sequence1Annotation');
        expect(features[0].ranges[0].from).toEqual(3);
        expect(features[0].ranges[0].to).toEqual(8);
        expect(features[1].name).toEqual('Sequence1EndAnnotation');
        expect(features[1].ranges[0].from).toEqual(11);
        expect(features[1].ranges[0].to).toEqual(14);
        expect(features[2].name).toEqual('Sequence2AnnotationShouldStay');
        expect(features[2].ranges[0].from).toEqual(26);
        expect(features[2].ranges[0].to).toEqual(26);
        expect(features[3].name).toEqual('Sequence3Annotation');
        expect(features[3].ranges[0].from).toEqual(27);
        expect(features[3].ranges[0].to).toEqual(27);
      });
      
      it('concatenates (and truncates features) sequence1, sequence3, sequence2', function() {
        var concatenatedSequence = SequenceModel.concatenateSequences([sequence1, sequence3, sequence2], false, true);
        expect(concatenatedSequence.get('sequence')).toEqual('CCCCCCCCCCCGGTA' + 'CCGGGGGGGGGTA' + 'CCCCCCCCCCC');
        var features = concatenatedSequence.get('features');
        expect(features.length).toEqual(7);
        expect(features[0].name).toEqual('Sequence1Annotation');
        expect(features[0].ranges[0].from).toEqual(3);
        expect(features[0].ranges[0].to).toEqual(8);
        expect(features[1].name).toEqual('Sequence1EndAnnotation');
        expect(features[1].ranges[0].from).toEqual(11);
        expect(features[1].ranges[0].to).toEqual(14);
        expect(features[2].name).toEqual('Sequence2AnnotationShouldBeRemoved');
        expect(features[2].ranges[0].from).toEqual(26);
        expect(features[2].ranges[0].to).toEqual(26);
        expect(features[3].name).toEqual('Sequence2AnnotationShouldStay');
        expect(features[3].ranges[0].from).toEqual(26);
        expect(features[3].ranges[0].to).toEqual(26);
        expect(features[4].name).toEqual('Sequence3Annotation');
        expect(features[4].ranges[0].from).toEqual(27);
        expect(features[4].ranges[0].to).toEqual(27);
        expect(features[5].name).toEqual('Sequence3AnnotationShouldBeRemoved');
        expect(features[5].ranges[0].from).toEqual(27);
        expect(features[5].ranges[0].to).toEqual(27);
        expect(features[6].name).toEqual('Sequence3AnnotationShouldAlsoBeRemoved');
        expect(features[6].ranges[0].from).toEqual(27);
        expect(features[6].ranges[0].to).toEqual(27);
      });
      
      it('concatenates (and circularises) sequence1, sequence3, sequence2', function() {
        var concatenatedSequence = SequenceModel.concatenateSequences([sequence3, sequence3], true, false);
        expect(concatenatedSequence.get('sequence')).toEqual('CCGGGGGGGGGTA' + 'CCGGGGGGGGGTA');
        expect(_.isEmpty(concatenatedSequence.get('stickyEnds')));
        var features = concatenatedSequence.get('features');
        expect(features.length).toEqual(2);
        expect(features[0].name).toEqual('Sequence3Annotation');
        expect(features[0].ranges[0].from).toEqual(12);
        expect(features[0].ranges[0].to).toEqual(12);
        expect(features[1].name).toEqual('Sequence3Annotation');
        expect(features[1].ranges[0].from).toEqual(25);
        expect(features[1].ranges[0].to).toEqual(25);
      });

      it('errors concatenating incompatible sequences', function() {
        var error;
        try {
          SequenceModel.concatenateSequences([sequence1, sequence2, sequence2], false);
        } catch (e) {
          error = e;
        }
        expect(error).toEqual('Can not concatenate sequences 2 and 2 as they have incompatible sticky ends: `` and `AT`');
      });

      it('errors concatenating and circularising incompatible sequences', function() {
        var error;
        try {
          SequenceModel.concatenateSequences([sequence1, sequence2], true);
        } catch (e) {
          error = e;
        }
        expect(error).toEqual('Can not concatenate sequences 2 and 1 as they have incompatible sticky ends: `` and ``');
      });

    }); //-describe('concatenateSequences')
    
    describe('featuresInRange', function() {
      it('finds correct number of features', function() {
        var features;
        features = sequence3.featuresInRange(0, 1);
        expect(features.length).toEqual(0);
        features = sequence3.featuresInRange(13, 19);
        expect(features.length).toEqual(3);
        features = sequence3.featuresInRange(18, 18);
        expect(features.length).toEqual(2);
      });
    });

  });
};


export default testAllSequenceModels;
