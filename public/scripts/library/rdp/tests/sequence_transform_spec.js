import {stubCurrentUser} from '../../../common/tests/stubs';
import SequenceModel from '../../../sequence/models/sequence';

import {
  validateMethionineStartCodon, 
  validateMultipleOf3, 
  validateNoStopCodon, 
  validateTerminalCBase, 
  validateRDPSequence
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
var sequence;

beforeEach(function() {
  sequence = new SequenceModel(fixtures[0]);

  ([
    sequence
  ]).forEach(function(_sequence) {
    spyOn(_sequence, 'save');
    spyOn(_sequence, 'throttledSave');
  });
});

var setSequence = function(bases) {
  sequence.set('sequence', stickyEnds.start.sequence + bases + stickyEnds.end.sequence);
};


describe('RDP sequence Methionine Start Codon validation and transformation', function() {
  describe('with stickyEnds', function() {
    describe('correct start codon', function() {
      it('should pass', function() {
        setSequence('ATGTAG');

        var response = validateMethionineStartCodon(sequence);
        expect(response.success).toEqual(true);
        expect(response.errors.length).toEqual(0);
        expect(response.transforms.length).toEqual(0);

        expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGTAG' + 'GAGATGA');
      });
    });

    describe('incorrect start codon', function() {
      it('should be corrected', function() {
        var response = validateMethionineStartCodon(sequence);
        expect(response.success).toEqual(true);
        expect(response.errors.length).toEqual(0);
        expect(response.transforms.length).toEqual(1);

        var transform = response.transforms[0];
        expect(transform._type).toEqual('note');
        expect(transform.name).toEqual('Modfied ATG');
        expect(transform.ranges.length).toEqual(1);
        expect(transform.ranges[0].from).toEqual(5);
        expect(transform.ranges[0].size).toEqual(3);
        expect(transform.ranges[0].reverse).toEqual(false);

        expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGTAG' + 'GAGATGA');
      });

      it('should be corrected when TTG', function() {
        setSequence('TTGTAG');
        var response = validateMethionineStartCodon(sequence);
        expect(response.success).toEqual(true);
        expect(response.errors.length).toEqual(0);
        expect(response.transforms.length).toEqual(1);

        expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGTAG' + 'GAGATGA');
      });

      it('should insert when no transform available', function() {
        setSequence('CCCTAG');
        var response = validateMethionineStartCodon(sequence);
        expect(response.success).toEqual(true);
        expect(response.errors.length).toEqual(0);
        expect(response.transforms.length).toEqual(1);

        expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGCCCTAG' + 'GAGATGA');
      });

      it('should be error if no transform allowed', function() {
        var response = validateMethionineStartCodon(sequence, false);
        expect(response.success).toEqual(false);
        expect(response.errors.length).toEqual(1);
        expect(response.transforms.length).toEqual(0);

        expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'GTGTAG' + 'GAGATGA');
      });
    });
  });
});


describe('RDP sequence Multiple of 3 validation and transformation', function() {
  describe('with stickyEnds', function() {
    var notAMultpleOf3 = 'CCAGA' + 'ATGCCCTT' + 'GAGATGA';
    beforeEach(function() {
      sequence.set('sequence', notAMultpleOf3);
    });

    it('should transform when allowed', function() {
      var response = validateMultipleOf3(sequence, true);
      expect(response.success).toEqual(true);
      expect(response.errors.length).toEqual(0);
      expect(response.transforms.length).toEqual(1);

      var transform = response.transforms[0];
      expect(transform.name).toEqual('Removed bases');
      expect(transform.ranges[0].from).toEqual(11);
      expect(transform.ranges[0].size).toEqual(2);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGCCC' + 'GAGATGA');
    });

    it('should not transform by default and should error', function() {
      // It should not transform by default
      var response = validateMultipleOf3(sequence);
      expect(response.success).toEqual(false);
      expect(response.errors.length).toEqual(1);
      expect(response.transforms.length).toEqual(0);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual(notAMultpleOf3);
    });
  });
});


