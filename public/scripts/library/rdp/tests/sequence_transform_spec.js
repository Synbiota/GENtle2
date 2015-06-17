import {stubCurrentUser} from '../../../common/tests/stubs';
import SequenceModel from '../../../sequence/models/sequence';
import RdpEdit from '../rdp_edit';

import {
  multipleOf3,
  methionineStartCodon,
  noTerminalStopCodon,
  terminalCBase,
  transformSequenceForRdp,
} from '../sequence_transform';


var initialSequenceContent = 'GTGTAG';
var stickyEnds = {
  start: {
    sequence: 'CC' + 'AGA',
    reverse: false,
    offset: 2,
    size: 3,
    name: "X",
  },
  end: {
    sequence: 'GAGA' + 'TGA',
    reverse: true,
    offset: 3,
    size: 4,
    name: "Z'",
  }
};

var fixtures = [
{
  name: 'Test sequence',
  sequence: stickyEnds.start.sequence + initialSequenceContent + stickyEnds.end.sequence,
  features: [{
    ranges: [{
      from: 7,
      to: 9
    }],
    name: 'test feature',
    desc: 'test feature description',
    type: 'gene'
  }],
  stickyEnds: stickyEnds
},
];


stubCurrentUser();
var sequenceModel;

beforeEach(function() {
  sequenceModel = new SequenceModel(fixtures[0]);

  ([
    sequenceModel
  ]).forEach(function(_sequenceModel) {
    spyOn(_sequenceModel, 'save');
    spyOn(_sequenceModel, 'throttledSave');
  });
});

var setSequence = function(bases) {
  sequenceModel.set('sequence', stickyEnds.start.sequence + bases + stickyEnds.end.sequence);
};


describe('RDP sequence Multiple of 3 validation and transformation', function() {
  describe('with stickyEnds', function() {
    var notAMultpleOf3 = 'CCAGA' + 'ATGCCCTT' + 'GAGATGA';
    beforeEach(function() {
      sequenceModel.set('sequence', notAMultpleOf3);
    });

    it('should transform', function() {
      var rdpEdit = multipleOf3(sequenceModel);
      expect(rdpEdit.type).toEqual(RdpEdit.types.MULTIPLE_OF_3);
      expect(rdpEdit.error).toBeUndefined();

      expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.MULTIPLE_OF_3);
      expect(rdpEdit.contextBefore.name).toEqual('Will remove bases');
      expect(rdpEdit.contextBefore.ranges[0].from).toEqual(11);
      expect(rdpEdit.contextBefore.ranges[0].to).toEqual(13);
      expect(rdpEdit.contextBefore.ranges[0].reverse).toEqual(false);
      expect(rdpEdit.contextBefore.sequence).toEqual('AGAATGCCCTT');
      expect(rdpEdit.contextBefore.contextualFrom).toEqual(2);
      expect(rdpEdit.contextBefore.contextualTo).toEqual(13);

      expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.MULTIPLE_OF_3);
      expect(rdpEdit.contextAfter.name).toEqual('Removed bases');
      expect(rdpEdit.contextAfter.ranges.length).toEqual(0);
      expect(rdpEdit.contextAfter.sequence).toEqual('AGAATGCCC');
      expect(rdpEdit.contextAfter.contextualFrom).toEqual(2);
      expect(rdpEdit.contextAfter.contextualTo).toEqual(11);

      expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGCCC' + 'GAGATGA');
    });
  });
});


