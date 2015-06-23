import _ from 'underscore';
import template from '../templates/pcr_progress_view.hbs';
import {getPcrProductAndPrimers} from '../lib/pcr_primer_design';
import {handleError} from '../../../common/lib/handle_error';
import Gentle from 'gentle';
import RdpSequence from '../../../library/rdp/rdp_sequence';
import {transformSequenceForRdp} from 'gentle-rdp/sequence_transform';


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

    var tempSequence = new this.model.constructor({
      name: dataAndOptions.name,
      sequence: dataAndOptions.sequence
    });

    transformSequenceForRdp(tempSequence);

    dataAndOptions.from = 0;
    dataAndOptions.to = dataAndOptions.sequence.length - 1;
    delete dataAndOptions.sequence;

    getPcrProductAndPrimers(tempSequence, dataAndOptions)
    .then((pcrProduct) => {
      // Copy over RDP specific attributes.
      var rdpAttributes = _.extend({}, pcrProduct.toJSON(), _.pick(dataAndOptions,
          'partType', 'rdpEdits', 'sourceSequenceName'));

      rdpAttributes.displaySettings = rdpAttributes.displaySettings || {};
      rdpAttributes.displaySettings.primaryView = 'pcr';
      rdpAttributes.rdpEdits = rdpAttributes.rdpEdits || [];
      rdpAttributes._type = 'rdp_pcr_product';

      var rdpProduct = new RdpSequence(rdpAttributes);

      this.updateProgressBar(1);
      Gentle.sequences.add(rdpProduct);
      this.model.destroy();
      this.model = rdpProduct;
      Gentle.router.sequence(rdpProduct.get('id'));
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
