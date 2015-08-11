import WipRdpPcrSequence from '../../../plugins/pcr/lib/wip_rdp_pcr_sequence';
import WipRdpOligoSequence from '../wip_rdp_oligo_sequence';
import RdpTypes from '../rdp_types';
import {
  stickyEndsXZ,
  stickyEndsZX,
} from './fixtures';
import idtMeltingTemperatureStub from '../../../plugins/pcr/tests/idt_stub';
import {stubOutIDTMeltingTemperature, restoreIDTMeltingTemperature} from '../../../plugins/pcr/lib/primer_calculation';


describe('WIP RDP sequence model', function() {
  it('should report as proteinCoding when CDS', function() {
    var sequenceModel = new WipRdpPcrSequence({
      sequence: 'AT',
      partType: RdpTypes.types.CDS,
    });
    expect(sequenceModel.isProteinCoding).toEqual(true);
  });

  it('should not error if partType is invalid', function() {
    var oldFunc = console.error;
    console.error = () => {};
    try {
      var model = new WipRdpPcrSequence({
        sequence: 'AT',
        partType: RdpTypes.types.PROTEIN_LINKER,
      });
      expect(model.validationError).toEqual(null);
    } finally {
      console.error = oldFunc;
    }
  });

  it('should not report as proteinCoding when Promoter', function() {
    var sequenceModel = new WipRdpOligoSequence({
      sequence: 'AT',
      partType: RdpTypes.types.PROMOTER,
    });
    expect(sequenceModel.get('partType')).toEqual(RdpTypes.types.PROMOTER);
    expect(sequenceModel.isProteinCoding).toEqual(false);
  });
});


describe('WIP RDP sequence transformation of', function() {
  // TODO NEXT:  Refactor WipRdp class functions to use same model attributes, etc.
  describe('PCR CDS RDP part', function() {
    beforeAll(function() {
      stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
    });

    afterAll(function() {
      restoreIDTMeltingTemperature();
    });

    var attributes, sequenceModel;
    beforeEach(function(done) {
      done();
    });

    var testGettingRdpPcrSequence = function(partType, expectedSequence, done) {
      var sequence = 'CCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACCC'+'TGATGA';
      attributes = {
        sequence,
      };
      sequenceModel = new WipRdpPcrSequence(attributes);
      // We test that the WIP model can updated and
      // `getWipRdpCompliantSequenceModel` yields the desired result
      sequenceModel.set({
        partType,
        desiredStickyEnds: stickyEndsXZ(),
        sourceSequenceName: 'The one before',
        frm: 0,
        size: sequence.length,
        shortName: 'sh',
      });
      var compliantSequenceModel = sequenceModel.getWipRdpCompliantSequenceModel();

      compliantSequenceModel.getRdpPcrSequenceModel()
      .then(function(rdpPcrSequenceModel) {
        var bases = rdpPcrSequenceModel.getSequence(rdpPcrSequenceModel.STICKY_END_FULL);
        expect(bases).toEqual(expectedSequence);
      })
      .catch(function(error) {
        // We should never get here.
        expect(error.toString()).toBeUndefined();
      })
      .done(done);
    };

    it('should work with fusion protein CDS part type', function(done) {
      testGettingRdpPcrSequence(RdpTypes.types.CDS, 'CGATG'+'CCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACCC'+'GGCTA', done);
    });

    it('should work with CDS_WITH_STOP part type', function(done) {
      testGettingRdpPcrSequence(RdpTypes.types.CDS_WITH_STOP, 'CGATG'+'CCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACCC'+'TGATGA'+'CGGCTA', done);
    });
  });

  describe('oligo RDP part', function() {
    it('should transform ZX oligo PROTEIN_LINKER sequence', function() {
      var sequenceModel = new WipRdpOligoSequence({sequence: 'GTGTAGAAATAG'});
      // We test that the WIP model can updated and
      // `getWipRdpCompliantSequenceModel` yields the desired result
      sequenceModel.set({
        partType: RdpTypes.types.PROTEIN_LINKER,
        desiredStickyEnds: stickyEndsZX(),
        frm: 0,
        size: 12,
        shortName: 'sh',
        sourceSequenceName: 'parent',
      });
      var compliantSequenceModel = sequenceModel.getWipRdpCompliantSequenceModel();
      var data = compliantSequenceModel.toJSON();
      data.stickyEnds = stickyEndsZX();
      data.shortName = 'thing';
      var rdpSequenceModel = compliantSequenceModel.getRdpOligoSequence(data);
      expect(rdpSequenceModel.getSequence(rdpSequenceModel.STICKY_END_FULL)).toEqual('CGGCGTGTAGAAGATG');
    });

    it('should transform XZ oligo MODIFIER sequence', function() {
      var sequenceModel = new WipRdpOligoSequence({sequence: 'GTGTAGAAATAG'});
      // We test that the WIP model can updated and
      // `getWipRdpCompliantSequenceModel` yields the desired result
      sequenceModel.set({
        partType: RdpTypes.types.MODIFIER,
        desiredStickyEnds: stickyEndsXZ(),
        frm: 0,
        size: 12,
        shortName: 'sh',
        sourceSequenceName: 'parent',
      });
      var compliantSequenceModel = sequenceModel.getWipRdpCompliantSequenceModel();
      var data = compliantSequenceModel.toJSON();
      data.stickyEnds = stickyEndsZX();
      data.shortName = 'thing';
      var rdpSequenceModel = compliantSequenceModel.getRdpOligoSequence(data);

      expect(rdpSequenceModel.getSequence(rdpSequenceModel.STICKY_END_FULL)).toEqual('GATGTAGCGCGGC');
    });

    it('should transform oligo promoter sequence', function() {
      var sequenceModel = new WipRdpOligoSequence({sequence: 'GTGTAG'});
      // We test that the WIP model can updated and
      // `getWipRdpCompliantSequenceModel` yields the desired result
      sequenceModel.set({
        partType: RdpTypes.types.PROMOTER,
        desiredStickyEnds: stickyEndsXZ(),
        frm: 0,
        size: 6,
        shortName: 'sh',
        sourceSequenceName: 'parent',
      });
      var compliantSequenceModel = sequenceModel.getWipRdpCompliantSequenceModel();
      var data = compliantSequenceModel.toJSON();
      data.stickyEnds = stickyEndsZX();
      data.shortName = 'thing';
      var rdpSequenceModel = compliantSequenceModel.getRdpOligoSequence(data);
      expect(rdpSequenceModel.getSequence(rdpSequenceModel.STICKY_END_FULL)).toEqual('GATGGTGTAGCGGC');
    });
  });
});