describe('RDP sequence Methionine Start Codon validation and transformation', function() {
  describe('with stickyEnds', function() {
    describe('correct start codon', function() {
      it('should pass', function() {
        setSequence('ATGTAG');

        var rdpEdit = methionineStartCodon(sequenceModel);
        expect(rdpEdit).toBeUndefined();

        expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGTAG' + 'GAGATGA');
      });
    });

    describe('incorrect start codon', function() {
      it('should be corrected when GTG', function() {
        expect(sequenceModel.getSequence(sequenceModel.STICKY_END_NONE)).toEqual('GTGTAG');
        var rdpEdit = methionineStartCodon(sequenceModel);
        expect(rdpEdit.type).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(rdpEdit.error).toBeUndefined();

        expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(rdpEdit.contextBefore.name).toEqual('Will modify GTG');
        expect(rdpEdit.contextBefore.ranges[0].from).toEqual(5);
        expect(rdpEdit.contextBefore.ranges[0].to).toEqual(8);
        expect(rdpEdit.contextBefore.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextBefore.sequence).toEqual('GTGTAGGAGATG');
        expect(rdpEdit.contextBefore.contextualFrom).toEqual(5);
        expect(rdpEdit.contextBefore.contextualTo).toEqual(17);

        expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(rdpEdit.contextAfter.name).toEqual('Modified GTG');
        expect(rdpEdit.contextAfter.ranges[0].from).toEqual(5);
        expect(rdpEdit.contextAfter.ranges[0].to).toEqual(8);
        expect(rdpEdit.contextAfter.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextAfter.sequence).toEqual('ATGTAGGAGATG');
        expect(rdpEdit.contextAfter.contextualFrom).toEqual(5);
        expect(rdpEdit.contextAfter.contextualTo).toEqual(17);

        expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGTAG' + 'GAGATGA');
      });

      it('should be corrected when TTG', function() {
        setSequence('TTGTAG');
        var rdpEdit = methionineStartCodon(sequenceModel);
        expect(rdpEdit.type).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(rdpEdit.error).toBeUndefined();

        expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(rdpEdit.contextBefore.name).toEqual('Will modify TTG');
        expect(rdpEdit.contextBefore.ranges[0].from).toEqual(5);
        expect(rdpEdit.contextBefore.ranges[0].to).toEqual(8);
        expect(rdpEdit.contextBefore.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextBefore.sequence).toEqual('TTGTAGGAGATG');
        expect(rdpEdit.contextBefore.contextualFrom).toEqual(5);
        expect(rdpEdit.contextBefore.contextualTo).toEqual(17);

        expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(rdpEdit.contextAfter.name).toEqual('Modified TTG');
        expect(rdpEdit.contextAfter.ranges[0].from).toEqual(5);
        expect(rdpEdit.contextAfter.ranges[0].to).toEqual(8);
        expect(rdpEdit.contextAfter.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextAfter.sequence).toEqual('ATGTAGGAGATG');
        expect(rdpEdit.contextAfter.contextualFrom).toEqual(5);
        expect(rdpEdit.contextAfter.contextualTo).toEqual(17);
        
        expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGTAG' + 'GAGATGA');
      });

      it('should insert when no transform available', function() {
        setSequence('CCCTAG');
        var rdpEdit = methionineStartCodon(sequenceModel);
        expect(rdpEdit.type).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(rdpEdit.error).toBeUndefined();

        expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(rdpEdit.contextBefore.name).toEqual('Will insert ATG');
        expect(rdpEdit.contextBefore.ranges.length).toEqual(0);
        expect(rdpEdit.contextBefore.sequence).toEqual('CCCTAGGAG');
        expect(rdpEdit.contextBefore.contextualFrom).toEqual(5);
        expect(rdpEdit.contextBefore.contextualTo).toEqual(14);

        expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(rdpEdit.contextAfter.name).toEqual('Inserted ATG');
        expect(rdpEdit.contextAfter.ranges[0].from).toEqual(5);
        expect(rdpEdit.contextAfter.ranges[0].to).toEqual(8);
        expect(rdpEdit.contextAfter.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextAfter.sequence).toEqual('ATGCCCTAGGAG');
        expect(rdpEdit.contextAfter.contextualFrom).toEqual(5);
        expect(rdpEdit.contextAfter.contextualTo).toEqual(17);

        expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGCCCTAG' + 'GAGATGA');
      });
    });
  });
});


describe('RDP sequence with stop codon validation and transformation', function() {
  describe('with stickyEnds', function() {
    it('should pass if no stop codons', function() {
      setSequence('AAG');
      var rdpEdit = noTerminalStopCodon(sequenceModel);
      expect(rdpEdit).toBeUndefined();

      expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual(
        stickyEnds.start.sequence + 'AAG' + stickyEnds.end.sequence
      );
    });

    it('should remove only the terminal stop codon', function() {
      setSequence('GTG'+'TAG'+'CCC' + 'TAG');

      var rdpEdit = noTerminalStopCodon(sequenceModel);
      expect(rdpEdit.type).toEqual(RdpEdit.types.NO_TERMINAL_STOP_CODON);
      expect(rdpEdit.error).toBeUndefined();

      expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.NO_TERMINAL_STOP_CODON);
      expect(rdpEdit.contextBefore.name).toEqual('Will remove stop codon');
      expect(rdpEdit.contextBefore.ranges[0].from).toEqual(14);
      expect(rdpEdit.contextBefore.ranges[0].to).toEqual(17);
      expect(rdpEdit.contextBefore.ranges[0].reverse).toEqual(false);
      expect(rdpEdit.contextBefore.sequence).toEqual('GTGTAGCCCTAG');
      expect(rdpEdit.contextBefore.contextualFrom).toEqual(5);
      expect(rdpEdit.contextBefore.contextualTo).toEqual(17);

      expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.NO_TERMINAL_STOP_CODON);
      expect(rdpEdit.contextAfter.name).toEqual('Removed stop codon');
      expect(rdpEdit.contextAfter.ranges.length).toEqual(0);
      expect(rdpEdit.contextAfter.sequence).toEqual('GTGTAGCCC');
      expect(rdpEdit.contextAfter.contextualFrom).toEqual(5);
      expect(rdpEdit.contextAfter.contextualTo).toEqual(14);

      expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'GTG'+'TAG'+'CCC' + 'GAGATGA');
    });
  });
});


