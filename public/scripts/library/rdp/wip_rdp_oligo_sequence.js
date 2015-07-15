import _ from 'underscore';
import Sequence from '../../sequence/models/sequence';
import SequencesCollection from '../../sequence/models/sequences';


var wip_rdp_oligo_sequence = 'wip_rdp_oligo_sequence';


class WipRdpOligoSequence extends Sequence {
  constructor(attrs, ...args) {
    attrs.readOnly = true;
    super(attrs, ...args);
    this.set({_type: wip_rdp_oligo_sequence}, {silent: true});
  }

  get requiredFields() {
    return super.requiredFields.concat([
    ]);
  }

  get optionalFields() {
    var fields = _.reject(super.optionalFields, (field) => field === 'stickyEnds');
    return fields.concat([
      'shortName',
      'partType',
      'sourceSequenceName',
    ]);
  }
}


SequencesCollection.registerConstructor(WipRdpOligoSequence, wip_rdp_oligo_sequence);

export default WipRdpOligoSequence;
