import Sequence from '../../../sequence/models/sequence';
import RdpEdit from '../../../library/rdp/rdp_edit';
import RdpTypes from '../../../library/rdp/rdp_types';
import {transformSequenceForRdp} from 'gentle-rdp/rdp_sequence_transform';


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
      // We need rdpEdits to instantiate the non-WIP RDP SequenceModel
      // TODO: add an association for rdpEdits ?
      'rdpEdits',
      'partType',
    ]);
    return _.reject(fields, (field) => field === 'stickyEnds');
  }

  get isProteinCoding() {
    var partType = this.get('partType');
    return _.contains(RdpTypes.meta.proteinCoding, partType);
  }

  get isTerminator() {
    var partType = this.get('partType');
    return partType === RdpTypes.types.TERMINATOR;
  }

  get availablePartTypes() {
    return _.keys(RdpTypes.pcrTypes);
  }

  get availableStickyEndNames() {
    var partType = this.get('partType');
    var partTypeInfo = RdpTypes.pcrTypes[partType] || {stickyEndNames: []};
    return _.clone(partTypeInfo.stickyEndNames);
  }

  /**
   * @method  transformSequenceForRdp
   * @return {array<RdpEdit>}
   */
  transformSequenceForRdp() {
    this.validate();

    var rdpEdits = transformSequenceForRdp(this);
    this.set({rdpEdits});
    return rdpEdits;
  }

  validate() {
    var desiredStickyEnds = this.get('desiredStickyEnds');
    if(!(desiredStickyEnds && desiredStickyEnds.start && desiredStickyEnds.end)) {
      throw new TypeError('Must provide "desiredStickyEnds"');
    }
    var partType = this.get('partType');
    if(!_.contains(this.availablePartTypes, partType)) {
      throw new TypeError(`Invalid partType: "${partType}"`);
    }
    if(!_.contains(this.availableStickyEndNames, desiredStickyEnds.name)) {
      throw new TypeError(`Invalid desiredStickyEnd: "${desiredStickyEnds.name}"`);
    }
  }

  errors() {
    var rdpEdits = this.get('rdpEdits');
    return _.filter(rdpEdits, (rdpEdit) => rdpEdit.level === RdpEdit.levels.ERROR);
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


WipPcrProductSequence.getRdpCompliantSequenceModel = function(attributes) {
  var desiredWipRdpSequence = WipPcrProductSequence.getDesiredSequenceModel(attributes);
  desiredWipRdpSequence.transformSequenceForRdp();
  return desiredWipRdpSequence;
}


WipPcrProductSequence.getDesiredSequenceModel = function(attributes) {
  if(attributes.stickyEnds) {
    throw new TypeError('attributes for getDesiredSequenceModel must not contain stickyEnds');
  }
  attributes.originalSequence = attributes.sequence;
  var newSequenceModel = new WipPcrProductSequence(attributes);

  // Delete the bases
  var topFrm = attributes.frm + attributes.size;
  var remaining = attributes.originalSequence.length - topFrm;
  if(remaining > 0) newSequenceModel.deleteBases(topFrm, remaining, WipPcrProductSequence.STICKY_END_ANY);
  if(attributes.frm > 0 ) newSequenceModel.deleteBases(0, attributes.frm, WipPcrProductSequence.STICKY_END_ANY);
  return newSequenceModel;
}


export default WipPcrProductSequence;
