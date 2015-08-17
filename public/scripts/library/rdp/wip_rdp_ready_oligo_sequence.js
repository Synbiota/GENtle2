// TODO import underscore.mixed
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
    this.set({_type: wip_rdp_ready_oligo_sequence}, {silent: true});
  }

  getRdpSequenceModel() {
    var attributes = _.deepClone(this.attributes);
    // stickyEnds not yet present on transformedSequence so we don't need to
    // specify any stickyEnd format
    var mainSequence = this.getSequence(this.STICKY_END_ANY);

    attributes.stickyEnds = this.getShortenedStickyEnds();
    if(this.isProteinCoding) {
      if(attributes.stickyEnds.start.name === 'X') {
        mainSequence = mainSequence.slice(3);
      }
      mainSequence = mainSequence.substr(0, mainSequence.length - 1);
    }

    attributes.sequence = (
      attributes.stickyEnds.start.sequence +
      mainSequence +
      attributes.stickyEnds.end.sequence
    );

    attributes.features = this.getFeatures(this.STICKY_END_ANY);
    attributes.rdpEdits = this.get('rdpEdits');
    var newRdpOligoSequence = new RdpOligoSequence(attributes);
    return newRdpOligoSequence;
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
}

export default WipRdpReadyOligoSequence;
