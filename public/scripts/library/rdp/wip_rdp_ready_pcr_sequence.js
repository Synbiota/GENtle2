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

  getRdpSequenceModel() {
    var error = super.getRdpSequenceModel();
    if(error) return error;

    var options = this.getOptionsForPcr();
    // Calculate the primers
    return getPcrProductAndPrimers(this, options)
    .then((pcrProduct) => {
      var pcrProductAttributes = pcrProduct.toJSON();
      var rdpPcrAttributes = _.extend(
        {displaySettings: {}},
        pcrProductAttributes
      );
      delete rdpPcrAttributes._type;
      var rdpPcrSequenceModel = new RdpPcrSequence(rdpPcrAttributes);
      return rdpPcrSequenceModel;
    });
  }

  getOptionsForPcr() {
    // Remember:  `frm` and `size` refer to where the sequence attribute
    // initially came from inside `originalSequenceBases`, so aren't very useful
    // here.
    var sameBasesFrm = this.get('sameBasesFrm');
    var sameBasesSize = this.get('sameBasesSize');
    return {
      primerAnnealingFrm: sameBasesFrm,
      primerAnnealingTo:  sameBasesFrm + sameBasesSize,
      // Include extensions up and "down" stream of the annealing regions.
      prependBases: true,
    };
  }
}

export default WipRdpReadyPcrSequence;
