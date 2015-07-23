import _ from 'underscore';
import {stubCurrentUser} from '../../../common/tests/stubs';
import SequenceModel from '../../../sequence/models/sequence';
import RdpEdit from '../rdp_edit';

import {
  firstCodonIsMethionine,
  noTerminalStopCodons,
  ensureLastBaseIs,
  firstCodonIsStop,
} from '../sequence_transform';


var initialSequenceContent = 'GTGTAG';

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
  partType: 'CDS',
};


stubCurrentUser();
var sequenceModel;



var setBases = function(bases) {
  sequenceModel.set({sequence: bases});
};

var getSequence = function() {
  return sequenceModel.getSequence(sequenceModel.STICKY_END_FULL);
};


describe('sequence transforms', function() {
  beforeEach(function() {
    sequenceModel = new SequenceModel(sequenceAttributes);

    ([
      sequenceModel
    ]).forEach(function(_sequenceModel) {
      spyOn(_sequenceModel, 'save');
      spyOn(_sequenceModel, 'throttledSave');
    });
  });

  describe('RDP sequence Methionine Start Codon validation and transformation', function() {
    describe('correct start codon', function() {
      it('should pass with ATG', function() {
        setBases('ATGTAG');

        var rdpEdits = firstCodonIsMethionine.process(sequenceModel);
        expect(rdpEdits.length).toEqual(0);

        expect(getSequence()).toEqual('ATGTAG');
      });
    });

    describe('incorrect start codon', function() {
      it('should be corrected when GTG', function() {
        expect(getSequence()).toEqual('GTGTAG');
        var rdpEdits = firstCodonIsMethionine.process(sequenceModel);
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
        setBases('TTGTAG');
        var rdpEdits = firstCodonIsMethionine.process(sequenceModel);
        var rdpEdit = rdpEdits[0];
        expect(rdpEdit.type).toEqual(RdpEdit.types.METHIONINE_START_CODON_CONVERTED);
        expect(rdpEdit.error).toBeUndefined();
        expect(getSequence()).toEqual('ATGTAG');
      });

      it('should add Methione when no transform available', function() {
        setBases('CCCTAG');
        var rdpEdits = firstCodonIsMethionine.process(sequenceModel);
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

  describe('RDP sequence Stop codon as first Codon validation and transformation', function() {
    describe('correct stop codon at beginning', function() {
      it('should pass with TGA', function() {
        setBases('TGACCC');

        var rdpEdits = firstCodonIsStop.process(sequenceModel);
        expect(rdpEdits.length).toEqual(0);

        expect(getSequence()).toEqual('TGACCC');
      });

      it('should pass with TAG', function() {
        setBases('TAGCCC');

        var rdpEdits = firstCodonIsStop.process(sequenceModel);
        expect(rdpEdits.length).toEqual(0);

        expect(getSequence()).toEqual('TAGCCC');
      });

      it('should pass with TAA', function() {
        setBases('TAACCC');

        var rdpEdits = firstCodonIsStop.process(sequenceModel);
        expect(rdpEdits.length).toEqual(0);

        expect(getSequence()).toEqual('TAACCC');
      });
    });


    describe('incorrect stop codon at beginning', function() {
      it('should add stop when no transform available', function() {
        setBases('CCCTAG');
        var rdpEdits = firstCodonIsStop.process(sequenceModel);
        var rdpEdit = rdpEdits[0];
        expect(rdpEdit.type).toEqual(RdpEdit.types.FIRST_CODON_IS_STOP_ADDED);
        expect(rdpEdit.error).toBeUndefined();

        expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.FIRST_CODON_IS_STOP_ADDED);
        expect(rdpEdit.contextBefore.name).toEqual('Will insert TAG');
        expect(rdpEdit.contextBefore.ranges.length).toEqual(0);
        expect(rdpEdit.contextBefore.sequence).toEqual('CCCTAG');
        expect(rdpEdit.contextBefore.contextualFrom).toEqual(0);
        expect(rdpEdit.contextBefore.contextualTo).toEqual(6);

        expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.FIRST_CODON_IS_STOP_ADDED);
        expect(rdpEdit.contextAfter.name).toEqual('Inserted TAG');
        expect(rdpEdit.contextAfter.ranges[0].from).toEqual(0);
        expect(rdpEdit.contextAfter.ranges[0].to).toEqual(3);
        expect(rdpEdit.contextAfter.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextAfter.sequence).toEqual('TAGCCCTAG');
        expect(rdpEdit.contextAfter.contextualFrom).toEqual(0);
        expect(rdpEdit.contextAfter.contextualTo).toEqual(9);

        expect(getSequence()).toEqual('TAGCCCTAG');
      });
    });
  });


  describe('RDP sequence with stop codon validation and transformation', function() {
    it('should pass if no stop codons', function() {
      setBases('AAG');
      var rdpEdits = noTerminalStopCodons.process(sequenceModel);
      expect(rdpEdits.length).toEqual(0);

      expect(getSequence()).toEqual('AAG');
    });

    it('should remove only the terminal stop codons', function() {
      var stop1 = 'TGA';
      var stop2 = 'TAG';
      var stop3 = 'TAA';
      var bases = 'GTG'+stop1+'CCC' + stop1+stop2+stop3;
      setBases(bases);

      var rdpEdits = noTerminalStopCodons.process(sequenceModel);
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


  describe('RDP sequence with terminal C base validation and transformation', function() {
    it('should do nothing if terminal base is C', function() {
      setBases('AAC');
      var rdpEdits = ensureLastBaseIs('C').process(sequenceModel);
      expect(rdpEdits.length).toEqual(0);

      expect(getSequence()).toEqual('AAC');
    });

    it('should transform suitable bases', function() {
      const INITIAL = 'ATGCCC';
      const LYSINE1 = 'AAA';
      const LYSINE2 = 'AAG';
      const ARGININE1 = 'AGA';
      const ARGININE2 = 'AGG';
      const ARGININE = 'CGC';

      _.each([LYSINE1, LYSINE2, ARGININE1, ARGININE2], function(codon) {
        setBases(INITIAL + codon);
        var rdpEdits = ensureLastBaseIs('C').process(sequenceModel);
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

    it('should transform suitable bases with the correct context', function() {
      const INITIAL = 'ATGCCCGGG';
      const LYSINE1 = 'AAA';
      const ARGININE = 'CGC';

      setBases(INITIAL + LYSINE1);
      var rdpEdits = ensureLastBaseIs('C').process(sequenceModel);
      var rdpEdit = rdpEdits[0];
      expect(rdpEdit.contextBefore.sequence).toEqual((INITIAL + LYSINE1).slice(-9));
      expect(rdpEdit.contextBefore.contextualFrom).toEqual(3);
      expect(rdpEdit.contextBefore.contextualTo).toEqual(12);

      expect(rdpEdit.contextAfter.sequence).toEqual((INITIAL + ARGININE).slice(-9));
      expect(rdpEdit.contextAfter.contextualFrom).toEqual(3);
      expect(rdpEdit.contextAfter.contextualTo).toEqual(12);

      expect(getSequence()).toEqual(INITIAL + ARGININE);
    });

    it('should error if encounters a stop codon (which should not normally happen)', function() {
      const INITIAL = 'TGAAGA';
      const STOP_AMBER = 'TAG';

      setBases(INITIAL + STOP_AMBER);
      var rdpEdits = ensureLastBaseIs('C').process(sequenceModel);
      var rdpEdit = rdpEdits[0];
      expect(rdpEdit.type).toEqual(RdpEdit.types.LAST_BASE_IS_C);
      expect(rdpEdit.message).toEqual('The last base of sequence must be "C" but there is no replacement for the codon: "TAG".');
      expect(rdpEdit.level).toEqual(RdpEdit.levels.ERROR);

      expect(getSequence()).toEqual(INITIAL + STOP_AMBER);
    });
  });
});
