import SequencesCollection from '../../sequence/models/sequences';
import RdpTypes from './rdp_types';
import WipRdpAbstractSequence from './wip_rdp_abstract_sequence';


var wip_rdp_oligo_sequence = 'wip_rdp_oligo_sequence';


class WipRdpOligoSequence extends WipRdpAbstractSequence {
  constructor(attrs, ...args) {
    if(attrs._type && attrs._type !== wip_rdp_oligo_sequence) {
      throw new TypeError(`WipRdpPcrSequence expected _type of "${wip_rdp_oligo_sequence}" but was "${attrs._type}"`);
    }
    attrs.Klass = WipRdpOligoSequence;
    attrs.types = RdpTypes.oligoTypes;
    super(attrs, ...args);
    this.set({_type: wip_rdp_oligo_sequence}, {silent: true});
  }
}


SequencesCollection.registerConstructor(WipRdpOligoSequence, wip_rdp_oligo_sequence);

export default WipRdpOligoSequence;
