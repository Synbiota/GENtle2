import Backbone from 'backbone';
import template from '../templates/chromatograph_legend_view.hbs';
import Gentle from 'gentle';
import _ from 'underscore';

export default Backbone.View.extend({
  manage: true,
  template: template,

  className: 'chromatograph-legend-child',

  // events: {
  // },

  initialize: function(options = {}){

    this.model = options.model || Gentle.currentSequence;

    this.listenTo(this.model, 'change:chromatogramFragments', this.render);

  },

  serialize: function(){
    var fragments = this.model.get('chromatogramFragments');

    var fragmentLabels = _.map(fragments, function(fragment) {
      return {
        name: fragment.name,
        length: fragment.length
      };
    });

    return {
      fragmentLabels: fragmentLabels
    }
  },

})
