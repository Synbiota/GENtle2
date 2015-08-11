import {stubCurrentUser} from '../../../common/tests/stubs';
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


var pcrSequenceModel, oligoSequenceModel, rdpEdits;

var makeSequence = function(Klass, bases, desiredStickyEnds=stickyEndsXZ(), partType=undefined) {
  var attributes = sequenceAttributes();
  attributes.sequence = bases;
  attributes.desiredStickyEnds = desiredStickyEnds;
  attributes.partType = partType;
  attributes.size = attributes.sequence.length;
  var sequenceModel = new Klass(attributes);
  spyOn(sequenceModel, 'save');
  spyOn(sequenceModel, 'throttledSave');
  rdpEdits = sequenceModel.get('rdpEdits');
  return sequenceModel;
};

var makePcrSequence = function(bases, desiredStickyEnds=undefined, partType=RdpTypes.types.CDS) {
  pcrSequenceModel = makeSequence(WipRdpReadyPcrSequence, bases, desiredStickyEnds, partType);
  return pcrSequenceModel;
};

var makeOligoSequence = function(bases, desiredStickyEnds=undefined, partType=RdpTypes.types.PROMOTER) {
  oligoSequenceModel = makeSequence(WipRdpReadyOligoSequence, bases, desiredStickyEnds, partType);
  return oligoSequenceModel;
};


var getPcrSequence = function() {
  return pcrSequenceModel.getSequence(pcrSequenceModel.STICKY_END_FULL);
};

var getOligoSequence = function() {
  return oligoSequenceModel.getSequence(oligoSequenceModel.STICKY_END_FULL);
};


