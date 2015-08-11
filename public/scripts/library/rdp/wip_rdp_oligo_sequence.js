import SequencesCollection from '../../sequence/models/sequences';
import RdpTypes from './rdp_types';
import RdpEdit from './rdp_edit';
import WipRdpAbstractSequence from './wip_rdp_abstract_sequence';
import RdpOligoSequence from './rdp_oligo_sequence';


var wip_rdp_oligo_sequence = 'wip_rdp_oligo_sequence';


class WipRdpOligoSequence extends WipRdpAbstractSequence {
  constructor(attrs, options={}) {
    options.Klass = WipRdpOligoSequence;
    options.types = RdpTypes.oligoTypes;
    super(attrs, options);
    this.set({_type: wip_rdp_oligo_sequence}, {silent: true});
  }

  getRdpOligoSequence(attributes) {
    // stickyEnds not yet present on transformedSequence so we don't need to
    // specify any stickyEnd format
    var mainSequence = this.getSequence(this.STICKY_END_ANY);

    attributes.stickyEnds = this.convertStickyEnds(attributes.desiredStickyEnds);
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