describe('RDP sequence with stop codon validation and transformation', function() {
  describe('with stickyEnds', function() {
    it('should pass if no stop codons', function() {
      setSequence('AAG');
      var response = validateNoStopCodon(sequence);
      expect(response.success).toEqual(true);
      expect(response.errors.length).toEqual(0);
      expect(response.transforms.length).toEqual(0);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual(
        stickyEnds.start.sequence + 'AAG' + stickyEnds.end.sequence
      );
    });

    it('should remove the stop codon', function() {
      var response = validateNoStopCodon(sequence);
      expect(response.success).toEqual(true);
      expect(response.errors.length).toEqual(0);
      expect(response.transforms.length).toEqual(1);

      var transform = response.transforms[0];
      expect(transform._type).toEqual('note');
      expect(transform.name).toEqual('Removed stop codon(s)');
      expect(transform.ranges.length).toEqual(1);
      expect(transform.ranges[0].from).toEqual(8);
      expect(transform.ranges[0].size).toEqual(3);
      expect(transform.ranges[0].reverse).toEqual(false);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'GTG' + 'GAGATGA');
    });

    it('should remove muliple stop codons', function() {
      setSequence('CCC' + 'TAA' + 'GGG' + 'TAG' + 'CCC' + 'TGA' + 'GGG');
      var response = validateNoStopCodon(sequence);
      expect(response.success).toEqual(true);
      expect(response.errors.length).toEqual(0);
      expect(response.transforms.length).toEqual(1);

      var transform = response.transforms[0];
      expect(transform._type).toEqual('note');
      expect(transform.name).toEqual('Removed stop codon(s)');
      expect(transform.ranges.length).toEqual(3);
      expect(transform.ranges[2].from).toEqual(8);
      expect(transform.ranges[2].size).toEqual(3);
      expect(transform.ranges[1].from).toEqual(14);
      expect(transform.ranges[1].size).toEqual(3);
      expect(transform.ranges[0].from).toEqual(20);
      expect(transform.ranges[0].size).toEqual(3);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'CCCGGGCCCGGG' + 'GAGATGA');
    });

    it('should error if not allowed to transform', function() {
      var response = validateNoStopCodon(sequence, false);
      expect(response.success).toEqual(false);
      expect(response.errors.length).toEqual(1);
      expect(response.transforms.length).toEqual(0);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual(
        stickyEnds.start.sequence + initialSequenceContent + stickyEnds.end.sequence
      );
    });

    it('should error if sequence is not a multiple of 3', function() {
      setSequence('C');
      var response = validateNoStopCodon(sequence, false);
      expect(response.success).toEqual(false);
      expect(response.errors.length).toEqual(1);
      expect(response.transforms.length).toEqual(0);

      expect(response.errors[0]._type).toEqual('error');
      expect(response.errors[0].name).toEqual('Extra bases');
    });
  });
});


describe('RDP sequence with terminal C base validation and transformation', function() {
  describe('with stickyEnds', function() {
    it('should do nothing if terminal base is C', function() {
      setSequence('AAC');
      var response = validateTerminalCBase(sequence);
      expect(response.success).toEqual(true);
      expect(response.errors.length).toEqual(0);
      expect(response.transforms.length).toEqual(0);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'AAC' + 'GAGATGA');
    });

    it('should error if length is not a multiple of 3', function() {
      setSequence('C');
      var response = validateTerminalCBase(sequence, false);
      expect(response.success).toEqual(false);
      expect(response.errors.length).toEqual(1);
      expect(response.transforms.length).toEqual(0);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'C' + 'GAGATGA');
    });

    it('should transform suitable bases', function() {
      const LYSINE1 = 'AAA';
      const LYSINE2 = 'AAG';
      const ARGININE1 = 'AGA';
      const ARGININE2 = 'AGG';
      const ARGININE = 'CGC';

      _.each([LYSINE1, LYSINE2, ARGININE1, ARGININE2], function(codon) {
        setSequence(codon);
        var response = validateTerminalCBase(sequence);
        expect(response.success).toEqual(true);
        expect(response.errors.length).toEqual(0);
        expect(response.transforms.length).toEqual(1);

        expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + ARGININE + 'GAGATGA');
      });
    });

    it('should error if not allowed to transform', function() {
      const LYSINE1 = 'AAA';
      const LYSINE2 = 'AAG';
      const ARGININE1 = 'AGA';
      const ARGININE2 = 'AGG';

      _.each([LYSINE1, LYSINE2, ARGININE1, ARGININE2], function(codon) {
        setSequence(codon);
        var response = validateTerminalCBase(sequence, false);
        expect(response.success).toEqual(false);
        expect(response.errors.length).toEqual(1);
        expect(response.transforms.length).toEqual(0);

        expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + codon + 'GAGATGA');
      });
    });

    it('should error if encounters a stop codon', function() {
      const STOP_AMBER = 'TAG';

      setSequence(STOP_AMBER);
      var response = validateTerminalCBase(sequence);
      expect(response.success).toEqual(false);
      expect(response.errors.length).toEqual(1);
      expect(response.transforms.length).toEqual(0);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + STOP_AMBER + 'GAGATGA');
    });
  });
});


describe('all RDP sequence validation and transformation', function() {
  describe('with stickyEnds', function() {
    it('should do nothing if no transformations to make', function() {
      setSequence('ATGAAC');
      var response = validateRDPSequence(sequence);
      expect(response.success).toEqual(true);
      expect(response.errors.length).toEqual(0);
      expect(response.transforms.length).toEqual(0);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'ATGAAC' + 'GAGATGA');
    });

    it('should error if length is not a multiple of 3', function() {
      setSequence('C');
      var response = validateRDPSequence(sequence);
      expect(response.success).toEqual(false);
      expect(response.errors.length).toEqual(1);
      expect(response.transforms.length).toEqual(0);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'C' + 'GAGATGA');
    });

    it('should transform all', function() {
      const LYSINE1 = 'AAA';
      const ARGININE = 'CGC';
      setSequence('GTGTAG' + LYSINE1);
      var response = validateRDPSequence(sequence);
      expect(response.success).toEqual(true);
      expect(response.errors.length).toEqual(0);
      expect(response.transforms.length).toEqual(3);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'ATG' + ARGININE + 'GAGATGA');
    });

    it('should stop at first error', function() {
      const LYSINE1 = 'AAA';
      setSequence('GTGTAG' + LYSINE1);
      var response = validateRDPSequence(sequence, false);
      expect(response.success).toEqual(false);
      expect(response.errors.length).toEqual(1);
      expect(response.transforms.length).toEqual(0);

      expect(sequence.getSequence(sequence.STICKY_END_FULL)).toEqual('CCAGA' + 'GTGTAG' + LYSINE1 + 'GAGATGA');
    });
  });
});