describe('RDP sequence transforms', function() {
  beforeAll(function() {
    stubCurrentUser();
  });

  describe('calculateTransformationFunctionInstances', function() {
    describe('for RDP PCR', function() {
      it("Fusion Protein CDS X-Z'", function() {
        makePcrSequence('AAT', stickyEndsXZ(), RdpTypes.types.CDS);
        var transforms = calculateTransformationFunctionInstances(pcrSequenceModel);
        expect(transforms.length).toEqual(4);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_C);
        expect(transforms[3].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("CDS with STOP X-Z'", function() {
        makePcrSequence('AATTGA', stickyEndsXZ(), RdpTypes.types.CDS_WITH_STOP);
        var transforms = calculateTransformationFunctionInstances(pcrSequenceModel);
        expect(transforms.length).toEqual(3);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_CODON_IS_STOP);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Modifier X-Z'", function() {
        makePcrSequence('AAT', stickyEndsXZ(), RdpTypes.types.MODIFIER);
        var transforms = calculateTransformationFunctionInstances(pcrSequenceModel);
        expect(transforms.length).toEqual(4);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_C);
        expect(transforms[3].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Modifier Z-X'", function() {
        makePcrSequence('AAT', stickyEndsZX(), RdpTypes.types.MODIFIER);
        var transforms = calculateTransformationFunctionInstances(pcrSequenceModel);
        expect(transforms.length).toEqual(3);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_G);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Other X-Z'", function() {
        makePcrSequence('AAT', stickyEndsXZ(), RdpTypes.types.OTHER);
        var transforms = calculateTransformationFunctionInstances(pcrSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Other Z-X'", function() {
        makePcrSequence('AAT', stickyEndsZX(), RdpTypes.types.OTHER);
        var transforms = calculateTransformationFunctionInstances(pcrSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });
    });


    describe('for RDP oligo', function() {
      it("RBS Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.RBS);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(1);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.FIRST_CODON_IS_STOP);
      });

      it("Terminator Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.TERMINATOR);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(1);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.FIRST_CODON_IS_STOP);
      });

      it("Modifier X-Z'", function() {
        makeOligoSequence('AAT', stickyEndsXZ(), RdpTypes.types.MODIFIER);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(4);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.METHIONINE_START_CODON);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_C);
        expect(transforms[3].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Modifier Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.MODIFIER);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(3);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_G);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Protein linker Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.PROTEIN_LINKER);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(3);
        expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.LAST_STOP_CODONS_REMOVED);
        expect(transforms[1].rdpEditType).toEqual(RdpEdit.types.LAST_BASE_IS_G);
        expect(transforms[2].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Promoter X-Z'", function() {
        makeOligoSequence('AAT', stickyEndsXZ(), RdpTypes.types.PROMOTER);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Promoter Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.PROMOTER);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Operator X-Z'", function() {
        makeOligoSequence('AAT', stickyEndsXZ(), RdpTypes.types.OPERATOR);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Operator Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.OPERATOR);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Other X-Z'", function() {
        makeOligoSequence('AAT', stickyEndsXZ(), RdpTypes.types.OTHER);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });

      it("Other Z-X'", function() {
        makeOligoSequence('AAT', stickyEndsZX(), RdpTypes.types.OTHER);
        var transforms = calculateTransformationFunctionInstances(oligoSequenceModel);
        expect(transforms.length).toEqual(0);
        // expect(transforms[0].rdpEditType).toEqual(RdpEdit.types.EARLY_STOP_CODON);
      });
    });
  });


  describe('all RDP sequence validation and transformation', function() {
    describe('invalid sequence', function() {
      it('should throw an error if no desiredStickyEnds are present', function() {
        expect(function() {
          var attributes = sequenceAttributes();
          delete attributes.desiredStickyEnds;
          new WipRdpReadyPcrSequence(attributes);
        }).toThrowError(TypeError, 'WipRdpReadyPcrSequence is missing the following attributes: desiredStickyEnds');
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
        it('should throw an error if an invalid desiredStickyEnd is provided', function() {
          var attributes = sequenceAttributes();
          attributes.desiredStickyEnds = stickyEndsZX();
          expect(function() {
            new WipRdpReadyPcrSequence(attributes);
          }).toThrowError(TypeError, 'Invalid desiredStickyEnd: "Z-X\'"');
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
        it('should throw an error if an invalid desiredStickyEnd is provided', function() {
          var attributes = sequenceAttributes();
          attributes.desiredStickyEnds = stickyEndsXZ();
          attributes.partType = RdpTypes.types.PROTEIN_LINKER;
          expect(function() {
            new WipRdpReadyOligoSequence(attributes);
          }).toThrowError(TypeError, 'Invalid desiredStickyEnd: "X-Z\'"');
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

        expect(getPcrSequence()).toEqual('AC');
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


    describe('sequence possible to make RDP compliant', function() {
      it('if no transformations to make', function() {
        makePcrSequence('ATGAAC');

        expect(rdpEdits.length).toEqual(0);
        expect(getPcrSequence()).toEqual('ATGAAC');
      });

      it('should transform all', function() {
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

        expect(getPcrSequence()).toEqual('ATGTAG' + ARGININE);
      });

      it('should transform all 2', function() {
        makePcrSequence('ACCTGTTTTAAAAAT', stickyEndsXZ(), RdpTypes.types.CDS);

        expect(rdpEdits.length).toEqual(2);
        expect(rdpEdits[0].type).toEqual(RdpEdit.types.METHIONINE_START_CODON_ADDED);
        expect(rdpEdits[0].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[1].type).toEqual(RdpEdit.types.LAST_BASE_IS_C_NO_AA_CHANGE);
        expect(rdpEdits[1].level).toEqual(RdpEdit.levels.NORMAL);

        expect(getPcrSequence()).toEqual('ATGACCTGTTTTAAAAAC');
      });

      it('should transform CDS_WITH_STOP with multiple stops', function() {
        makePcrSequence('CCCTGACCCTGATGA', stickyEndsXZ(), RdpTypes.types.CDS_WITH_STOP);
        expect(rdpEdits.length).toEqual(2);
        expect(rdpEdits[0].type).toEqual(RdpEdit.types.METHIONINE_START_CODON_ADDED);
        expect(rdpEdits[0].level).toEqual(RdpEdit.levels.NORMAL);
        expect(rdpEdits[1].type).toEqual(RdpEdit.types.EARLY_STOP_CODON);
        expect(rdpEdits[1].level).toEqual(RdpEdit.levels.WARN);

        expect(getPcrSequence()).toEqual('ATGCCCTGACCCTGATGA');
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

        expect(getPcrSequence()).toEqual('ATGCCCTGACCCTAG');
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

        expect(getOligoSequence()).toEqual('GTGTAGAAG');
      });
    });
  });
});
