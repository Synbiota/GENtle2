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


describe('RDP sequence transformation', function() {
  // TODO NEXT:  Refactor WipRdp class functions to use same model attributes, etc.
  describe('transform PCR CDS RDP part', function() {
    beforeAll(function() {
      stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);
    });

    afterAll(function() {
      restoreIDTMeltingTemperature();
    });

    var attributes, sequenceModel;
    beforeEach(function(done) {
      attributes = {
        sequence: 'CCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACCC'+'TGATGA',
        partType: RdpTypes.types.CDS,
      };
      sequenceModel = new WipRdpPcrSequence(attributes);
      _.extend(attributes, {
        desiredStickyEnds: stickyEndsXZ(),
        sourceSequenceName: 'The one before',
        frm: 0,
        size: 45,
      });
      done();
    });

    var testGettingRdpPcrSequence = function(partType, expectedSequence, done) {
      attributes.partType = partType;
      var compliantSequenceModel = sequenceModel.getWipRdpCompliantSequenceModel(attributes);

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

  it('should transform oligo protein coding sequence', function() {
    var attributes = {
      sequence: 'GTGTAGAAATAG',
      partType: RdpTypes.types.PROTEIN_LINKER,
      desiredStickyEnds: stickyEndsZX(),
    };
    var sequenceModel = new WipRdpOligoSequence(attributes);
    attributes.frm = 0;
    attributes.size = 12;
    var compliantSequenceModel = sequenceModel.getWipRdpCompliantSequenceModel(attributes);
    var data = compliantSequenceModel.toJSON();
    data.stickyEnds = stickyEndsZX();
    data.shortName = 'thing';
    var rdpSequenceModel = compliantSequenceModel.getRdpOligoSequence(data);
    expect(rdpSequenceModel.getSequence(rdpSequenceModel.STICKY_END_FULL)).toEqual('CGGCGTGTAGAAGATG');
  });

  it('should transform oligo promoter sequence', function() {
    var attributes = {
      sequence: 'GTGTAG',
      partType: RdpTypes.types.PROMOTER,
      desiredStickyEnds: stickyEndsZX(),
    };
    var sequenceModel = new WipRdpOligoSequence(attributes);
    attributes.frm = 0;
    attributes.size = 12;
    var compliantSequenceModel = sequenceModel.getWipRdpCompliantSequenceModel(attributes);
    var data = compliantSequenceModel.toJSON();
    data.stickyEnds = stickyEndsZX();
    data.shortName = 'thing';
    var rdpSequenceModel = compliantSequenceModel.getRdpOligoSequence(data);
    expect(rdpSequenceModel.getSequence(rdpSequenceModel.STICKY_END_FULL)).toEqual('CGGCGTGTAGGATG');
  });
});
