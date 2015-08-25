// TODO import underscore.mixed
import Q from 'q';
import _ from 'underscore';
import WipRdpReadyAbstractSequence from './wip_rdp_ready_abstract_sequence';
import RdpOligoSequence from './rdp_oligo_sequence';
import RdpTypes from './rdp_types';


var wip_rdp_ready_oligo_sequence = 'wip_rdp_ready_oligo_sequence';


class WipRdpReadyOligoSequence extends WipRdpReadyAbstractSequence {
  static getShortenedStickyEnds(desiredStickyEnds) {
    desiredStickyEnds = _.deepClone(desiredStickyEnds);
    var start = desiredStickyEnds.start;
    start.sequence = start.sequence.substr(start.offset, start.size);
    var end = desiredStickyEnds.end;
    end.sequence = end.sequence.substr(0, end.size);
    start.offset = 0;
    end.offset = 0;
    return desiredStickyEnds;
  }

  constructor(attrs, options={}) {
    options.NextClass = RdpOligoSequence;
    options.types = RdpTypes.oligoTypes;
    attrs.desiredStickyEnds = WipRdpReadyOligoSequence.getShortenedStickyEnds(attrs.desiredStickyEnds);
    super(attrs, options);
    this.set({_type: wip_rdp_ready_oligo_sequence}, {silent: false});
  }

  getRdpSequenceModel() {
    var error = super.getRdpSequenceModel();
    if(error) return error;

    var newRdpOligoSequence = new RdpOligoSequence(this.attributes);
    return Q.resolve(newRdpOligoSequence);
  }
}

export default WipRdpReadyOligoSequence;
