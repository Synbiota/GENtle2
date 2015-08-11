import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import template from '../templates/available_sequences_view.hbs';
import draggableCleanup from '../lib/draggable_cleanup';
import xScrollingUi from '../lib/x_scrolling_ui';
import Gentle from 'gentle';
import cleanSearchableText from '../lib/clean_searchable_text';
import hoverDescription from '../lib/hover_description';

var AvailableSequenceView = Backbone.View.extend({
  template: template,
  manage: true,
  className: 'designer-available-sequences',

  events: {
    'click .designer-draggable-trash': 'onTrashClick'
  },

  initialize: function(){
    this.listenTo(Gentle, 'designer:availableSequences:filter', this.filterAvailableSequences, this);
  },

  serialize: function() {
    return {
      sequences: this.getSequences(), 
      name: this.name
    };
  },

  afterRender: function() {
    _.each(this.$('.designer-draggable'), (el) => {
      var $el = $(el);
      var sequenceId = $el.data('sequence_id');
      var sequence = _.find(
        this.parentView().model.get('availableSequences'), 
        s => s.get('id') === sequenceId
      );
      if(!sequence) return;

      var searchable = cleanSearchableText(
        sequence.get('name')+
        (sequence.get('shortName') || '') +
        (sequence.get('desc') || '')
      );

      $el.data('searchable', searchable);
    });

    xScrollingUi('.designer-available-sequences .designer-draggable', 'draggable', {
      // refreshPositions: true,
      appendTo: 'body',
      revert: 'invalid',
      revertDuration: 150,
      helper: 'clone',
      connectToSortable: '.designer-designed-sequence-chunks',
      scrollingElement: '.designer-designed-sequence',
      start: function(event, ui) {
        ui.helper.data('available', true);
      },
      cursorAt: {
        top: 5,
        left: 5
      }
    });

    hoverDescription(this.$('.designer-draggable'));
  },

  cleanUpDraggable: function() {
    draggableCleanup(
      this,
      '.designer-available-sequence-draggable'
    );
  },

  beforeRender: function() {
    this.cleanUpDraggable();
  },

  cleanup: function() {
    this.cleanUpDraggable();
  },

  filterAvailableSequences: function({query}) {
    this.$('.designer-draggable-hidden').removeClass('designer-draggable-hidden');
    this.$el.parent().scrollTop(0);
    if(!query || query.length === 0) return;
    _.each(this.$('.designer-draggable'), (el) => {
      var $el = $(el);
      if(!~$el.data('searchable').indexOf(query)) {
        $el.addClass('designer-draggable-hidden');
      } 
    });
  },

  onTrashClick: function(event) {
    event.stopPropagation();

    var $element = $(event.currentTarget).parent();
    var pModel = this.parentView().model;
    var availSequences = pModel.get('availableSequences');
    var sequenceId = $element.data('sequence_id');


    pModel.removeAvailableSequenceBySequenceId(sequenceId);
    pModel.throttledSave();
    $element.remove();
    this.render();
  }


});

export default AvailableSequenceView;
