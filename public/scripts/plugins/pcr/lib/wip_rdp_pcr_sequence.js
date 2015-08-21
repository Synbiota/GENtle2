import _ from 'underscore';
import SequencesCollection from '../../../sequence/models/sequences';
import WipRdpAbstractSequence from 'gentle-rdp/wip_rdp_abstract_sequence';
// import RdpEdit from 'gentle-rdp/rdp_edit';
import RdpTypes from 'gentle-rdp/rdp_types';
import RdpPcrSequence from 'gentle-rdp/rdp_pcr_sequence';
import {getPcrProductAndPrimers} from './pcr_primer_design';


var wip_rdp_pcr_product = 'wip_rdp_pcr_product';


class WipRdpPcrSequence extends WipRdpAbstractSequence {
  constructor(attributes, options={}) {
    options.Klass = WipRdpPcrSequence;
    options.types = RdpTypes.pcrTypes;
    super(attributes, options);
    this.set({_type: wip_rdp_pcr_product}, {silent: true});
  }

  getRdpPcrSequenceModel() {
    // getPcrProductAndPrimers uses the stickyEnds attribute in `dataAndOptions`
    // and the tempSequence sequenceBases to calculate the primers and new
    // sequenceBases.
    var dataAndOptions = this.getDataAndOptionsForPcr();
    return getPcrProductAndPrimers(this, dataAndOptions)
    .then((pcrProduct) => {
      var rdpPcrAttributes = _.extend(
        {displaySettings: {}},
        pcrProduct.toJSON(),
        // Copy over RDP specific attributes.
        _.pick(this.toJSON(), 'partType', 'sourceSequenceName', 'rdpEdits'),
        {_type: 'rdp_pcr_product'}
      );

      var rdpPcrSequenceModel = new RdpPcrSequence(rdpPcrAttributes);

      return rdpPcrSequenceModel;
    });
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
      if(this.isProteinCoding) {
        // Irrespective of if a Methionine start codon was already present, added,
        // or converted from a similar start codon, we need to discount the
        // first 3 bases so that the ATG then comes from the start stickyEnd
        // sequence used to make the forward PCR primer.
        frm = 3;
      } else {
        // TODO: add a test for this
        frm = 0;
      }

      // TODO: OPTIMISE:  see above.
      startBasesDifferentToTemplate = 0;
    }

    var to;
    var endBasesDifferentToTemplate;
    if(this.isProteinCoding && !this.isCdsWithStop) {
      // Irrespective of if the transformation involved converting the last base
      // into a C or G, we will exclude the last 3 bases from the sequence so
      // that they are not used to make the PCR primers.
      to = this.getLength(this.STICKY_END_ANY) - 2; // the C of TTC or
      // G of CCG should not be included as this will come from the stickyEnd
      // NOTE:  `-2` because `to` for `getPcrProductAndPrimers` is inclusive.

      // We assume the TT of TTC is different from the original sequence.
      // TODO: OPTIMISE:  see above.
      endBasesDifferentToTemplate = 2;
    } else {
      // TODO: add a test for these
      // NOTE:  `-1` because `to` for `getPcrProductAndPrimers` is inclusive.
      to = this.getLength(this.STICKY_END_ANY) - 1;
      endBasesDifferentToTemplate = 0;
    }

    var dataAndOptionsForPcr = {
      frm,
      startBasesDifferentToTemplate,
      to,
      endBasesDifferentToTemplate,
      stickyEnds: this.get('desiredStickyEnds'),
      name: this.get('name'),
      shortName: this.get('shortName'),
      desc: this.get('desc'),
    };
    return dataAndOptionsForPcr;
  }
}


SequencesCollection.registerConstructor(WipRdpPcrSequence, wip_rdp_pcr_product);
// LEGACY
var old_wip_pcr_product = 'wip_pcr_product';
SequencesCollection.registerConstructor(WipRdpPcrSequence, old_wip_pcr_product);

export default WipRdpPcrSequence;
