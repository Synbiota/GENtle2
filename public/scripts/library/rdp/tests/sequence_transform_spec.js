import {stubCurrentUser} from '../../../common/tests/stubs';
import SequenceModel from '../../../sequence/models/sequence';
import RdpEdit from '../rdp_edit';

import {
  methionineStartCodon,
  noTerminalStopCodons,
  ensureLastBaseIs,
  transformSequenceForRdp,
} from '../sequence_transform';


var initialSequenceContent = 'GTGTAG';
var stickyEnds = {
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
  // stickyEnds: stickyEnds,
  partType: 'CDS',
};


stubCurrentUser();
var sequenceModel;

beforeEach(function() {
  sequenceModel = new SequenceModel(sequenceAttributes);

  ([
    sequenceModel
  ]).forEach(function(_sequenceModel) {
    spyOn(_sequenceModel, 'save');
    spyOn(_sequenceModel, 'throttledSave');
  });
});


var setSequence = function(bases, stickyEnds=undefined) {
  if(stickyEnds) {
    bases = stickyEnds.start.sequence + bases + stickyEnds.end.sequence;
  }
  sequenceModel.set({
    sequence: bases,
    stickyEnds: stickyEnds,
  });
};

var getSequence = function() {
  return sequenceModel.getSequence(sequenceModel.STICKY_END_FULL);
};


describe('RDP sequence Methionine Start Codon validation and transformation', function() {
  describe('without stickyEnds', function() {
    describe('correct start codon', function() {
      it('should pass with ATG', function() {
        setSequence('ATGTAG');

        var rdpEdits = methionineStartCodon(sequenceModel);
        expect(rdpEdits.length).toEqual(0);

        expect(getSequence()).toEqual('ATGTAG');
      });
    });

    describe('incorrect start codon', function() {
      it('should be corrected when GTG', function() {
        expect(getSequence()).toEqual('GTGTAG');
        var rdpEdits = methionineStartCodon(sequenceModel);
        var rdpEdit = rdpEdits[0];
        expect(rdpEdit.type).toEqual(RdpEdit.types.METHIONINE_START_CODON_CONVERTED);
        expect(rdpEdit.error).toBeUndefined();

        expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.METHIONINE_START_CODON_CONVERTED);
        expect(rdpEdit.contextBefore.name).toEqual('Will modify GTG');
        expect(rdpEdit.contextBefore.ranges[0].from).toEqual(0);
        expect(rdpEdit.contextBefore.ranges[0].to).toEqual(3);
        expect(rdpEdit.contextBefore.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextBefore.sequence).toEqual('GTGTAG');
        expect(rdpEdit.contextBefore.contextualFrom).toEqual(0);
        expect(rdpEdit.contextBefore.contextualTo).toEqual(6);

        expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.METHIONINE_START_CODON_CONVERTED);
        expect(rdpEdit.contextAfter.name).toEqual('Modified GTG');
        expect(rdpEdit.contextAfter.ranges[0].from).toEqual(0);
        expect(rdpEdit.contextAfter.ranges[0].to).toEqual(3);
        expect(rdpEdit.contextAfter.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextAfter.sequence).toEqual('ATGTAG');
        expect(rdpEdit.contextAfter.contextualFrom).toEqual(0);
        expect(rdpEdit.contextAfter.contextualTo).toEqual(6);

        expect(getSequence()).toEqual('ATGTAG');
      });

      it('should be corrected when TTG', function() {
        setSequence('TTGTAG');
        var rdpEdits = methionineStartCodon(sequenceModel);
        var rdpEdit = rdpEdits[0];
        expect(rdpEdit.type).toEqual(RdpEdit.types.METHIONINE_START_CODON_CONVERTED);
        expect(rdpEdit.error).toBeUndefined();
        expect(getSequence()).toEqual('ATGTAG');
      });

      describe('add Methione when no transform available', function() {
        it('should add quietly', function() {
          // Would need to change quietlyAddMethionine to `true`
          // 
          // setSequence('CCCTAG');
          // var rdpEdits = methionineStartCodon(sequenceModel);
          // expect(rdpEdits.length).toEqual(0);
          // expect(getSequence()).toEqual('ATGCCCTAG');
        });

        it('should error when not quiet', function() {
          setSequence('CCCTAG');
          var rdpEdits = methionineStartCodon(sequenceModel);
          var rdpEdit = rdpEdits[0];
          expect(rdpEdit.type).toEqual(RdpEdit.types.METHIONINE_START_CODON_ADDED);
          expect(rdpEdit.error).toBeUndefined();

          expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.METHIONINE_START_CODON_ADDED);
          expect(rdpEdit.contextBefore.name).toEqual('Will insert ATG');
          expect(rdpEdit.contextBefore.ranges.length).toEqual(0);
          expect(rdpEdit.contextBefore.sequence).toEqual('CCCTAG');
          expect(rdpEdit.contextBefore.contextualFrom).toEqual(0);
          expect(rdpEdit.contextBefore.contextualTo).toEqual(6);

          expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.METHIONINE_START_CODON_ADDED);
          expect(rdpEdit.contextAfter.name).toEqual('Inserted ATG');
          expect(rdpEdit.contextAfter.ranges[0].from).toEqual(0);
          expect(rdpEdit.contextAfter.ranges[0].to).toEqual(3);
          expect(rdpEdit.contextAfter.ranges[0].reverse).toEqual(false);
          expect(rdpEdit.contextAfter.sequence).toEqual('ATGCCCTAG');
          expect(rdpEdit.contextAfter.contextualFrom).toEqual(0);
          expect(rdpEdit.contextAfter.contextualTo).toEqual(9);

          expect(getSequence()).toEqual('ATGCCCTAG');
          
        });
      });
    });
  });
});