describe('RDP sequence with terminal C base validation and transformation', function() {
  describe('with stickyEnds', function() {
    it('should do nothing if terminal base is C', function() {
      setSequence('AAC');
      var rdpEdit = terminalCBase(sequenceModel);
      expect(rdpEdit).toBeUndefined();

      expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'AAC' + 'GAGATGA');
    });

    it('should error if length is not a multiple of 3', function() {
      setSequence('C');
      var rdpEdit = terminalCBase(sequenceModel);
      expect(rdpEdit.type).toEqual(RdpEdit.types.TERMINAL_C_BASE);
      expect(rdpEdit.error).toEqual('Requires sequence to be a mutliple of 3 but is "1" long.');

      expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'C' + 'GAGATGA');
    });

    it('should transform suitable bases', function() {
      const LYSINE1 = 'AAA';
      const LYSINE2 = 'AAG';
      const ARGININE1 = 'AGA';
      const ARGININE2 = 'AGG';
      const ARGININE = 'CGC';

      _.each([LYSINE1, LYSINE2, ARGININE1, ARGININE2], function(codon) {
        setSequence(codon);
        var rdpEdit = terminalCBase(sequenceModel);
        expect(rdpEdit.error).toBeUndefined();
        expect(rdpEdit.type).toEqual(RdpEdit.types.TERMINAL_C_BASE);

        expect(rdpEdit.contextBefore._type).toEqual(RdpEdit.types.TERMINAL_C_BASE);
        expect(rdpEdit.contextBefore.name).toEqual('Last base should be "C"');
        expect(rdpEdit.contextBefore.ranges[0].from).toEqual(7);
        expect(rdpEdit.contextBefore.ranges[0].to).toEqual(8);
        expect(rdpEdit.contextBefore.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextBefore.sequence).toEqual(codon);
        expect(rdpEdit.contextBefore.contextualFrom).toEqual(5);
        expect(rdpEdit.contextBefore.contextualTo).toEqual(8);

        expect(rdpEdit.contextAfter._type).toEqual(RdpEdit.types.TERMINAL_C_BASE);
        expect(rdpEdit.contextAfter.name).toEqual('Last base changed to "C".');
        expect(rdpEdit.contextAfter.ranges[0].from).toEqual(7);
        expect(rdpEdit.contextAfter.ranges[0].to).toEqual(8);
        expect(rdpEdit.contextAfter.ranges[0].reverse).toEqual(false);
        expect(rdpEdit.contextAfter.sequence).toEqual(ARGININE);
        expect(rdpEdit.contextAfter.contextualFrom).toEqual(5);
        expect(rdpEdit.contextAfter.contextualTo).toEqual(8);

        expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + ARGININE + 'GAGATGA');
      });
    });

    it('should error if encounters a stop codon', function() {
      const STOP_AMBER = 'TAG';

      setSequence(STOP_AMBER);
      var rdpEdit = terminalCBase(sequenceModel);
      expect(rdpEdit.type).toEqual(RdpEdit.types.TERMINAL_C_BASE);
      expect(rdpEdit.error).toEqual('The last base of sequence must be "C" but there is no replacement for the codon: "TAG".');

      expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + STOP_AMBER + 'GAGATGA');
    });
  });
});


describe('all RDP sequence validation and transformation', function() {
  describe('with stickyEnds', function() {
    it('should do nothing if no transformations to make', function() {
      setSequence('ATGAAC');
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(0);

      expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGAAC' + 'GAGATGA');
    });

    it('should make an edit if length is not a multiple of 3', function() {
      setSequence('ATGTACC');
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(1);
      expect(rdpEdits[0].type).toEqual(RdpEdit.types.MULTIPLE_OF_3);
      // Perhaps we want this to flag as an error too?
      expect(rdpEdits[0].error).toBeUndefined();

      expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGTAC' + 'GAGATGA');
    });

    it('should transform all', function() {
      const LYSINE1 = 'AAA';
      const ARGININE = 'CGC';
      setSequence('GTGTAG' + LYSINE1);
      var rdpEdits = transformSequenceForRdp(sequenceModel);
      expect(rdpEdits.length).toEqual(2);

      expect(sequenceModel.getSequence(sequenceModel.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGTAG' + ARGININE + 'GAGATGA');
    });
  });
});
