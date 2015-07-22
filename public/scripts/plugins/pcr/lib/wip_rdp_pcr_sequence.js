import SequencesCollection from '../../../sequence/models/sequences';
import WipRdpAbstractSequence from 'gentle-rdp/wip_rdp_abstract_sequence';
// import RdpEdit from 'gentle-rdp/rdp_edit';
import RdpTypes from 'gentle-rdp/rdp_types';


var wip_rdp_pcr_product = 'wip_rdp_pcr_product';


class WipRdpPcrSequence extends WipRdpAbstractSequence {
  constructor(attributes, ...other) {
    attributes.Klass = WipRdpPcrSequence;
    attributes.types = RdpTypes.pcrTypes;
    super(attributes, ...other);
    this.set({_type: wip_rdp_pcr_product}, {silent: true});
  }

  getDataAndOptionsForPcr() {
    // stickyEnds not yet present on transformedSequence so we don't need to
    // specify any stickyEnd format

    // OPTIMISE:  use the `originalSequenceBases` value to calculate which bases of
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

      // TODO: OPTIMISE:  see above.
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
      from: frm,  // TODO remove the `from` and replace with `frm`
      startBasesDifferentToTemplate,
      to,
      endBasesDifferentToTemplate,
      stickyEnds: this.get('desiredStickyEnds'),
      name: this.get('name'),
    };
    return dataAndOptionsForPcr;
  }
}


SequencesCollection.registerConstructor(WipRdpPcrSequence, wip_rdp_pcr_product);
// LEGACY
var old_wip_pcr_product = 'wip_pcr_product';
SequencesCollection.registerConstructor(WipRdpPcrSequence, old_wip_pcr_product);

export default WipRdpPcrSequence;