describe('RDP sequence with stop codon validation and transformation', function() {
  describe('without stickyEnds', function() {
    it('should pass if no stop codons', function() {
      setSequence('AAG');
      var rdpEdits = noTerminalStopCodons(sequenceModel);
      expect(rdpEdits.length).toEqual(0);

      expect(getSequence()).toEqual('AAG');
    });

    it('should remove only the terminal stop codons', function() {
      var stop1 = 'TGA';
      var stop2 = 'TAG';
      var stop3 = 'TAA';
      setSequence('GTG'+stop1+'CCC' + stop1+stop2+stop3);

      var rdpEdits = noTerminalStopCodons(sequenceModel);
      var rdpEdit = rdpEdits[0];
      expect(rdpEdit.type).toEqual(RdpEdit.types.TERMINAL_STOP_CODON_REMOVED);
      expect(rdpEdit.error).toBeUndefined();

      expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.TERMINAL_STOP_CODON_REMOVED);
      expect(rdpEdit.contextBefore.name).toEqual('Will remove stop codons');
      expect(rdpEdit.contextBefore.ranges[0].from).toEqual(15);
      expect(rdpEdit.contextBefore.ranges[0].to).toEqual(18);
      expect(rdpEdit.contextBefore.ranges[0].reverse).toEqual(false);
      expect(rdpEdit.contextBefore.ranges[2].from).toEqual(9);
      expect(rdpEdit.contextBefore.sequence).toEqual('GTGTGACCCTGATAGTAA');
      expect(rdpEdit.contextBefore.contextualFrom).toEqual(0);
      expect(rdpEdit.contextBefore.contextualTo).toEqual(18);

      expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.TERMINAL_STOP_CODON_REMOVED);
      expect(rdpEdit.contextAfter.name).toEqual('Removed stop codons');
      expect(rdpEdit.contextAfter.ranges.length).toEqual(0);
      expect(rdpEdit.contextAfter.sequence).toEqual('GTGTGACCC');
      expect(rdpEdit.contextAfter.contextualFrom).toEqual(0);
      expect(rdpEdit.contextAfter.contextualTo).toEqual(9);

      expect(getSequence()).toEqual('GTG'+'TGA'+'CCC');
    });
  });
});


