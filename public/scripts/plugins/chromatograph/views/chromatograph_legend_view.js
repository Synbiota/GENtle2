import Backbone from 'backbone';
import template from '../templates/chromatograph_legend_view.hbs';
import Gentle from 'gentle';
import _ from 'underscore';

export default Backbone.View.extend({
  manage: true,
  template: template,

  className: 'chromatograph-legend-child',

  events: {
    'click .remove-button': 'removeFragment',
    'click .flip-button': 'flipFragment'
  },

  initialize: function(options = {}){

    this.model = options.model || Gentle.currentSequence;

    this.listenTo(this.model, 'add:chromatogramFragment remove:chromatogramFragment', this.render);

  },

  serialize: function(){
    var fragments = this.model.get('chromatogramFragments');

    var fragmentLabels = _.map(fragments, function(fragment, index) {
      return {
        name: fragment.name,
        length: fragment.length,
        index: index
      };
    });

    return {
      fragmentLabels: fragmentLabels
    }
  },

  removeFragment: function(e){

    var index = e.currentTarget.parentElement.attributes['data-index'].value

    this.model.removeChromatogramAt(index)
  },

  flipFragment: function(e){
    var index = e.currentTarget.parentElement.attributes['data-index'].value

    this.model.fipFragmentAt(index)
  }

})
