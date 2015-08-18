import _ from 'underscore';
import WipRdpReadyPcrSequence from '../wip_rdp_ready_pcr_sequence';
import RdpTypes from '../rdp_types';
import {
  stickyEndsXZ,
  stickyEndsZX,
} from './fixtures';


describe('WipRdpReadyAbstractSequence', function() {
  var spyAndStub = function(_sequence) {
    spyOn(_sequence, 'save');
    spyOn(_sequence, 'throttledSave');
  };

  var makeSequenceModel = function(attributes={}) {
    attributes = _.defaults(attributes, {
      sequence: 'ATCGA',
      shortName: 'short',
      sourceSequenceName: 'parent sequence',
      desiredStickyEnds: stickyEndsXZ(),
      frm: 0,
      size: 5,
      partType: RdpTypes.types.PROMOTER,
    });
    spyAndStub(WipRdpReadyPcrSequence.prototype);
    return new WipRdpReadyPcrSequence(attributes);
  };

  describe('instantiate', function() {
    it('should set originalToCurrentSequenceOffset, sameBasesFrm and sameBasesSize', function() {
      var sequenceModel = makeSequenceModel();
      expect(sequenceModel.getSequence()).toEqual('ATCGA');
      expect(sequenceModel.get('frm')).toEqual(0);
      expect(sequenceModel.get('size')).toEqual(5);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(0);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
      expect(sequenceModel.get('sameBasesSize')).toEqual(5);
    });

    it('should set not change frm and size', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TGGTAAAG',
        frm: 1,
        size: 6,
        partType: RdpTypes.types.CDS,
      });
      expect(sequenceModel.getSequence()).toEqual('ATGGGTCGC');
      expect(sequenceModel.get('frm')).toEqual(1);
      expect(sequenceModel.get('size')).toEqual(6);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(-2);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(3);
      expect(sequenceModel.get('sameBasesSize')).toEqual(3);
    });

    it('should increase sameBasesSize to include indentical bases', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TAAACCAG',
        frm: 1,
        size: 6,
        partType: RdpTypes.types.CDS,
      });
      expect(sequenceModel.get('originalSequenceBases')).toEqual('TAAACCAG');
      expect(sequenceModel.getSequence()).toEqual(             'ATGAAACCC');
      expect(sequenceModel.get('frm')).toEqual(1);
      expect(sequenceModel.get('size')).toEqual(6);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(-2);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(3);
      expect(sequenceModel.get('sameBasesSize')).toEqual(5);
    });
  });

  describe('deleting bases', function() {
    it('should not change untouched', function() {
      var sequenceModel = makeSequenceModel();
      expect(sequenceModel.getSequence()).toEqual('ATCGA');
      sequenceModel.deleteBases(0, 0);
      expect(sequenceModel.getSequence()).toEqual('ATCGA');
      expect(sequenceModel.get('frm')).toEqual(0);
      expect(sequenceModel.get('size')).toEqual(5);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
      expect(sequenceModel.get('sameBasesSize')).toEqual(5);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(0);
    });

    it('should reduce frm and size', function() {
      var sequenceModel = makeSequenceModel();
      expect(sequenceModel.getSequence()).toEqual('ATCGA');
      sequenceModel.deleteBases(0, 1);
      expect(sequenceModel.getSequence()).toEqual('TCGA');
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
      expect(sequenceModel.get('sameBasesSize')).toEqual(4);
    });

    it('should reduce size', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TAAG',
        frm: 1,
        size: 3,
      });
      sequenceModel.deleteBases(2, 1);
      expect(sequenceModel.getSequence()).toEqual('AA');
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
      expect(sequenceModel.get('sameBasesSize')).toEqual(2);
    });

    it('should reduce size', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TAAG',
        frm: 1,
        size: 3,
      });
      sequenceModel.deleteBases(2, 1);
      expect(sequenceModel.getSequence()).toEqual('AA');
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
      expect(sequenceModel.get('sameBasesSize')).toEqual(2);
    });
  });

  describe('inserting bases', function() {
    it('should not change untouched', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TAAG',
        frm: 1,
        size: 2,
      });
      expect(sequenceModel.getSequence()).toEqual('AA');
      sequenceModel.insertBases('CC', 2);
      expect(sequenceModel.getSequence()).toEqual('AACC');
      expect(sequenceModel.get('frm')).toEqual(1);
      expect(sequenceModel.get('size')).toEqual(2);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
      expect(sequenceModel.get('sameBasesSize')).toEqual(2);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
    });

    it('should increase sameBasesFrm and decrease originalToCurrentSequenceOffset', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TAAG',
        frm: 1,
        size: 2,
      });
      expect(sequenceModel.getSequence()).toEqual('AA');
      sequenceModel.insertBases('CC', 0);
      expect(sequenceModel.getSequence()).toEqual('CCAA');
      expect(sequenceModel.get('sameBasesFrm')).toEqual(2);
      expect(sequenceModel.get('sameBasesSize')).toEqual(2);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(-1);
    });

    it('should choose larger second half', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TAGAG',
        frm: 1,
        size: 3,
      });
      expect(sequenceModel.getSequence()).toEqual('AGA');
      sequenceModel.insertBases('CC', 1);
      expect(sequenceModel.getSequence()).toEqual('ACCGA');
      expect(sequenceModel.get('sameBasesFrm')).toEqual(3);
      expect(sequenceModel.get('sameBasesSize')).toEqual(2);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
    });

    it('should choose larger first half', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TAGAG',
        frm: 1,
        size: 3,
      });
      expect(sequenceModel.getSequence()).toEqual('AGA');
      sequenceModel.insertBases('CC', 2);
      expect(sequenceModel.getSequence()).toEqual('AGCCA');
      expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
      expect(sequenceModel.get('sameBasesSize')).toEqual(2);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
    });
  });

  describe('changing bases', function() {
    describe('to same base', function() {
      it('should not change sameBasesSize', function() {
        var sequenceModel = makeSequenceModel({
          sequence: 'TAGCG',
          frm: 1,
          size: 3,
        });
        expect(sequenceModel.getSequence()).toEqual('AGC');
        sequenceModel.changeBases(0, 'A');
        expect(sequenceModel.getSequence()).toEqual('AGC');
        expect(sequenceModel.get('frm')).toEqual(1);
        expect(sequenceModel.get('size')).toEqual(3);
        expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
        expect(sequenceModel.get('sameBasesSize')).toEqual(3);
        expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
      });

      it('should not change sameBasesFrm', function() {
        var sequenceModel = makeSequenceModel({
          sequence: 'TAGCG',
          frm: 1,
          size: 3,
        });
        expect(sequenceModel.getSequence()).toEqual('AGC');
        sequenceModel.changeBases(2, 'C');
        expect(sequenceModel.getSequence()).toEqual('AGC');
        expect(sequenceModel.get('frm')).toEqual(1);
        expect(sequenceModel.get('size')).toEqual(3);
        expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
        expect(sequenceModel.get('sameBasesSize')).toEqual(3);
        expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
      });
    });

    it('should increase sameBasesFrm and decrease sameBasesSize', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TAGAG',
        frm: 1,
        size: 3,
      });
      expect(sequenceModel.getSequence()).toEqual('AGA');
      sequenceModel.changeBases(0, 'C');
      expect(sequenceModel.getSequence()).toEqual('CGA');
      expect(sequenceModel.get('frm')).toEqual(1);
      expect(sequenceModel.get('size')).toEqual(3);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(1);
      expect(sequenceModel.get('sameBasesSize')).toEqual(2);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
    });

    it('should decrease sameBasesSize', function() {
      var sequenceModel = makeSequenceModel({
        sequence: 'TAGAG',
        frm: 1,
        size: 3,
      });
      expect(sequenceModel.getSequence()).toEqual('AGA');
      sequenceModel.changeBases(2, 'C');
      expect(sequenceModel.getSequence()).toEqual('AGC');
      expect(sequenceModel.get('frm')).toEqual(1);
      expect(sequenceModel.get('size')).toEqual(3);
      expect(sequenceModel.get('sameBasesFrm')).toEqual(0);
      expect(sequenceModel.get('sameBasesSize')).toEqual(2);
      expect(sequenceModel.get('originalToCurrentSequenceOffset')).toEqual(1);
    });
  });
});
