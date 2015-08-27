import SequencesCollection from '../../sequence/models/sequences';
import RdpTypes from './rdp_types';
import WipRdpAbstractSequence from './wip_rdp_abstract_sequence';
import WipRdpReadyOligoSequence from 'gentle-rdp/wip_rdp_ready_oligo_sequence';


var wip_rdp_oligo_sequence = 'wip_rdp_oligo_sequence';


class WipRdpOligoSequence extends WipRdpAbstractSequence {
  constructor(attrs, options={}) {
    options.NextClass = WipRdpReadyOligoSequence;
    // options.NextClass = WipRdpOligoSequence;
    options.types = RdpTypes.oligoTypes;
    super(attrs, options);
    this.set({_type: wip_rdp_oligo_sequence}, {silent: true});
  }
}


SequencesCollection.registerConstructor(WipRdpOligoSequence, wip_rdp_oligo_sequence);

export default WipRdpOligoSequence;
