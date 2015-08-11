import Backbone from 'backbone';
import template from '../templates/pcr_progress_view.hbs';
import {handleError} from '../../../common/lib/handle_error';
import Gentle from 'gentle';


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
    this.wipRdpPcrSequence.getRdpPcrSequenceModel()
    .then((rdpPcrSequenceModel) => {
      // ensures Gentle routes view to the RDP PCR product result view
      rdpPcrSequenceModel.set({'displaySettings.primaryView': 'rdp_pcr'});

      this.updateProgressBar(1);
      Gentle.sequences.add(rdpPcrSequenceModel);
      this.model.destroy();
      Gentle.router.sequence(rdpPcrSequenceModel.get('id'));
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
