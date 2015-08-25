import {stubCurrentUser, stubSequenceModelSaves, restoreSequenceModelSaves} from '../../../common/tests/stubs';
import WipRdpReadyPcrSequence from '../wip_rdp_ready_pcr_sequence';
import WipRdpReadyOligoSequence from '../wip_rdp_ready_oligo_sequence';
import RdpEdit from '../rdp_edit';
import RdpTypes from '../rdp_types';
import {
  stickyEndsXZ,
  stickyEndsZX,
} from './fixtures';

import {
  calculateTransformationFunctionInstances,
} from '../rdp_sequence_transform';


var initialSequenceContent = 'GTGTAG';

var sequenceAttributes = function() {
  return {
    sourceSequenceName: 'Parent test sequence',
    name: 'Test sequence',
    shortName: 'ts',
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
    desiredStickyEnds: stickyEndsXZ(),
    frm: 0,
    size: initialSequenceContent.length,
    partType: RdpTypes.types.CDS,
  };
};


var mockRdpReadyPcrSequenceModel, mockRdpReadyOligoSequenceModel, rdpEdits;

var makeSequence = function(Klass, bases, desiredStickyEnds=stickyEndsXZ(), partType=undefined) {
  var attributes = sequenceAttributes();
  attributes.sequence = bases;
  attributes.desiredStickyEnds = desiredStickyEnds;
  attributes.partType = partType;
  attributes.size = attributes.sequence.length;
  var sequenceModel = new Klass(attributes);
  rdpEdits = sequenceModel.get('rdpEdits');
  return sequenceModel;
};

var makePcrSequence = function(bases, desiredStickyEnds=undefined, partType=RdpTypes.types.CDS) {
  mockRdpReadyPcrSequenceModel = makeSequence(WipRdpReadyPcrSequence, bases, desiredStickyEnds, partType);
};

var makeOligoSequence = function(bases, desiredStickyEnds=undefined, partType=RdpTypes.types.PROMOTER) {
  mockRdpReadyOligoSequenceModel = makeSequence(WipRdpReadyOligoSequence, bases, desiredStickyEnds, partType);
};


var FULL = WipRdpReadyPcrSequence.STICKY_END_FULL;

var getPcrSequenceBases = function(format=FULL) {
  return mockRdpReadyPcrSequenceModel.getSequence(format);
};

var getOligoSequenceBases = function(format=FULL) {
  return mockRdpReadyOligoSequenceModel.getSequence(format);
};


var stubClassFunction = function(Klass, functionName) {
  var oldFunction = Klass.prototype[functionName];
  Klass.prototype[functionName] = () => {};
  var unstub = function() {
    Klass.prototype[functionName] = oldFunction;
  };
  return unstub;
};


