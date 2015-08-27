import SequencesCollection from '../../../sequence/models/sequences';
import WipRdpAbstractSequence from 'gentle-rdp/wip_rdp_abstract_sequence';
// import RdpEdit from 'gentle-rdp/rdp_edit';
import RdpTypes from 'gentle-rdp/rdp_types';
import WipRdpReadyPcrSequence from 'gentle-rdp/wip_rdp_ready_pcr_sequence';


var wip_rdp_pcr_product = 'wip_rdp_pcr_product';


class WipRdpPcrSequence extends WipRdpAbstractSequence {
  constructor(attributes, options={}) {
    options.NextClass = WipRdpReadyPcrSequence;
    options.types = RdpTypes.pcrTypes;
    super(attributes, options);
    this.set({_type: wip_rdp_pcr_product}, {silent: true});
  }
}


SequencesCollection.registerConstructor(WipRdpPcrSequence, wip_rdp_pcr_product);
// LEGACY
var old_wip_pcr_product = 'wip_pcr_product';
SequencesCollection.registerConstructor(WipRdpPcrSequence, old_wip_pcr_product);

export default WipRdpPcrSequence;
