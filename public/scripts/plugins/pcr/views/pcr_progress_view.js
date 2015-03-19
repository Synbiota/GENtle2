import template from '../templates/pcr_progress_view.hbs';
import Gentle from 'gentle';
import PrimerDesign from '../lib/pcr_primer_design';


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

  makePrimer: function(data) {
    this.pcrPrimerData = data;
    var sequence = this.model;

    PrimerDesign(sequence, data).then((product) => {
      var parentView = this.parentView();

      sequence.set('meta.pcr.defaults', _.omit(data, 'name', 'from', 'to', 'stickyEnds'));

      var products = parentView.getProducts();
      products.push(product);
      parentView.saveProducts(products);
      parentView.showProducts(product);

    }).progress(({lastProgress, lastFallbackProgress}) => {
      this.updateProgressBar(this.calcTotal(lastProgress));
      if(lastFallbackProgress.total) {
        this.updateFallbackProgressBar(this.calcTotal(lastFallbackProgress));
      }
    }).catch((e) => {
      handleError('new PCR, view error:', e);
      this.$('.new-pcr-progress').slideUp();
      this.$('.new-pcr-progress-error').slideDown();
    });
  },

  calcTotal: function({current, total}) {
    return total ? current / total : 0;
  },

  retryCreatingPcrPrimer: function() {
    this.parentView().makePrimer(this.pcrPrimerData);
  },

});