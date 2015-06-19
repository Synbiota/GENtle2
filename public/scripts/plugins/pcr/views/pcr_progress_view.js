import _ from 'underscore';
import template from '../templates/pcr_progress_view.hbs';
import {getPcrProductAndPrimers} from '../lib/pcr_primer_design';
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

  makePrimer: function(dataAndOptions) {
    this.pcrPrimerDataAndOptions = dataAndOptions;
    var options = _.omit(dataAndOptions, 'name', 'from', 'to', 'stickyEnds');
    this.model.set('meta.pcr.defaults', options);

    getPcrProductAndPrimers(this.model, dataAndOptions)
    .then((pcrProduct) => {
      this.updateProgressBar(1);
      pcrProduct.set('displaySettings.primaryView', 'pcr');
      Gentle.sequences.add(pcrProduct);
      // We don't need to call `this.model.destroy` as it will be an instance of
      // WipPcrProductSequence and therefore not saved.
      this.model = pcrProduct;
      Gentle.router.sequence(pcrProduct.get('id'));

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
    this.parentView().makePrimer(this.pcrPrimerDataAndOptions);
  },

});
