import SequencesCollection from '../../sequence/models/sequences';
import RdpTypes from './rdp_types';
import WipRdpAbstractSequence from './wip_rdp_abstract_sequence';
import RdpOligoSequence from './rdp_oligo_sequence';


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

  getRdpOligoSequence(attributes) {
    // stickyEnds not yet present on transformedSequence so we don't need to
    // specify any stickyEnd format
    attributes.stickyEnds = this.convertStickyEnds(attributes.stickyEnds);
    attributes.sequence = (
      attributes.stickyEnds.start.sequence +
      this.getSequence(this.STICKY_END_ANY) +
      attributes.stickyEnds.end.sequence
    );

    attributes.features = this.getFeatures(this.STICKY_END_ANY);
    attributes.rdpEdits = this.get('rdpEdits');
    var newRdpOligoSequence = new RdpOligoSequence(attributes);
    return newRdpOligoSequence;
  }

  convertStickyEnds(stickyEnds) {
    var start = stickyEnds.start;
    start.sequence = start.sequence.substr(start.offset, start.size);
    var end = stickyEnds.end;
    end.sequence = end.sequence.substr(0, end.size);
    start.offset = 0;
    end.offset = 0;
    return stickyEnds;
  }

}


SequencesCollection.registerConstructor(WipRdpOligoSequence, wip_rdp_oligo_sequence);

export default WipRdpOligoSequence;
