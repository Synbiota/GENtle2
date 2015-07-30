import _ from 'underscore';
import Sequence from '../../sequence/models/sequence';
import SequencesCollection from '../../sequence/models/sequences';
import {version1GenericPreProcessor} from 'gentledna-utils/dist/preprocessor';
import RdpEdit from './rdp_edit';
import SequenceTransforms from 'gentle-sequence-transforms';


var rdp_oligo_sequence = 'rdp_oligo_sequence';


class RdpOligoSequence extends Sequence {
  constructor(attrs, ...args) {
    attrs.readOnly = true;
    super(attrs, ...args);
    this.set({_type: rdp_oligo_sequence}, {silent: true});
  }

  get requiredFields() {
    return super.requiredFields.concat([
      'shortName',
      'partType',
      'stickyEnds',
      'rdpEdits'
    ]);
  }

  get optionalFields() {
    var fields = _.reject(super.optionalFields, (field) => field === 'stickyEnds');
    return fields.concat([
      'sourceSequenceName',
    ]);
  }

  getSenseStrand() {
    return this.getStickyEnds(false).start.sequence + this.getSequence(this.STICKY_END_NONE);
  }

  getAntisenseStrand() {
    var seq = this.getSequence(this.STICKY_END_NONE) + this.getStickyEnds(false).end.sequence;
    return SequenceTransforms.toReverseComplements(seq);
  }
}


var version1RdpOligoSequencePreProcessor = version1GenericPreProcessor('rdpEdits');
RdpOligoSequence.registerPreProcessor(version1RdpOligoSequencePreProcessor);
RdpOligoSequence.registerAssociation(RdpEdit, 'rdpEdit', true);

SequencesCollection.registerConstructor(RdpOligoSequence, rdp_oligo_sequence);

export default RdpOligoSequence;
