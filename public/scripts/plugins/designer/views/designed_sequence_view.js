import Backbone from 'backbone';
import template from '../templates/designed_sequence_view.hbs';
import Gentle from 'gentle';
import draggableCleanup from '../lib/draggable_cleanup';
import xScrollingUi from '../lib/x_scrolling_ui';

export default Backbone.View.extend({
  template: template,
  manage: true,
  className: 'designer-designed-sequence',

  events: {
    'click .assemble-sequence-btn': 'assembleSequence'
  },

  assembleSequence: function(event) {
    event.preventDefault();
    if(this.model.incompatibleStickyEnds()) {
      alert('You are making a circular sequence but the sticky ends of the start and end sequences are incompatible.  Please fix these first or make the sequence non-circular.');
    } else {
      this.model.assembleSequences().throttledSave();
      this.parentView(1).remove();
      this.parentView(2).changePrimaryView('edition');
    }
  },

  serialize: function() {
    var output = {
      sequenceName: this.model.get('name'),
      circulariseDna: this.model.get('isCircular'),
      incompatibleStickyEnds: this.model.incompatibleStickyEnds(),
    };
    if(this.model.sequences.length) {
      output.sequences = this.model.processSequences();
      output.lastId = this.model.sequences.length;
    } else {
      output.empty = true;
    }
    return output;
  },

  renderAndSave: function () {
    // Perhaps change this back to `this.render()`, as whole view flickers.
    this.parentView().render();
    this.model.throttledSave();
  },

  insertFromAvailableSequence: function(sequenceId, beforeIndex = 0) {
    var model = this.model;
    var sequence = _.find(model.allSequences, (s) => s.get('id') === sequenceId);
    model.insertSequence(beforeIndex, sequence);
    model.throttledSave();
    // $draggable.on('dragstop', () => {
    //   var sequence = this.getSequenceFromAvailableSequenceDraggable($draggable);
    //   this.model.insertSequence(beforeIndex, sequence);
    //   this.renderAndSave();
    // });
  },

  moveSequence: function(oldIndex, newIndex) {
    this.model.moveSequence(oldIndex, newIndex);
    this.model.throttledSave();
  },

  removeSequence: function($draggable, index) {
    $draggable.on('dragstop', () => {
      this.model.removeSequenceAtIndex(index);
      this.renderAndSave();
    });
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





    // var sequenceId, availableSequenceView, feature;
    // sequenceId = $draggable.closest('[data-sequence_id]').data('sequence_id');

    // availableSequenceView = this.parentView()
    //   .getAvailableSequenceViewFromSequenceId(sequenceId);

    // if($draggable.hasClass('designer-available-sequence-entireseq')) {
    //   return availableSequenceView.model;
    // } else {
    //   feature = _.findWhere(availableSequenceView.features, {
    //     id: $draggable.data('feature_id')
    //   });

    //   return {
    //     feature: feature,
    //     subSeq: availableSequenceView.model.getSubSeq(feature.from, feature.to)
    //   };
    // }
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

    var _this = this;
    // this.$('.designer-designed-sequence-chunk').draggable({
    //   zIndex: 2000,
    //   revert: 'invalid',
    //   helper: 'clone',
    //   appendTo: this.$el,
    //   cursorAt: {
    //     top: 5,
    //     left: 5
    //   }
    // }).hover(
    // (event) => {
    //   var sequence = this.getSequenceFromDraggableChunk($(event.target));
    //   this.parentView().hoveredOverSequence(sequence.get('id'));
    // },
    // (event) => {
    //   var sequence = this.getSequenceFromDraggableChunk($(event.target));
    //   this.parentView().unhoveredOverSequence(sequence.get('id'));
    // });

    this.$('div.designer-designed-sequence-chunk-trash').droppable({
      activeClass: 'enabled',
      hoverClass: 'active',
      tolerance: 'pointer',
      accept: function($draggable) {
        var index = $draggable.data('sequence_index');
        return index == $(this).data('sequence_index') && _this.model.canTrash(index);
      },
      drop: function(event, ui) {
        var $draggable = ui.draggable;
        var index = $draggable.data('sequence_index');
        _this.removeSequence($draggable, index);
      }
    });

    this.$('.designer-designed-sequence-chunk-droppable').droppable({
      activeClass: 'active',
      hoverClass: 'hover',
      tolerance: 'pointer',
      accept: function($draggable){
        return _this.canDrop($draggable, $(this).data('before_index'));
      },
      drop: function(event, ui) {
        var index = $(this).data('before_index');
        if(ui.draggable.hasClass('designer-designed-sequence-chunk')) {
          _this.moveSequence(ui.draggable, index);
        } else {
          _this.insertFromAvailableSequence(ui.draggable, index);
        }
      }
    });

    this.$('.designer-designed-sequence-empty-placeholder').droppable({
      activeClass: 'active',
      tolerance: 'pointer',
      drop: (event, ui) => this.insertFromAvailableSequence(ui.draggable)
    });

    xScrollingUi('.designer-designed-sequence-chunks', 'sortable', {
      placeholder: 'designer-designed-sequence-chunk-placeholder',
      appendTo: 'body',
      helper: 'clone',
      scrollingElement: '.designer-designed-sequence',
      revert: 100,
      refreshPosition: true,
      tolerance: 'pointer',
      start: function(event, ui) {
        var item = ui.item;
        ui.placeholder.outerWidth(item.outerWidth());
        if(!item.data('available')) {
          item.data('previous_index', item.index());
        }
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
      }
    });
  },

  highlightDropSites: function(indices) {
    if(this.model.sequences.length === 0) {
      this.$el.find('.designer-designed-sequence-empty-placeholder').addClass('highlighted');
    } else {
      _.each(indices, (index) => {
        var selector = `.designer-designed-sequence-chunk-droppable[data-before_index="${index}"]`;
        this.$el.find(selector).addClass('highlighted');
      });
    }
  },

  unhighlightDropSites: function() {
    this.$el.find('.designer-designed-sequence-chunk-droppable').removeClass('highlighted');
    this.$el.find('.designer-designed-sequence-empty-placeholder').removeClass('highlighted');
  },

});
