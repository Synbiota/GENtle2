// TODO import underscore.mixed
import Q from 'q';
import _ from 'underscore';
import WipRdpReadyAbstractSequence from './wip_rdp_ready_abstract_sequence';
import RdpOligoSequence from './rdp_oligo_sequence';
import RdpTypes from './rdp_types';


var wip_rdp_ready_oligo_sequence = 'wip_rdp_ready_oligo_sequence';


class WipRdpReadyOligoSequence extends WipRdpReadyAbstractSequence {
  constructor(attrs, options={}) {
    options.NextClass = RdpOligoSequence;
    options.types = RdpTypes.oligoTypes;
    super(attrs, options);
    var desiredStickyEnds = this.getShortenedStickyEnds();
    this.set({_type: wip_rdp_ready_oligo_sequence, desiredStickyEnds}, {silent: false});
  }

  getShortenedStickyEnds() {
    var stickyEnds = _.deepClone(this.get('desiredStickyEnds'));
    var start = stickyEnds.start;
    start.sequence = start.sequence.substr(start.offset, start.size);
    var end = stickyEnds.end;
    end.sequence = end.sequence.substr(0, end.size);
    start.offset = 0;
    end.offset = 0;
    return stickyEnds;
  }

  getRdpSequenceModel() {
    var error = super.getRdpSequenceModel();
    if(error) return error;

    var newRdpOligoSequence = new RdpOligoSequence(this.attributes);
    return Q.resolve(newRdpOligoSequence);
  }
}

export default WipRdpReadyOligoSequence;
