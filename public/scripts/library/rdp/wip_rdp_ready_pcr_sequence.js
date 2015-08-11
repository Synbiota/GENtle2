import _ from 'underscore';
import WipRdpReadyAbstractSequence from './wip_rdp_ready_abstract_sequence';
import RdpPcrSequence from './rdp_pcr_sequence';
import RdpTypes from './rdp_types';
import {getPcrProductAndPrimers} from '../../plugins/pcr/lib/pcr_primer_design';


var wip_rdp_ready_pcr_sequence = 'wip_rdp_ready_pcr_sequence';


class WipRdpReadyPcrSequence extends WipRdpReadyAbstractSequence {
  constructor(attrs, options={}) {
    options.NextClass = RdpPcrSequence;
    options.types = RdpTypes.pcrTypes;
    super(attrs, options);
    this.set({_type: wip_rdp_ready_pcr_sequence}, {silent: true});
  }

  getRdpPcrSequenceModel() {
    if(this.getStickyEnds(false)) throw new Error('wipRdpPcrSequence for PCR primer creation can not yet have stickyEnds');

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
    var desiredStickyEnds = this.get('desiredStickyEnds');
    if(desiredStickyEnds.start.name === "X") {
      if(this.isProteinCoding) {
        // Irrespective of if a Methionine start codon was already present, added,
        // or converted from a similar start codon, we need to discount the
        // first 3 bases so that the ATG then comes from the start stickyEnd
        // sequence used to make the forward PCR primer.
        frm = 3;
      } else {
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
      stickyEnds: desiredStickyEnds,
      name: this.get('name'),
    };
    return dataAndOptionsForPcr;
  }
}

export default WipRdpReadyPcrSequence;
