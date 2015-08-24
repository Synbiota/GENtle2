import _ from 'underscore';
import {stubSequenceModelSaves, restoreSequenceModelSaves} from '../../../common/tests/stubs';
import WipRdpPcrSequence from '../../../plugins/pcr/lib/wip_rdp_pcr_sequence';
import WipRdpOligoSequence from '../wip_rdp_oligo_sequence';
import WipRdpReadyPcrSequence from '../wip_rdp_ready_pcr_sequence';
import WipRdpReadyOligoSequence from '../wip_rdp_ready_oligo_sequence';
import RdpTypes from '../rdp_types';
import {
  stickyEndsXZ,
  stickyEndsZX,
} from './fixtures';
import idtMeltingTemperatureStub from '../../../plugins/pcr/tests/idt_stub';
import {stubOutIDTMeltingTemperature, restoreIDTMeltingTemperature} from '../../../plugins/pcr/lib/primer_calculation';
import SequenceTransforms from 'gentle-sequence-transforms';


describe('WIP RDP sequence transformation of', function() {
  beforeAll(function() {
    // Need to set class name attributes as CircleCi doesn't work properly
    WipRdpReadyPcrSequence.className = 'WipRdpReadyPcrSequence';
    WipRdpReadyOligoSequence.className = 'WipRdpReadyOligoSequence';

    stubSequenceModelSaves(WipRdpReadyPcrSequence);
    stubSequenceModelSaves(WipRdpReadyOligoSequence);
  });

  afterAll(function() {
    restoreSequenceModelSaves(WipRdpReadyPcrSequence);
    restoreSequenceModelSaves(WipRdpReadyOligoSequence);
  });

  var sequenceModel;
  var testGettingRdpSequence = function(ModelClass, attributes, expectations, done=(()=>{})) {
    attributes = _.defaults(attributes, {
      sequence: 'GTGCCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACCT'+'TGATGA',
    });
    sequenceModel = new ModelClass({sequence: attributes.sequence});
    // We test that the WIP model can updated
    attributes = _.defaults(attributes, {
      partType: attributes.partType,
      desiredStickyEnds: stickyEndsXZ(),
      sourceSequenceName: 'The one before',
      frm: 0,
      size: attributes.sequence.length,
      shortName: 'sh',
    });
    sequenceModel.set(attributes);

    // Now test that `getWipRdpCompliantSequenceModel` and its
    // `getRdpSequenceModel` yields the desired result
    var compliantSequenceModel = sequenceModel.getWipRdpCompliantSequenceModel();
    expect(compliantSequenceModel.errors()).toEqual([]);

    compliantSequenceModel.getRdpSequenceModel()
    .then(function(rdpSequenceModel) {
      var bases = rdpSequenceModel.getSequence(rdpSequenceModel.STICKY_END_FULL);
      var expectBases = function(expectionKey) {
        expect(bases).toEqual(expectations[expectionKey], expectionKey + ' is incorrect');
        delete expectations[expectionKey];
      };
      expectBases('sequence');

      // rdpSequenceModel specific tests
      if(expectations.forwardPrimerSequence) {
        bases = rdpSequenceModel.get('forwardPrimer').getSequence();
        expectBases('forwardPrimerSequence');
      }
      if(expectations.forwardPrimerAnnealingRegionSequence) {
        bases = rdpSequenceModel.get('forwardPrimer').annealingRegion.getSequence();
        expectBases('forwardPrimerAnnealingRegionSequence');
      }
      if(expectations.reversePrimerSequenceReverseComplement) {
        bases = SequenceTransforms.toReverseComplements(rdpSequenceModel.get('reversePrimer').getSequence());
        expectBases('reversePrimerSequenceReverseComplement');
      }
      if(expectations.reversePrimerAnnealingRegionSequenceReverseComplement) {
        bases = SequenceTransforms.toReverseComplements(rdpSequenceModel.get('reversePrimer').annealingRegion.getSequence());
        expectBases('reversePrimerAnnealingRegionSequenceReverseComplement');
      }

      // Just check we don't have any untested expectations
      var unassessedExpectations = _.keys(expectations);
      expect(unassessedExpectations.length).toEqual(0, `${unassessedExpectations.length} unassessed expectations: '${unassessedExpectations}'`);
    })
    .catch(function(error) {
      // We should never get here.
      expect(error.toString()).toEqual('getRdpSequenceModel should return successfully and not error');
    })
    .finally(done)
    .done();
  };

  describe('PCR RDP part', function() {
    beforeAll(function() {
      stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
    });

    afterAll(function() {
      restoreIDTMeltingTemperature();
    });

    beforeEach(function(done) {
      done();
    });

    var testGettingRdpPcrSequence = _.partial(testGettingRdpSequence, WipRdpPcrSequence);

    describe('with fusion protein CDS part type', function() {
      it('should convert last codon CCT into CCC', function(done) {
        var attributes = {
          partType: RdpTypes.types.CDS,
        };
        var expectations = {
          sequence: 'GGATG'+'CCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACC'+'CGGCTA',
        };
        testGettingRdpPcrSequence(attributes, expectations, done);
      });

      it('should convert first codon GTG into ATG and ATG into CTC', function(done) {
        // Note: for `forwardPrimerAnnealingRegionSequence` the first A of:
        // 'GGATG'+'CCC...' is different to the original sequence of
        //   'GTGCCC...' which has a G, so the A should NOT be in the annealing
        // region but the TG should be
        
        // Note: for `reversePrimerAnnealingRegionSequenceReverseComplement`
        // the last CT of:
        // '...CCCGGGCT'+'...' is different to the original sequence of:
        // '...CCCGGGATG' which has AT, so the CT should NOT be in the
        // annealing region

        var initialSequence = 
               'GTGCCCTGACCCAAACCCAAACCCAAACCCAAACCCGGGATG'+'TGATGA';
        var expectedPcrProductSequence = 
          'GGATG'+'CCCTGACCCAAACCCAAACCCAAACCCAAACCCGGGCT'+'CGGCTA';
        var forwardPrimerAnnealingRegionSequence = 
             'TG'+'CCCTGACCCAAACCCAAAC';
        var forwardPrimerSequence =
          'GGATG'+'CCCTGACCCAAACCCAAAC';
        var reversePrimerAnnealingRegionSequenceReverseComplement =
                                   'ACCCAAACCCAAACCCGGG';
        var reversePrimerSequenceReverseComplement = 
                                   'ACCCAAACCCAAACCCGGGCT'+'CGGCTA';

        var attributes = {
          partType: RdpTypes.types.CDS,
          sequence: initialSequence,
        };
        var expectations = {
          sequence: expectedPcrProductSequence,
          forwardPrimerAnnealingRegionSequence,
          forwardPrimerSequence,
          reversePrimerAnnealingRegionSequenceReverseComplement,
          reversePrimerSequenceReverseComplement,
        };
        testGettingRdpPcrSequence(attributes, expectations, done);
      });
    });

    it('should work with CDS_WITH_STOP part type', function(done) {
      var attributes = {
        partType: RdpTypes.types.CDS_WITH_STOP,
      };
      var expectations = {
        sequence: 'GGATG'+'CCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACCT'+'TGATGA'+'CGGCTA',
      };
      testGettingRdpPcrSequence(attributes, expectations, done);
    });

    describe('with PROMOTER part type', function() {
      it("should handle X-Z'", function(done) {
        var attributes = {
          partType: RdpTypes.types.PROMOTER,
        };
        var expectations = {
          sequence: 'GGATG'+'GTGCCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACCT'+'TGATGA'+'CGGCTA',
        };
        testGettingRdpPcrSequence(attributes, expectations, done);
      });

      it("should handle Z-X'", function(done) {
        var attributes = {
          partType: RdpTypes.types.PROMOTER,
          desiredStickyEnds: stickyEndsZX(),
        };
        var expectations = {
          sequence: 'GCGGC'+'GTGCCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACCTTGATGA'+'GATGTA',
        };
        testGettingRdpPcrSequence(attributes, expectations, done);
      });
    });

    it("should work with protein coding MODIFIER part type with Z-X' stickyEnds", function(done) {
      var attributes = {
        partType: RdpTypes.types.MODIFIER,
        desiredStickyEnds: stickyEndsZX(),
      };
      var expectations = {
        sequence: 'GCGGC'+'GTGCCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACC'+'GATGTA',
      };
      testGettingRdpPcrSequence(attributes, expectations, done);
    });
    
    it('should test to and from', function(done) {
      var attributes = {
        partType: RdpTypes.types.CDS,
        frm: 6,
        size: 30
      };
      var expectations = {
        sequence: 'GGATG'+'TGACCCAAACCCAAACCCAAACCCAAACC'+'CGGCTA',
      };
      testGettingRdpPcrSequence(attributes, expectations, done);
    });
  });

  describe('oligo RDP part', function() {
    var testGettingRdpOligoSequence = _.partial(testGettingRdpSequence, WipRdpOligoSequence);

    it('should transform ZX oligo PROTEIN_LINKER sequence', function() {
      var attributes = {
        sequence: 'GTGTAGAAATAG',
        partType: RdpTypes.types.PROTEIN_LINKER,
        desiredStickyEnds: stickyEndsZX(),
      };
      var expectations = {
        sequence: 'CGGCGTGTAGAAGATG',
      };
      testGettingRdpOligoSequence(attributes, expectations);
    });

    it('should transform XZ oligo MODIFIER sequence', function() {
      var attributes = {
        sequence: 'GTGTAGAAATAG',
        partType: RdpTypes.types.MODIFIER,
      };
      var expectations = {
        sequence: 'GATGTAGCGCGGC',
      };
      testGettingRdpOligoSequence(attributes, expectations);
    });

    it('should transform oligo promoter sequence', function() {
      var attributes = {
        sequence: 'GTGTAG',
        partType: RdpTypes.types.PROMOTER,
      };
      var expectations = {
        sequence: 'GATGGTGTAGCGGC',
      };
      testGettingRdpOligoSequence(attributes, expectations);
    });

    it('should test to and from', function() {
      var attributes = {
        sequence: 'GTGTAGAAATAG',
        partType: RdpTypes.types.PROTEIN_LINKER,
        desiredStickyEnds: stickyEndsZX(),
        frm: 3,
        size: 6,
      };
      var expectations = {
        sequence: 'CGGCTAGAAGATG',
      };
      testGettingRdpOligoSequence(attributes, expectations);
    });
  });
});
