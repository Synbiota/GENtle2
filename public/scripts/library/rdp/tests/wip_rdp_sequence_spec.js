import WipRdpPcrSequence from '../../../plugins/pcr/lib/wip_rdp_pcr_sequence';
import WipRdpOligoSequence from '../wip_rdp_oligo_sequence';
import RdpTypes from '../rdp_types';
import {
  stickyEndsXZ,
  stickyEndsZX,
} from './fixtures';


describe('WIP RDP sequence model', function() {
  it('should report as proteinCoding when CDS', function() {
    var sequenceModel = new WipRdpPcrSequence({
      sequence: 'AT',
      partType: RdpTypes.types.CDS,
    });
    expect(sequenceModel.isProteinCoding).toEqual(true);
  });

  it('should error if partType is invalid', function() {
    var model = new WipRdpPcrSequence({
      sequence: 'AT',
      partType: RdpTypes.types.PROTEIN_LINKER,
    });
    expect(model.validationError).toEqual('partType "PROTEIN_LINKER" is invalid for this sequenceModel');
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
  it('should transform oligo protein coding sequence', function() {
    var attributes = {
      sequence: 'GTGTAGAAATAG',
      partType: RdpTypes.types.PROTEIN_LINKER,
      desiredStickyEnds: stickyEndsZX(),
    };
    var sequenceModel = new WipRdpOligoSequence(attributes);
    attributes.frm = 0;
    attributes.size = 12;
    var compliantSequenceModel = sequenceModel.getRdpCompliantSequenceModel(attributes);
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
    var compliantSequenceModel = sequenceModel.getRdpCompliantSequenceModel(attributes);
    var data = compliantSequenceModel.toJSON();
    data.stickyEnds = stickyEndsZX();
    data.shortName = 'thing';
    var rdpSequenceModel = compliantSequenceModel.getRdpOligoSequence(data);
    expect(rdpSequenceModel.getSequence(rdpSequenceModel.STICKY_END_FULL)).toEqual('CGGCGTGTAGGATG');
  });
});
