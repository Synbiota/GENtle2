import {stubCurrentUser} from '../../../common/tests/stubs';
import WipPcrProductSequence from '../../../plugins/pcr/lib/wip_product';
import RdpEdit from '../rdp_edit';

import {
  transformSequenceForRdp,
} from '../rdp_sequence_transform';


var initialSequenceContent = 'GTGTAG';
var stickyEnds = function() {
  return {
    start: {
      sequence: 'CC' + 'ATG',
      reverse: false,
      offset: 2,
      size: 3,
      name: "X",
    },
    end: {
      sequence: 'CAGA' + 'TGA',
      reverse: true,
      offset: 3,
      size: 4,
      name: "Z'",
    }
  };
};

var sequenceAttributes = {
  name: 'Test sequence',
  sequence: initialSequenceContent,
  features: [{
    ranges: [{
      from: 7,
      to: 9
    }],
    name: 'test feature',
    desc: 'test feature description',
    type: 'gene'
  }],
  // desiredStickyEnds: stickyEnds(),
  partType: 'CDS',
};


stubCurrentUser();
var sequenceModel;

beforeEach(function() {
  sequenceModel = new WipPcrProductSequence(sequenceAttributes);

  ([
    sequenceModel
  ]).forEach(function(_sequenceModel) {
    spyOn(_sequenceModel, 'save');
    spyOn(_sequenceModel, 'throttledSave');
  });
});


var setSequence = function(bases, desiredStickyEnds=undefined, stickyEnds=undefined) {
  if(stickyEnds) {
    bases = stickyEnds.start.sequence + bases + stickyEnds.end.sequence;
  }
  sequenceModel.set({
    sequence: bases,
    desiredStickyEnds,
    stickyEnds,
  });
};

var getSequence = function() {
  return sequenceModel.getSequence(sequenceModel.STICKY_END_FULL);
};



describe('all RDP sequence validation and transformation', function() {
  describe('without stickyEnds', function() {
    it('should do nothing if no transformations to make', function() {
      setSequence('ATGAAC', stickyEnds());
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(0);

      expect(getSequence()).toEqual('ATGAAC');
    });

    it('should throw an error if no desiredStickyEnds are present', function() {
      setSequence('ATGAAC', undefined);
      expect(function() {
        transformSequenceForRdp(sequenceModel);
      }).toThrowError(TypeError, 'Must provide "desiredStickyEnds"');
    });

    it('should throw an error if last base is unsupported', function() {
      var desiredStickyEnds = stickyEnds();
      desiredStickyEnds.end.sequence = 'T';
      desiredStickyEnds.end.offset = 0;
      desiredStickyEnds.end.size = 1;
      setSequence('ATGAAT', desiredStickyEnds);
      expect(function() {
        transformSequenceForRdp(sequenceModel);
      }).toThrowError(TypeError, 'ensureLastBaseIs does not yet support base of: "T"');
    });

    it('should error if length is not a multiple of 3 and sequence is too short', function() {
      setSequence('AC', stickyEnds());
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(2);
      expect(rdpEdits[0].type).toEqual(RdpEdit.types.SEQUENCE_TOO_SHORT);
      expect(rdpEdits[0].level).toEqual(RdpEdit.levels.ERROR);
      expect(rdpEdits[1].type).toEqual(RdpEdit.types.NOT_MULTIPLE_OF_3);
      expect(rdpEdits[1].level).toEqual(RdpEdit.levels.ERROR);

      expect(getSequence()).toEqual('AC');
    });

    it('should error if stickyEnds are present', function() {
      var stickyEndz = stickyEnds();
      setSequence('AC', stickyEnds(), stickyEndz);
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(1);
      expect(rdpEdits[0].type).toEqual(RdpEdit.types.STICKY_ENDS_PRESENT);
      expect(rdpEdits[0].level).toEqual(RdpEdit.levels.ERROR);

      expect(getSequence()).toEqual(stickyEndz.start.sequence + 'AC' + stickyEndz.end.sequence);
    });

    it('should transform all', function() {
      const LYSINE1 = 'AAA';
      const ARGININE = 'CGC';
      setSequence('GTGTAG' + LYSINE1, stickyEnds());
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(3);
      expect(rdpEdits[0].type).toEqual(RdpEdit.types.METHIONINE_START_CODON_CONVERTED);
      expect(rdpEdits[0].level).toEqual(RdpEdit.levels.NORMAL);
      expect(rdpEdits[1].type).toEqual(RdpEdit.types.LAST_BASE_IS_C);
      expect(rdpEdits[1].level).toEqual(RdpEdit.levels.NORMAL);
      expect(rdpEdits[2].type).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      expect(rdpEdits[2].level).toEqual(RdpEdit.levels.WARN);

      expect(getSequence()).toEqual('ATGTAG' + ARGININE);
    });

    it('should transform all 2', function() {
      setSequence('ACCTGTTTTAAAAAT', stickyEnds());
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(2);
      expect(rdpEdits[0].type).toEqual(RdpEdit.types.METHIONINE_START_CODON_ADDED);
      expect(rdpEdits[0].level).toEqual(RdpEdit.levels.NORMAL);
      expect(rdpEdits[1].type).toEqual(RdpEdit.types.LAST_BASE_IS_C_NO_AA_CHANGE);
      expect(rdpEdits[1].level).toEqual(RdpEdit.levels.NORMAL);

      expect(getSequence()).toEqual('ATGACCTGTTTTAAAAAC');
    });
  });
});
