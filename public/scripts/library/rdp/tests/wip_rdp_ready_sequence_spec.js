import RdpTypes from '../rdp_types';
import WipRdpReadyPcrSequence from '../wip_rdp_ready_pcr_sequence';
import WipRdpReadyOligoSequence from '../wip_rdp_ready_oligo_sequence';
import {stickyEndsZX} from './fixtures';


describe('WIP RDP ready sequence model', function() {
  var attributes = function() {
    return {
      sequence: 'AT',
      partType: RdpTypes.types.MODIFIER,
      shortName: 'short',
      sourceSequenceName: 'the sequence this came from',
      desiredStickyEnds: stickyEndsZX(),
      frm: 0,
      size: 2,
    };
  };

  var testThrownError = function(ModelClass, partType) {
    var oldFunc = console.error;
    console.error = () => {};
    try {
      var attrs = attributes();
      attrs.partType = partType;
      new ModelClass(attrs);
    } catch(e) {
      expect(e.toString()).toEqual(`TypeError: Invalid partType: "${partType}"`);
    } finally {
      console.error = oldFunc;
    }
  };

  it('PCR should error if partType is invalid', function() {
    testThrownError(WipRdpReadyPcrSequence, RdpTypes.types.PROTEIN_LINKER);
  });

  it('oligo should error if partType is invalid', function() {
    testThrownError(WipRdpReadyOligoSequence, RdpTypes.types.CDS);
  });

  it('should error loudly if invalid, even if validateLoudly is false', function() {
    var oldFunc = console.error;
    console.error = () => {};
    var errored;
    try {
      var attrs = attributes();
      attrs.partType = RdpTypes.types.CDS;
      new WipRdpReadyOligoSequence(attrs, {validateLoudly: false});
      errored = false;
    } catch(e) {
      errored = true;
    } finally {
      console.error = oldFunc;
    }
    expect(errored).toEqual(true);
  });
});
