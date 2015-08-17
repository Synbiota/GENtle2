import _ from 'underscore';
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

  it('should not error if partType is invalid', function() {
    var model = new WipRdpPcrSequence({
      sequence: 'AT',
      partType: RdpTypes.types.PROTEIN_LINKER,
    });
    expect(model.validationError).toEqual(null);
  });

  it('should not report as proteinCoding when Promoter', function() {
    var sequenceModel = new WipRdpOligoSequence({
      sequence: 'AT',
      partType: RdpTypes.types.PROMOTER,
    });
    expect(sequenceModel.get('partType')).toEqual(RdpTypes.types.PROMOTER);
    expect(sequenceModel.isProteinCoding).toEqual(false);
  });

  it('WipRdpPcrSequence should instantiate with only sequence and be updated', function() {
    var sequence = 'GTGCCCTGACCCAAACCCAAACCCAAACCCAAACCCAAACCT'+'TGATGA';
    var sequenceModel = new WipRdpPcrSequence({sequence});
    var attributes = {
      sequence,
      partType: RdpTypes.types.CDS,
      desiredStickyEnds: stickyEndsXZ(),
      sourceSequenceName: 'The one before',
      frm: 0,
      size: sequence.length,
      shortName: 'sh',
    };
    sequenceModel.set(attributes);

    var setAttributes = _.pick(sequenceModel.toJSON(), _.keys(attributes));
    expect(setAttributes).toEqual(attributes);
  });

  it('WipRdpOligoSequence should instantiate with only sequence and be updated', function() {
    var sequence = 'GTGTAGAAATAG';
    var sequenceModel = new WipRdpOligoSequence({sequence});
    var attributes = {
      sequence,
      partType: RdpTypes.types.PROTEIN_LINKER,
      desiredStickyEnds: stickyEndsZX(),
      frm: 0,
      size: sequence.length,
      shortName: 'sh',
      sourceSequenceName: 'parent',
    };
    sequenceModel.set(attributes);

    var setAttributes = _.pick(sequenceModel.toJSON(), _.keys(attributes));
    expect(setAttributes).toEqual(attributes);
  });
});
