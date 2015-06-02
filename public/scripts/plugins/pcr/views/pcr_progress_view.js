import template from '../templates/pcr_progress_view.hbs';
import {getPcrProductAndPrimers} from '../lib/pcr_primer_design';
import {getPcrProductsFromSequence, savePcrProductsToSequence} from '../lib/utils';
import {handleError} from '../../../common/lib/handle_error';


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
    var sequence = this.model;

    getPcrProductAndPrimers(sequence.get('sequence'), dataAndOptions).then((pcrProduct) => {
      var parentView = this.parentView();
      this.updateProgressBar(1);

      var options = _.omit(dataAndOptions, 'name', 'from', 'to', 'stickyEnds');
      sequence.set('meta.pcr.defaults', options);

      var products = getPcrProductsFromSequence(sequence);
      products.push(pcrProduct);
      savePcrProductsToSequence(sequence, products);
      parentView.showProducts(pcrProduct);

    }).progress(({lastProgress, lastFallbackProgress}) => {
      this.updateProgressBar(this.calcTotal(lastProgress));
      if(lastFallbackProgress.total && lastFallbackProgress.current !== 0) {
        this.updateFallbackProgressBar(this.calcTotal(lastFallbackProgress));
      }
    }).catch((e) => {
      handleError('new PCR, view error:', e);
      this.$('.new-pcr-progress').slideUp();
      this.$('.new-pcr-progress-error').slideDown();
    }).done();
  },

  calcTotal: function({current, total}) {
    return total ? current / total : 0;
  },

  retryCreatingPcrPrimer: function() {
    this.parentView().makePrimer(this.pcrPrimerDataAndOptions);
  },

});
