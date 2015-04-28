import _ from 'underscore';


var testAllSequenceModels = function(SequenceModel) {
  // N.B. SequenceModel.className is manually set on backbone models
  var className = SequenceModel.className || SequenceModel.name;
  describe(className + ' all sequence models', function() {
    var sequence1, _sequence1;
    var sequence2, _sequence2;
    var sequence3, _sequence3;

    beforeEach(function() {
      if(sequence1) return;
      _sequence1 = new SequenceModel({
        sequence: 'CCCCCCCCCCCGGTACC',
        id: 1,
        from: 0,
        to: 16,
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

      _sequence2 = new SequenceModel({
        sequence: 'CCTACCCCCCCCCCC',
        id: 2,
        from: 0,
        to: 14,
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

      _sequence3 = new SequenceModel({
        sequence: 'GGGTACCGGGGGGGGGTAGG',
        id: 3,
        from: 0,
        to: 19,
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

      // Disable save function
      if(_sequence1.save) spyOn(_sequence1, 'save');
      if(_sequence2.save) spyOn(_sequence2, 'save');
      if(_sequence3.save) spyOn(_sequence3, 'save');

      sequence1 = _sequence1.getBaseSequenceModel();
      sequence2 = _sequence2.getBaseSequenceModel();
      sequence3 = _sequence3.getBaseSequenceModel();
    }); //-beforeEach

    describe('basic validation', function() {
      it('should require a sequence', function() {
        var error;
        try {
          new SequenceModel();
        } catch (e) {
          error = e.toString();
        }
        expect(error).toEqual('Error: Field `sequence` is absent');
      });
    });

    describe('basic behaviour', function() {
      var sequence;
      var bases = 'ATCGGGCTTAAGCGTA';
      it('should instantiate', function() {
        sequence = new SequenceModel({
          name: 'Test Sequence',
          sequence: bases
        }).getBaseSequenceModel();
        expect(sequence).toBeTruthy();
      });

      it('should be able to get the name', function() {
        expect(sequence.name).toEqual('Test Sequence');
      });

      it('should be able to get the sequence', function() {
        expect(sequence.sequence).toEqual(bases);
      });

      it('should be able to get a subsequence', function() {
        expect(sequence.getSubSeq(2,5)).toEqual('CGGG');
      });
    });

    describe('getting transformed and subsequences', function() {
      var sequence;
      var bases = 'ATCGGGCTTAAGCGTA';
      it('should instantiate', function() {
        sequence = new SequenceModel({
          name: 'Test Sequence',
          sequence: bases
        }).getBaseSequenceModel();
        expect(sequence).toBeTruthy();
      });

      it('should be able to get a padded subsequence', function() {
        var result = sequence.getPaddedSubSeq(3, 8, 3);
        expect(result.subSeq).toEqual(bases.substr(3, 6));
        expect(result.startBase).toEqual(3);
        expect(result.endBase).toEqual(8);

        result = sequence.getPaddedSubSeq(2, 8, 3);
        expect(result.subSeq).toEqual(bases.substr(0, 9));
        expect(result.startBase).toEqual(0);
        expect(result.endBase).toEqual(8);

        result = sequence.getPaddedSubSeq(2, 8, 3, 5);
        expect(result.subSeq).toEqual(bases.substr(2, 9));
        expect(result.startBase).toEqual(2);
        expect(result.endBase).toEqual(10);

        result = sequence.getPaddedSubSeq(2, 8, 3, -5);
        expect(result.subSeq).toEqual(bases.substr(1, 9));
        expect(result.startBase).toEqual(1);
        expect(result.endBase).toEqual(9);
      });

      it('should be able get a transformed subsequence', function() {
        var transformedSubSequence, error;
        try {
          transformedSubSequence = sequence.getTransformedSubSeq('WRonG', {}, 3, 8);
        } catch (e) {
          error = e.toString();
        }
        expect(error).toEqual("Error: Unsupported sequence transform 'WRonG'");

        transformedSubSequence = sequence.getTransformedSubSeq('aa-long', {}, 8, 3);
        expect(transformedSubSequence).toEqual('');

        transformedSubSequence = sequence.getTransformedSubSeq('aa-long', {}, 3, 8);
        expect(transformedSubSequence).toEqual('GlyLeu');

        transformedSubSequence = sequence.getTransformedSubSeq('aa-short', {}, 3, 8);
        expect(transformedSubSequence).toEqual('G  L  ');

        transformedSubSequence = sequence.getTransformedSubSeq('aa-short', {offset: 2}, 3, 8);
        expect(transformedSubSequence).toEqual('  A  X');

        transformedSubSequence = sequence.getTransformedSubSeq('aa-short', {complements: true}, 3, 8);
        expect(transformedSubSequence).toEqual('P  E  ');
      });

      it('should be able get a codon', function() {
        var codon, error;
        try {
          codon = sequence.getCodon(-1);
        } catch (e) {
          error = e.toString();
        }
        expect(error).toEqual("Error: 'base' must be >= 0 but was '-1'");

        codon = sequence.getCodon(0);
        expect(codon.sequence).toEqual(bases.substr(0, 3));
        expect(codon.position).toEqual(0);

        codon = sequence.getCodon(1);
        expect(codon.sequence).toEqual(bases.substr(0, 3));
        expect(codon.position).toEqual(1);

        codon = sequence.getCodon(2);
        expect(codon.sequence).toEqual(bases.substr(0, 3));
        expect(codon.position).toEqual(2);

        codon = sequence.getCodon(3);
        expect(codon.sequence).toEqual(bases.substr(3, 3));
        expect(codon.position).toEqual(0);

        codon = sequence.getCodon(3, 2);
        expect(codon.sequence).toEqual(bases.substr(2, 3));
        expect(codon.position).toEqual(1);

        codon = sequence.getCodon(3, 4);
        expect(codon.sequence).toEqual(bases[3]);
        expect(codon.position).toEqual(1);

        codon = sequence.getCodon(3, -4);
        expect(codon.sequence).toEqual(bases.substr(2, 3));
        expect(codon.position).toEqual(1);
      });

      it('should be able get an amino acid', function() {
        var aminoAcid = sequence.getAA('long', 0);
        expect(aminoAcid.sequence).toEqual('Ile');
        expect(aminoAcid.position).toEqual(0);

        aminoAcid = sequence.getAA('short', 0);
        expect(aminoAcid.sequence).toEqual('I  ');
        expect(aminoAcid.position).toEqual(0);

        aminoAcid = sequence.getAA('short', 1);
        expect(aminoAcid.sequence).toEqual('I  ');
        expect(aminoAcid.position).toEqual(1);

        aminoAcid = sequence.getAA('short', 2);
        expect(aminoAcid.sequence).toEqual('I  ');
        expect(aminoAcid.position).toEqual(2);

        aminoAcid = sequence.getAA('short', 3);
        expect(aminoAcid.sequence).toEqual('G  ');
        expect(aminoAcid.position).toEqual(0);

        aminoAcid = sequence.getAA('short', 3, 2);
        expect(aminoAcid.sequence).toEqual('R  ');
        expect(aminoAcid.position).toEqual(1);

        aminoAcid = sequence.getAA('short', 3, -4);
        expect(aminoAcid.sequence).toEqual('R  ');
        expect(aminoAcid.position).toEqual(1);
      });
    });

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
        expect(sequence1.getStartStickyEndSequence().sequenceBases).toEqual('');
        expect(sequence1.getStartStickyEndSequence().isOnReverseStrand).toEqual(undefined);
        expect(sequence2.getStartStickyEndSequence().sequenceBases).toEqual('AT');
        expect(sequence2.getStartStickyEndSequence().isOnReverseStrand).toEqual(true);
      });

      it('getEndStickyEndSequence', function() {
        expect(sequence1.getEndStickyEndSequence().sequenceBases).toEqual('TA');
        expect(sequence1.getEndStickyEndSequence().isOnReverseStrand).toEqual(false);
        expect(sequence2.getEndStickyEndSequence().sequenceBases).toEqual('');
        expect(sequence2.getEndStickyEndSequence().isOnReverseStrand).toEqual(undefined);
      });

      it('stickyEndConnects', function() {
        expect(sequence1.stickyEndConnects(sequence2)).toEqual(true);
        expect(sequence2.stickyEndConnects(sequence1)).toEqual(false);
      });
    }); //-describe('sticky end functions')

    describe('concatenateSequences', function() {
      it('concatenates sequence1, sequence2', function() {
        var concatenatedSequence = SequenceModel.concatenateSequences([sequence1, sequence2], false, false).getBaseSequenceModel();
        expect(concatenatedSequence.sequence).toEqual('CCCCCCCCCCCGGTA' + 'CCCCCCCCCCC');
        var features = concatenatedSequence.features;
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
        var concatenatedSequence = SequenceModel.concatenateSequences([sequence1, sequence3, sequence2], false, false).getBaseSequenceModel();
        expect(concatenatedSequence.sequence).toEqual('CCCCCCCCCCCGGTA' + 'CCGGGGGGGGGTA' + 'CCCCCCCCCCC');
        var features = concatenatedSequence.features;
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
        var concatenatedSequence = SequenceModel.concatenateSequences([sequence1, sequence3, sequence2], false, true).getBaseSequenceModel();
        expect(concatenatedSequence.sequence).toEqual('CCCCCCCCCCCGGTA' + 'CCGGGGGGGGGTA' + 'CCCCCCCCCCC');
        var features = concatenatedSequence.features;
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
        var concatenatedSequence = SequenceModel.concatenateSequences([sequence3, sequence3], true, false).getBaseSequenceModel();
        expect(concatenatedSequence.sequence).toEqual('CCGGGGGGGGGTA' + 'CCGGGGGGGGGTA');
        expect(_.isEmpty(concatenatedSequence.stickyEnds));
        var features = concatenatedSequence.features;
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
          SequenceModel.concatenateSequences([sequence1, sequence2, sequence2], false).getBaseSequenceModel();
        } catch (e) {
          error = e;
        }
        expect(error).toEqual('Can not concatenate sequences 2 and 2 as they have incompatible sticky ends: `` and `AT`');
      });

      it('errors concatenating and circularising incompatible sequences', function() {
        var error;
        try {
          SequenceModel.concatenateSequences([sequence1, sequence2], true).getBaseSequenceModel();
        } catch (e) {
          error = e;
        }
        expect(error).toEqual('Can not concatenate sequences 2 and 1 as they have incompatible sticky ends: `` and ``');
      });

    }); //-describe('concatenateSequences')

    describe('methods regarding features', function() {
      var sequence;
      beforeEach(function() {
        var _sequence = new SequenceModel({
          name: 'Test',
          sequence: 'ATG',
          features: [
            {
              id: 3,
              name: 'Sequence Annotation C',
              _type: 'sequence',
              ranges: [{
                from: 2,
                to: 2,
              }]
            },
            {
              id: 0,
              name: 'Sequence Annotation A',
              _type: 'sequence',
              ranges: [{
                from: 0,
                to: 0,
              },{
                from: 0,
                to: 2,
              }]
            },
            {
              id: 44,
              name: 'Sequence Annotation B',
              _type: 'sequence',
              ranges: [{
                from: 1,
                to: 2,
              }]
            }
          ]
        });
        // Disable save function
        if(_sequence.save) spyOn(_sequence, 'save');
        sequence = _sequence.getBaseSequenceModel();
      });

      it('moves features', function() {
        expect(sequence.features[0].ranges[0].from).toEqual(0);
        expect(sequence.features[0].ranges[0].to).toEqual(0);
        expect(sequence.features[0].ranges[1].from).toEqual(0);
        expect(sequence.features[0].ranges[1].to).toEqual(2);
        sequence.moveFeatures(1, 3);
        expect(sequence.features.length).toEqual(3);
        expect(sequence.features[0].ranges[0].from).toEqual(0);
        expect(sequence.features[0].ranges[0].to).toEqual(0);
        expect(sequence.features[0].ranges[1].from).toEqual(0);
        expect(sequence.features[0].ranges[1].to).toEqual(5);
      });

      it('finds correct number of features', function() {
        var features;
        features = sequence3.featuresInRange(0, 1);
        expect(features.length).toEqual(0);
        features = sequence3.featuresInRange(13, 19);
        expect(features.length).toEqual(3);
        features = sequence3.featuresInRange(18, 18);
        expect(features.length).toEqual(2);
      });

      it('deletes features', function() {
        expect(sequence.features.length).toEqual(3);
        sequence.deleteFeature({id: 0});
        expect(sequence.features.length).toEqual(2);
        sequence.deleteFeature({id: 10});
        expect(sequence.features.length).toEqual(2);
        expect(sequence.features[0].id).toEqual(44);
      });
    });

  });
};


export default testAllSequenceModels;
