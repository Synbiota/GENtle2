import Sequence from '../../../sequence/models/sequence';
import RdpEdit from '../../../library/rdp/rdp_edit';


class WipPcrProductSequence extends Sequence {
  constructor(attributes, ...other) {
    var wip_pcr_product = 'wip_pcr_product';
    if(attributes._type && attributes._type !== wip_pcr_product) {
      throw new TypeError(`WipPcrProductSequence expected _type of "${wip_pcr_product}" but was "${attributes._type}"`);
    }
    attributes._type = wip_pcr_product;
    super(attributes, ...other);
  }

  get optionalFields() {
    var fields = super.optionalFields.concat([
      'sourceSequenceName',
      'desiredStickyends',
    ]);
    return _.reject(fields, (field) => field === 'stickyEnds');
  }

  transformDataBeforePcr(rdpEdits) {
    // stickyEnds not yet present on transformedSequence so we don't need to
    // specify any stickyEnd format
    var sequence = this.getSequence(this.STICKY_END_ANY);
    var findWhere = (type) => _.findWhere(rdpEdits, {type});
    // If a Methionine start codon was added then we don't need to change
    // the sequence, but if either it was already present, or it was
    // converted from a similar start codon then we need to remove the
    // first 3 bases so that the ATG then comes the forward stickyEnd
    // sequence used to make the forward PCR primer.
    var methionineAdded = findWhere(RdpEdit.types.METHIONINE_START_CODON_ADDED);
    if(!methionineAdded) sequence = sequence.slice(3);

    // Irrespective of if the transformation involved converting the last base
    // into a C or G, we will exclude this base from the sequence so that it is
    // not used to make the PCR primers.
    sequence = sequence.substr(0, sequence.length - 1);
    this.set('sequence', sequence);
  }
}


export default WipPcrProductSequence;
