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
    this.$('.new-pcr-progress .progress-bar').css('width', progress*100+'%');
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

    }).progress((progress) => {
      this.updateProgressBar(progress);
    }).catch((e) => {
      handleError('new PCR, view error:', e);
      this.$('.new-pcr-progress').slideUp();
      this.$('.new-pcr-progress-error').slideDown();
    });
  },

  retryCreatingPcrPrimer: function() {
    this.parentView().makePrimer(this.pcrPrimerData);
  },

});