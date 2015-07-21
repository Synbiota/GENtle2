import Backbone from 'backbone';
import template from '../templates/sequence_selector_view.hbs';
import _ from 'underscore';
import $ from 'jquery';
import hoverDescription from '../lib/hover_description';
import tooltip from 'gentle-utils/tooltip';

var pluckData = function(sequence, selectedSequence) {
  return sequence && {
    name: sequence.get('shortName') || sequence.get('name'),
    startStickyEnd: sequence.getStickyEnds().start.name.toLowerCase().replace(/[^\w]/g, ''),
    endStickyEnd: sequence.getStickyEnds().end.name.toLowerCase().replace(/[^\w]/g, ''),
    id: sequence.get('id'),
    description: sequence.get('desc'),
    isSelected: selectedSequence && 
      selectedSequence.get('id') === sequence.get('id')
  };
};

export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'show.bs.dropdown': 'onDropdownShow'
  },

  serialize() {
    var selectedSequence = this.getSelectedSequence();

    return {
      label: this.label,
      selectedSequence: pluckData(selectedSequence),
      sequences: _.sortBy(
        _.map(
          this.getSequences(), 
          _.partial(pluckData, _, selectedSequence)
        ), 
        'name'
      )
    };
  },

  afterRender() {
    var $container = this.$dropdownContainer = this.$('.dropdown-container');
    $container.on('click', 'a', _.bind(this.onSelect, this));
    this.$dropdownLabel = this.$('.designer-sequence-selector-button-label');

    hoverDescription(this.$('a'));
  },

  onDropdownShow() {
    var $container = this.$dropdownContainer;
    var position = $container.offset();
    var $label = this.$dropdownLabel;

    this.previousLabel = $label.text();
    $label.text($label.data('default_label'));

    var $button = $label.parent();

    this.previousClasses = _.filter(
      $button[0].className.split(/\s+/), 
      (klass) => /^designer\-sequence\-selector\-/.test(klass)
    );

    $button.removeClass(this.previousClasses.join(' '));

    $('body').append($container);

    $container.css({
      position: 'absolute',
      top: position.top,
      left: position.left
    });

    $container.one('hide.bs.dropdown', _.bind(this.onDropdownHidden, this));
  },

  onDropdownHidden() {
    this.$dropdownLabel
      .text(this.previousLabel)
      .parent()
      .addClass(this.previousClasses.join(' '));

    delete this.previousLabel;
    delete this.previousClasses;

    tooltip.hide();

    this.$el.prepend(this.$dropdownContainer.attr('style', ''));
  },

  onSelect(event) {
    event.preventDefault();

    var $target = $(event.currentTarget);
    var id = $target.data('sequence_id');
    var sequence = _.find(this.getSequences(), s => s.get('id') === id);

    this.$dropdownContainer.dropdown('toggle');
    this.trigger('select', sequence);
  }
});