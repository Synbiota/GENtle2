import _ from 'underscore';
import Backbone from 'backbone';
import Gentle from 'gentle';
import SynbioData from '../../common/lib/synbio_data';
import template from ',,/templates/stop_codons_view.hbs';


export default Backbone.view.extend({

  template: template,
  manage: true,

  events: {
    '.click .find-stop-codons': 'findStopCodons',
  },

  initialize: function() {
    this.model = Gentle.currentSequence;

    this.listenTo(
      this.model,
      'change:sequence',
      this.render,
      this
    );

  },

  findStopCodons: function() {
    
  }

});