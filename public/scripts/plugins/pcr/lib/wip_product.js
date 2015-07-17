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
      'desiredStickyEnds',
      // Define the portion of the template sequence that should be used in
      // the final PCR product
      'frm', // inclusive
      'size',
      'originalSequence',
      // TODO: add an association for rdpEdits ?
      'rdpEdits',
    ]);
    return _.reject(fields, (field) => field === 'stickyEnds');
  }

  getDesiredSequenceModel() {
    var attributes = this.toJSON();
    attributes.originalSequence = this.getSequence(this.STICKY_END_ANY);
    var newSequenceModel = new this.constructor(attributes);

    // Delete the bases
    var topFrm = attributes.frm + attributes.size;
    var remaining = attributes.originalSequence.length - topFrm;
    if(remaining > 0) newSequenceModel.deleteBases(topFrm, remaining, this.STICKY_END_ANY);
    if(attributes.frm > 0 ) newSequenceModel.deleteBases(0, attributes.frm, this.STICKY_END_ANY);
    return newSequenceModel;
  }

  getDataAndOptionsForPcr() {
    // var findWhere = (type) => _.findWhere(rdpEdits, {type});

    // stickyEnds not yet present on transformedSequence so we don't need to
    // specify any stickyEnd format

    // OPTIMISE:  use the `originalSequence` value to calculate which bases of
    // the template can still contribute to the PCR primers.
    // e.g. the `TG` of `TTG` converted to `ATG` can be used as part of the
    // annealing region of the forward primer
    // e.g. the `TT` of Phenylalanine's `TTT` being converted to `TTC` can be
    // used as part of annealing region of the reverse primer

    var frm = 0;
    var startBasesDifferentToTemplate = 0;
    if(this.get('desiredStickyEnds').start.name === "X") {
      // Irrespective of if a Methionine start codon was already present, added,
      // or converted from a similar start codon, we need to discount the
      // first 3 bases so that the ATG then comes from the start stickyEnd
      // sequence used to make the forward PCR primer.
      frm = 3;

      // // OPTIMISE:  see above.
      // var methionineAdded = findWhere(RdpEdit.types.METHIONINE_START_CODON_ADDED);
      startBasesDifferentToTemplate = 0;
    }

    // Irrespective of if the transformation involved converting the last base
    // into a C or G, we will exclude the last 3 bases from the sequence so
    // that they are not used to make the PCR primers.
    var to = this.getLength(this.STICKY_END_ANY) - 2; // the C of TTC or
    // G of CCG should not be included as this will come from the stickyEnd
    // NOTE:  `-2` because `to` for `getPcrProductAndPrimers` is inclusive.

    // We assume the TT of TTC is different from the original sequence.
    // TODO: OPTIMISE:  see above.
    var endBasesDifferentToTemplate = 2;

    var dataAndOptionsForPcr = {
      from: frm,  // TODO remove this
      startBasesDifferentToTemplate,
      to,
      endBasesDifferentToTemplate,
      stickyEnds: this.get('desiredStickyEnds'),
      name: this.get('name'),
    };
    return dataAndOptionsForPcr;
  }
}


export default WipPcrProductSequence;
