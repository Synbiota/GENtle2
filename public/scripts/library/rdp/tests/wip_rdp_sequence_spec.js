import WipRdpPcrSequence from '../../../plugins/pcr/lib/wip_rdp_pcr_sequence';
import WipRdpOligoSequence from '../wip_rdp_oligo_sequence';
import RdpTypes from '../rdp_types';


describe('WIP RDP sequence model', function() {
  it('should report as proteinCoding when CDS', function() {
    var sequenceModel = new WipRdpPcrSequence({
      sequence: 'AT',
      partType: RdpTypes.types.CDS,
    });
    expect(sequenceModel.isProteinCoding).toEqual(true);
  });

  it('should error if partType is invalid', function() {
    expect(function() {
      new WipRdpPcrSequence({
        sequence: 'AT',
        partType: RdpTypes.types.PROMOTER,
      });
    }).toThrowError(Error, 'partType "PROMOTER" is invalid for this sequenceModel');
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