describe('RDP sequence transforms', function() {
  var unstubPcr;
  var unstubOligo;

  beforeAll(function() {
    // Need to set class name attributes as CircleCi doesn't work properly
    WipRdpReadyPcrSequence.className = 'WipRdpReadyPcrSequence';
    WipRdpReadyOligoSequence.className = 'WipRdpReadyOligoSequence';

    stubSequenceModelSaves(WipRdpReadyPcrSequence);
    stubSequenceModelSaves(WipRdpReadyOligoSequence);
    stubCurrentUser();
  });

  afterAll(function() {
    restoreSequenceModelSaves(WipRdpReadyPcrSequence);
    restoreSequenceModelSaves(WipRdpReadyOligoSequence);
  });

  describe('calculateTransformationFunctionInstances', function() {
    beforeAll(function() {
      unstubPcr = stubClassFunction(WipRdpReadyPcrSequence, '_transformSequenceForRdp');
      unstubOligo = stubClassFunction(WipRdpReadyOligoSequence, '_transformSequenceForRdp');
    });

    afterAll(function() {
      unstubPcr();
      unstubOligo();
    });

    describe('for RDP PCR', function() {
      it("Fusion Protein CDS X-Z'", function() {
        makePcrSequence('AAT', stickyEndsXZ(), RdpTypes.types.CDS);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyPcrSequenceModel);
        expect(transforms.length).toEqual(4);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_C);
        expect(transforms[3].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("CDS with STOP X-Z'", function() {
        makePcrSequence('AATTGA', stickyEndsXZ(), RdpTypes.types.CDS_WITH_STOP);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyPcrSequenceModel);
        expect(transforms.length).toEqual(3);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_CODON_IS_STOP);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Modifier X-Z'", function() {
        makePcrSequence('AAT', stickyEndsXZ(), RdpTypes.types.MODIFIER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyPcrSequenceModel);
        expect(transforms.length).toEqual(4);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_C);
        expect(transforms[3].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Modifier Z-X'", function() {
        makePcrSequence('AAT', stickyEndsZX(), RdpTypes.types.MODIFIER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyPcrSequenceModel);
        expect(transforms.length).toEqual(3);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_G);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Other X-Z'", function() {
        makePcrSequence('AAT', stickyEndsXZ(), RdpTypes.types.OTHER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyPcrSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Other Z-X'", function() {
        makePcrSequence('AAT', stickyEndsZX(), RdpTypes.types.OTHER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyPcrSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });
    });


    describe('for RDP oligo', function() {
      it("RBS Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.RBS);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(1);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.FIRST_CODON_IS_STOP);
      });

      it("Terminator Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.TERMINATOR);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(1);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.FIRST_CODON_IS_STOP);
      });

      it("Modifier X-Z'", function() {
        makeOligoSequence('AAT', stickyEndsXZ(), RdpTypes.types.MODIFIER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(4);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_C);
        expect(transforms[3].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Modifier Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.MODIFIER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(3);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_G);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Protein linker Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.PROTEIN_LINKER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(3);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_G);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Promoter X-Z'", function() {
        makeOligoSequence('AAT', stickyEndsXZ(), RdpTypes.types.PROMOTER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Promoter Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.PROMOTER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Operator X-Z'", function() {
        makeOligoSequence('AAT', stickyEndsXZ(), RdpTypes.types.OPERATOR);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Operator Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.OPERATOR);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Other X-Z'", function() {
        makeOligoSequence('AAT', stickyEndsXZ(), RdpTypes.types.OTHER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Other Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.OTHER);
        var transforms = calculateTransformationFunctionInstances(mockRdpReadyOligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });
    });
  });


  describe('all RDP sequence validation and transformation', function() {
    describe('invalid sequence', function() {
      var oldConsoleErrorFunction;
      beforeAll(function() {
        oldConsoleErrorFunction = console.error;
        console.error = () => {};
      });

      afterAll(function() {
        console.error = oldConsoleErrorFunction;
      });

      it('should throw an error if no desiredStickyEnds are present', function() {
        expect(function() {
          var attributes = sequenceAttributes();
          delete attributes.desiredStickyEnds;
          new WipRdpReadyPcrSequence(attributes);
        }).toThrowError(TypeError, /(WipRdpReadyPcrSequence)? is missing the following attributes: desiredStickyEnds/);
      });

      it('should throw an error if last base is unsupported', function() {
        var desiredStickyEnds = stickyEndsXZ();
        desiredStickyEnds.end.sequence = 'T';
        desiredStickyEnds.end.offset = 0;
        desiredStickyEnds.end.size = 1;
        var attributes = sequenceAttributes();
        attributes.desiredStickyEnds = desiredStickyEnds;
        attributes.sequence = 'ATGAAT';
        expect(function() {
          new WipRdpReadyPcrSequence(attributes);
        }).toThrowError(TypeError, 'ensureLastBaseIs does not yet support base of: "T"');
      });

      describe('PCR sequence', function() {
        it('should throw an error if an invalid desiredStickyEnds is provided', function() {
          var attributes = sequenceAttributes();
          attributes.desiredStickyEnds = stickyEndsZX();
          expect(function() {
            new WipRdpReadyPcrSequence(attributes);
          }).toThrowError(TypeError, 'Invalid desiredStickyEnds: "Z-X\'"');
        });

        it('should throw an error if an invalid partType is provided', function() {
          var attributes = sequenceAttributes();
          attributes.partType = RdpTypes.types.PROTEIN_LINKER;
          expect(function() {
            new WipRdpReadyPcrSequence(attributes);
          }).toThrowError(TypeError, 'Invalid partType: "PROTEIN_LINKER"');
        });
      });

      describe('oligo sequence', function() {
        it('should throw an error if an invalid desiredStickyEnds is provided', function() {
          var attributes = sequenceAttributes();
          attributes.desiredStickyEnds = stickyEndsXZ();
          attributes.partType = RdpTypes.types.PROTEIN_LINKER;
          expect(function() {
            new WipRdpReadyOligoSequence(attributes);
          }).toThrowError(TypeError, 'Invalid desiredStickyEnds: "X-Z\'"');
        });

        it('should throw an error if an invalid partType is provided', function() {
          var attributes = sequenceAttributes();
          attributes.partType = RdpTypes.types.CDS;
          expect(function() {
            new WipRdpReadyOligoSequence(attributes);
          }).toThrowError(TypeError, 'Invalid partType: "CDS"');
        });
      });
    });


    describe('sequence impossible to make RDP compliant', function() {
      it('should error if length is not a multiple of 3 and sequence is too short', function() {
        makePcrSequence('AC');

        expect(rdpEdits.length).toEqual(2);
        expect(rdpEdits[0].type).toEqual(RdpEdit.types.SEQUENCE_TOO_SHORT);
        expect(rdpEdits[0].level).toEqual(RdpEdit.levels.ERROR);
        expect(rdpEdits[1].type).toEqual(RdpEdit.types.NOT_MULTIPLE_OF_3);
        expect(rdpEdits[1].level).toEqual(RdpEdit.levels.ERROR);

        expect(getPcrSequenceBases()).toEqual('AC');
      });

      it('should error if stickyEnds are present', function() {
        var attributes = sequenceAttributes();
        var stickyEndz = attributes.desiredStickyEnds;
        attributes.stickyEnds = stickyEndz;
        attributes.sequence = stickyEndz.start.sequence + 'ATAC' + stickyEndz.end.sequence;
        expect(function() {
          new WipRdpReadyPcrSequence(attributes);
        }).toThrowError(TypeError, 'attributes for WipRdpSequence and subclasses must not contain "stickyEnds"');
      });
    });


    describe('sequence possible to make RDP compliant (before sticky ends added)', function() {
      beforeAll(function() {
        unstubPcr = stubClassFunction(WipRdpReadyPcrSequence, '_addRdpStickyEnds');
        unstubOligo = stubClassFunction(WipRdpReadyOligoSequence, '_addRdpStickyEnds');
      });

      afterAll(function() {
        unstubPcr();
        unstubOligo();
      });

      it('if no transformations to make', function() {
        makePcrSequence('ATGAAC');

        expect(rdpEdits.length).toEqual(0);
        expect(getPcrSequenceBases()).toEqual('ATGAAC');
      });

      it('should transform Fusion protein CDS with conversion of start codon', function() {
        const LYSINE1 = 'AAA';
        const ARGININE = 'CGC';
        makePcrSequence('GTGTAG' + LYSINE1);

        expect(rdpEdits.length).toEqual(3);
        expect(rdpEdits[0].type).toEqual(RdpEdit.types.METHIONINE_START_CODON_CONVERTED);
        expect(rdpEdits[0].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[1].type).toEqual(RdpEdit.types.LAST_BASE_IS_C);
        expect(rdpEdits[1].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[2].type).toEqual(RdpEdit.types.EARLY_STOP_CODON);
        expect(rdpEdits[2].level).toEqual(RdpEdit.levels.WARN);

        expect(getPcrSequenceBases()).toEqual('ATGTAG' + ARGININE);
      });

      it('should transform Fusion protein CDS with addition of start codon', function() {
        makePcrSequence('ACCTGTTTTAAAAAT');

        expect(rdpEdits.length).toEqual(2);
        expect(rdpEdits[0].type).toEqual(RdpEdit.types.METHIONINE_START_CODON_ADDED);
        expect(rdpEdits[0].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[1].type).toEqual(RdpEdit.types.LAST_BASE_IS_C_NO_AA_CHANGE);
        expect(rdpEdits[1].level).toEqual(RdpEdit.levels.NORMAL);

        expect(getPcrSequenceBases()).toEqual('ATGACCTGTTTTAAAAAC');
      });

      it('should transform CDS_WITH_STOP with multiple stops', function() {
        makePcrSequence('CCCTGACCCTGATGA', stickyEndsXZ(), RdpTypes.types.CDS_WITH_STOP);
        expect(rdpEdits.length).toEqual(2);
        expect(rdpEdits[0].type).toEqual(RdpEdit.types.METHIONINE_START_CODON_ADDED);
        expect(rdpEdits[0].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[1].type).toEqual(RdpEdit.types.EARLY_STOP_CODON);
        expect(rdpEdits[1].level).toEqual(RdpEdit.levels.WARN);

        expect(getPcrSequenceBases()).toEqual('ATGCCCTGACCCTGATGA');
      });

      it('should transform CDS_WITH_STOP with no STOP codon as last codon', function() {
        makePcrSequence('CCCTGACCC', stickyEndsXZ(), RdpTypes.types.CDS_WITH_STOP);
        expect(rdpEdits.length).toEqual(3);
        expect(rdpEdits[0].type).toEqual(RdpEdit.types.METHIONINE_START_CODON_ADDED);
        expect(rdpEdits[0].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[1].type).toEqual(RdpEdit.types.LAST_CODON_IS_STOP_ADDED);
        expect(rdpEdits[1].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[2].type).toEqual(RdpEdit.types.EARLY_STOP_CODON);
        expect(rdpEdits[2].level).toEqual(RdpEdit.levels.WARN);

        expect(getPcrSequenceBases()).toEqual('ATGCCCTGACCCTAG');
      });

      it('should transform oligo', function() {
        makeOligoSequence('GTGTAGAAATAG', stickyEndsZX(), RdpTypes.types.PROTEIN_LINKER);
        expect(rdpEdits.length).toEqual(3);
        expect(rdpEdits[0].type).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(rdpEdits[0].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[1].type).toEqual(RdpEdit.types.LAST_BASE_IS_G_NO_AA_CHANGE);
        expect(rdpEdits[1].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[2].type).toEqual(RdpEdit.types.EARLY_STOP_CODON);
        expect(rdpEdits[2].level).toEqual(RdpEdit.levels.WARN);

        expect(getOligoSequenceBases()).toEqual('GTGTAGAAG');
      });
    });
  });
});