describe('RDP sequence with terminal C base validation and transformation', function() {
  describe('without stickyEnds', function() {
    it('should do nothing if terminal base is C', function() {
      setSequence('AAC');
      var rdpEdits = ensureLastBaseIs('C')(sequenceModel);
      expect(rdpEdits.length).toEqual(0);

      expect(getSequence()).toEqual('AAC');
    });

    it('should transform suitable bases', function() {
      const INITIAL = 'ATGCAG';
      const LYSINE1 = 'AAA';
      const LYSINE2 = 'AAG';
      const ARGININE1 = 'AGA';
      const ARGININE2 = 'AGG';
      const ARGININE = 'CGC';

      _.each([LYSINE1, LYSINE2, ARGININE1, ARGININE2], function(codon) {
        setSequence(INITIAL + codon);
        var rdpEdits = ensureLastBaseIs('C')(sequenceModel);
        var rdpEdit = rdpEdits[0];
        expect(rdpEdit.error).toBeUndefined();
        var type = ((codon === LYSINE1 || codon === LYSINE2) ?
          RdpEdit.types.LAST_BASE_IS_C :
          RdpEdit.types.LAST_BASE_IS_C_NO_AA_CHANGE);
        expect(rdpEdit.type).toEqual(type);

        expect(rdpEdit.contextBefore._type).toEqual(type);
        expect(rdpEdit.contextBefore.name).toEqual('Last base should be "C"');
        expect(rdpEdit.contextBefore.ranges[0].from).toEqual(8);
        expect(rdpEdit.contextBefore.ranges[0].to).toEqual(9);
        expect(rdpEdit.contextBefore.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextBefore.sequence).toEqual(INITIAL + codon);
        expect(rdpEdit.contextBefore.contextualFrom).toEqual(0);
        expect(rdpEdit.contextBefore.contextualTo).toEqual(9);

        expect(rdpEdit.contextAfter._type).toEqual(type);
        expect(rdpEdit.contextAfter.name).toEqual('Last base changed to "C".');
        expect(rdpEdit.contextAfter.ranges[0].from).toEqual(8);
        expect(rdpEdit.contextAfter.ranges[0].to).toEqual(9);
        expect(rdpEdit.contextAfter.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextAfter.sequence).toEqual(INITIAL + ARGININE);
        expect(rdpEdit.contextAfter.contextualFrom).toEqual(0);
        expect(rdpEdit.contextAfter.contextualTo).toEqual(9);

        expect(getSequence()).toEqual(INITIAL + ARGININE);
      });
    });

    it('should error if encounters a stop codon (which should not normally happen)', function() {
      const INITIAL = 'TGAAGA';
      const STOP_AMBER = 'TAG';

      setSequence(INITIAL + STOP_AMBER);
      var rdpEdits = ensureLastBaseIs('C')(sequenceModel);
      var rdpEdit = rdpEdits[0];
      expect(rdpEdit.type).toEqual(RdpEdit.types.LAST_BASE_IS_C);
      expect(rdpEdit.message).toEqual('The last base of sequence must be "C" but there is no replacement for the codon: "TAG".');
      expect(rdpEdit.level).toEqual(RdpEdit.levels.ERROR);

      expect(getSequence()).toEqual(INITIAL + STOP_AMBER);
    });
  });
});


describe('all RDP sequence validation and transformation', function() {
  describe('without stickyEnds', function() {
    it('should do nothing if no transformations to make', function() {
      setSequence('ATGAAC');
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(0);

      expect(getSequence()).toEqual('ATGAAC');
    });

    it('should error if length is not a multiple of 3 and sequence is too short', function() {
      setSequence('AC');
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(2);
      expect(rdpEdits[0].type).toEqual(RdpEdit.types.NOT_MULTIPLE_OF_3);
      expect(rdpEdits[0].level).toEqual(RdpEdit.levels.ERROR);
      expect(rdpEdits[1].type).toEqual(RdpEdit.types.SEQUENCE_TOO_SHORT);
      expect(rdpEdits[1].level).toEqual(RdpEdit.levels.ERROR);

      expect(getSequence()).toEqual('AC');
    });

    it('should error if stickyEnds are present', function() {
      setSequence('AC', stickyEnds);
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(1);
      expect(rdpEdits[0].type).toEqual(RdpEdit.types.STICKY_ENDS_PRESENT);
      expect(rdpEdits[0].level).toEqual(RdpEdit.levels.ERROR);

      expect(getSequence()).toEqual(stickyEnds.start.sequence + 'AC' + stickyEnds.end.sequence);
    });

    it('should transform all', function() {
      const LYSINE1 = 'AAA';
      const ARGININE = 'CGC';
      setSequence('GTGTAG' + LYSINE1);
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
      setSequence('ACCTGTTTTAAAAAT');
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
