import Backbone from 'backbone';
import template from '../templates/designed_sequence_view.hbs';
import draggableCleanup from '../lib/draggable_cleanup';
import xScrollingUi from '../lib/x_scrolling_ui';
import {INCOMPATIBLE_STICKY_ENDS, CANNOT_CIRCULARIZE} from '../lib/wip_circuit';
import diagnosticErrorTemplate from '../templates/diagnostic_error_template.hbs';
import diagnosticSuccessTemplate from '../templates/diagnostic_success_template.hbs';
import SequenceSelectorView from './sequence_selector_view';
import $ from 'jquery';
import _ from 'underscore';

export default Backbone.View.extend({
  template: template,
  manage: true,
  className: 'designer-designed-sequence',

  events: {
    'click .designer-draggable-trash': 'onTrashClick'
  },

  initialize: function() {
    this._setupSequenceSelector(
      '.designer-anchor-dropdown',
      'availableAnchors',
      'anchor',
      'Anchor'
    );

    this._setupSequenceSelector(
      '.designer-cap-dropdown',
      'availableCaps',
      'cap',
      'Cap'
    );

    this.listenTo(this.model, 'change:anchor change:cap', () => {
      this.emptyDiagnostic();
      this.updateDiagnostic();
    });
  },

  _setupSequenceSelector(selector, availableAttr, selectedAttr, label) {
    var model = this.model;

    var selectorView = new SequenceSelectorView({
      label,
      getSequences: () => model.get(availableAttr),
      getSelectedSequence: () => model.get(selectedAttr)
    });

    // Select first value by default.
    var currentSelected = this.model.get(selectedAttr);
    var available = this.model.get(availableAttr);
    if (!currentSelected && (available)) {
      this.model.set(selectedAttr, available[0]);
    }

    this.listenTo(selectorView, 'select', (sequence) => {
      model.set(selectedAttr, sequence).throttledSave();
      selectorView.render();
    });

    this.setView(selector, selectorView);
  },

  onTrashClick: function(event) {
    event.stopPropagation();
    var $element = $(event.currentTarget).parent();
    this.removeSequence($element.index());
    $element.remove();
    this.emptyDiagnostic();
    this.updateDiagnostic();
    this.updateDraggableContainerWidth();
    if(this.model.get('sequences').length === 0) this.render();
  },

  serialize: function() {
    var model = this.model;
    var sequences = model.get('sequences');

    return {
      sequences,
      empty: sequences.length === 0
    };
  },

  insertFromAvailableSequence: function(sequenceId, beforeIndex = 0) {
    var model = this.model;
    var sequence = _.find(
      model.get('availableSequences'),
      s => s.get('id') === sequenceId
    );
    model.insertSequence(beforeIndex, sequence);
    model.throttledSave();
  },

  moveSequence: function(oldIndex, newIndex) {
    this.model.moveSequence(oldIndex, newIndex);
    this.model.throttledSave();
  },

  removeSequence: function(index) {
    this.model.removeSequenceAtIndex(index);
    this.model.throttledSave();
  },

  getSequenceIndexFromDraggableChunk: function($draggable) {
    var $container = $draggable.closest('.designer-designed-sequence-chunk-container');
    return $container.data('sequence_index');
  },

  getSequenceFromAvailableSequenceDraggable: function($draggable) {
    var sequenceId = $draggable.data('sequence_id');
    var sequence = _.find(this.model.allSequences, (s) => s.get('id') === sequenceId);

    if(sequence) {
      return sequence;
    }
  },

  getSequenceFromDraggableChunk: function($draggable) {
    var $container = $draggable.closest('.designer-designed-sequence-chunk-container');
    var index = this.getSequenceIndexFromDraggableChunk($container);
    return this.model.sequences[index];
  },

  canDrop: function($draggable, beforeIndex) {
    var previousIndex;
    if($draggable.hasClass('designer-designed-sequence-chunk')) {
      previousIndex = this.getSequenceIndexFromDraggableChunk($draggable);
    }

    if(beforeIndex === previousIndex || beforeIndex - 1 === previousIndex) {
      return false;
    }

    var sequence;
    if($draggable.hasClass('designer-designed-sequence-chunk')) {
      sequence = this.getSequenceFromDraggableChunk($draggable);
    } else {
      sequence = this.getSequenceFromAvailableSequenceDraggable($draggable);
    }
    return this.model._canInsert(sequence, beforeIndex, previousIndex);
  },

  cleanUpDraggable: function() {
    draggableCleanup(
      this,
      '.designer-designed-sequence-chunk',
      'div.designer-designed-sequence-chunk-trash',
      '.designer-designed-sequence-chunk-droppable',
      '.designer-designed-sequence-empty-placeholder'
    );
  },

  beforeRender: function() {
    this.cleanup();
  },

  cleanup: function() {
    this.cleanUpDraggable();
  },

  afterRender: function() {
    this.updateDiagnostic();
    this.updateDraggableContainerWidth();

    this.$('.designer-designed-sequence-empty-placeholder').droppable({
      hoverClass: 'active',
      tolerance: 'pointer',
      drop: (event, ui) => {
        this.insertFromAvailableSequence(ui.draggable.data('sequence_id'), 0);
        this.render();
      }
    });

    xScrollingUi('.designer-designed-sequence-chunks', 'sortable', {
      placeholder: 'designer-designed-sequence-chunk-placeholder',
      appendTo: 'body',
      helper: 'clone',
      scrollingElement: '.designer-designed-sequence',
      revert: 100,
      // refreshPosition: true,
      tolerance: 'pointer',
      start: (event, ui) => {
        var item = ui.item;
        ui.placeholder.outerWidth(item.outerWidth());
        if(!item.data('available')) {
          item.data('previous_index', item.index());
        }
        this.emptyDiagnostic();
      },
      update: (event, ui) => {
        var item = ui.item;
        var index = item.index();

        if(item.data('available')) {
          this.insertFromAvailableSequence(item.data('sequence_id'), index);
        } else {
          this.moveSequence(item.data('previous_index'), index);
        }

        ui.item.removeData('available');
      },
      deactivate: () => {
        this.updateDiagnostic();
        this.updateDraggableContainerWidth();
      }
    });
  },

  emptyDiagnostic() {
    this.$('.designer-diagnostic').empty();
  },

  insertDiagnosticChildren: function(indices, html) {
    var $diagnosticContainer = this.$('.designer-diagnostic');
    var $draggableContainer = this.$('.designer-designed-sequence-chunks');
    var $draggables = $draggableContainer.children();

    if(!_.isArray(indices)) indices = [indices];
    if(indices.length === 0) return;

    _.each(indices, (index) => {
      var last = index === $draggables.length;
      var $draggable = $($draggables[last ? index-1 : index]);

      var lastOffset = last ? $draggable.outerWidth(true) : 0;

      var $element = $(html).css({
        left: $draggable.offset().left +
          $draggableContainer.parent().scrollLeft() +
          lastOffset
      }).gentleTooltip({view: this});

      $diagnosticContainer.append($element);
    });
  },

  updateDiagnostic: function() {
    var model = this.model;
    var errors = model.get('errors');
    var sequences = model.get('sequences');
    var sequencesLength = model.get('sequences').length;

    // Incompatible sticky ends
    var errorIndices = _.pluck(
      _.where(errors, {type: INCOMPATIBLE_STICKY_ENDS}),
      'index'
    );

    this.insertDiagnosticChildren(errorIndices, diagnosticErrorTemplate({
      description: 'Incompatible sticky ends'
    }));

    if(sequencesLength > 0) {
      _.each(_.range(0, sequencesLength + 1), (index) => {
        if(
          !~errorIndices.indexOf(index) &&
          (index > 0 || model.get('anchor')) &&
          (index < sequencesLength || model.get('cap'))
        ) {
          let stickyEndName = (
            index === sequencesLength ?
              sequences[index - 1].getStickyEnds().end.name :
              sequences[index].getStickyEnds().start.name
          ).replace(/[^\w]/g, '').toLowerCase();

          this.insertDiagnosticChildren(index, diagnosticSuccessTemplate({
            stickyEndName
          }));
        }
      });
    }

    // // First and last sequence cannot connect
    // var cannotCircularize = _.some(errors, {type: CANNOT_CIRCULARIZE});
    // if(this.model.get('isCircular') && sequencesLength > 0) {
    //   if(cannotCircularize) {
    //     this.insertDiagnosticChildren([0, sequencesLength], diagnosticErrorTemplate({
    //       description: 'Cannot circularize because start and end sticky ends are not compatible'
    //     }));
    //   } else {
    //     this.insertDiagnosticChildren([0, sequencesLength], diagnosticSuccessTemplate());
    //   }
    // }
  },

  updateDraggableContainerWidth: function() {
    // This is necessary because the container of inline-block divs doesn't
    // automatically scale to the full width of its children, which creates
    // drag and drop issues
    var $draggableContainer = this.$('.designer-designed-sequence-chunks');

    var totalWidth = _.reduce($draggableContainer.children(), function(memo, element) {
      return memo + $(element).outerWidth(true);
    }, 0);

    // var maxWidth = $draggableContainer.parent().width() - 150;

    var padding = parseInt($draggableContainer.css('paddingRight'), 10) +
      parseInt($draggableContainer.css('paddingLeft'), 10);

    // $draggableContainer.width(Math.max(totalWidth + padding + 250, maxWidth));
    $draggableContainer.width(totalWidth + padding + 250);
  }

});
