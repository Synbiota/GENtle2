import _ from 'underscore';
import template from '../templates/pcr_progress_view.hbs';
import {getPcrProductAndPrimers} from '../lib/pcr_primer_design';
import {handleError} from '../../../common/lib/handle_error';
import Gentle from 'gentle';
import RdpPcrSequence from 'gentle-rdp/rdp_pcr_sequence';


export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'click .retry-create-pcr-primer': 'retryCreatingPcrPrimer'
  },

  afterRender: function() {
    this.updateProgressBar(0);
  },

  updateProgressBar: function(progress) {
    this.$('.new-pcr-progress .initial-progress .progress-bar').css('width', progress*100+'%');
  },

  updateFallbackProgressBar:  function(progress) {
    this.$('.fallback-progress').show();
    this.$('.new-pcr-progress .fallback-progress .progress-bar').css('width', progress*100+'%');
  },

  makePrimers: function(wipRdpPcrSequence) {
    if(wipRdpPcrSequence.getStickyEnds(false)) throw new Error('wipRdpPcrSequence for PCR primer creation can not yet have stickyEnds');

    this.wipRdpPcrSequence = wipRdpPcrSequence;
    this.dataAndOptions = wipRdpPcrSequence.getDataAndOptionsForPcr();

    // getPcrProductAndPrimers uses the stickyEnds attribute in `dataAndOptions`
    // and the tempSequence sequenceBases to calculate the primers and new
    // sequenceBases.
    getPcrProductAndPrimers(wipRdpPcrSequence, this.dataAndOptions)
    .then((pcrProduct) => {
      var rdpPcrAttributes = _.extend(
        {},
        pcrProduct.toJSON(),
        // Copy over RDP specific attributes.
        _.pick(wipRdpPcrSequence.toJSON(), 'partType', 'sourceSequenceName', 'rdpEdits'),
        {_type: 'rdp_pcr_product'}
      );

      // ensures Gentle routes view to the RDP PCR product result view
      rdpPcrAttributes.displaySettings = rdpPcrAttributes.displaySettings || {};
      rdpPcrAttributes.displaySettings.primaryView = 'rdp_pcr';

      var rdpPcrProduct = new RdpPcrSequence(rdpPcrAttributes);

      this.updateProgressBar(1);
      Gentle.sequences.add(rdpPcrProduct);
      this.model.destroy();
      Gentle.router.sequence(rdpPcrProduct.get('id'));
    })
    .progress(({lastProgress, lastFallbackProgress}) => {
      this.updateProgressBar(this.calcTotal(lastProgress));
      if(lastFallbackProgress.total && lastFallbackProgress.current !== 0) {
        this.updateFallbackProgressBar(this.calcTotal(lastFallbackProgress));
      }
    })
    .catch((e) => {
      handleError('new PCR, view error:', e);
      this.$('.new-pcr-progress').slideUp();
      this.$('.new-pcr-progress-error').slideDown();
    })
    .done();
  },

  calcTotal: function({current, total}) {
    return total ? current / total : 0;
  },

  retryCreatingPcrPrimer: function() {
    this.parentView().makePrimers(this.wipRdpPcrSequence);
  },

});
