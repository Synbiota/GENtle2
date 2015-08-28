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

    // this.listenTo(this.model, 'add:chromatogramFragment remove:chromatogramFragment reverseComplement:chromatogramFragment', this.render);
    this.listenTo(
      this.model,
      'add remove reverseComplement',
      this.render
      );

  },

  serialize: function(){
    var fragments = this.model.get('chromatogramFragments');

    var fragmentLabels = fragments.map(function(fragment, index) {
      return {
        name: fragment.get('name'),
        length: fragment.getLength(),
        index: index,
        isComplement: fragment.get('isComplement'),
      };
    });

    return {
      fragmentLabels: fragmentLabels
    }
  },

  removeFragment: function(e){
    var index = e.currentTarget.parentElement.parentElement.attributes['data-index'].value,
        fragments = this.model.get('chromatogramFragments');

    fragments.remove(fragments.at(index))

  },

  flipFragment: function(e){
    var index = e.currentTarget.parentElement.parentElement.attributes['data-index'].value

    this.model.get('chromatogramFragments').at(index).complement()

  }

})
