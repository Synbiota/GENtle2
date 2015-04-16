import Backbone from 'backbone';
import template from '../templates/designed_sequence_view.hbs';
import SynbioData from '../../../common/lib/synbio_data';
import Gentle from 'gentle';
import Sequence from '../../../sequence/models/sequence';
import draggableCleanup from '../lib/draggable_cleanup';

export default Backbone.View.extend({
  template: template,
  manage: true,

  events: {
    'click .assemble-sequence-btn': 'assembleSequence',
    'change #circularise-dna': 'updateCirculariseDna',
  },

  assembleSequence: function(event) {
    event.preventDefault();
    if(this.model.incompatibleStickyEnds()) {
      alert('You are making a circular sequence but the sticky ends of the start and end sequences are incompatible.  Please fix these first or make the sequence non-circular.');
    } else {
      this.model.assembleSequences().throttledSave();
      this.model.set('meta.designer', {});
      this.parentView(1).remove();
      this.parentView(2).changePrimaryView('edition');
    }
  },

  updateCirculariseDna: function(event) {
    event.preventDefault();
    this.model.set('isCircular', event.target.checked).throttledSave();
    this.render();
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

  insertFromAvailableSequence: function($draggable, beforeIndex = 0) {
    $draggable.on('dragstop', () => {
      var sequence = this.getSequenceFromAvailableSequenceDraggable($draggable);
      this.model.insertSequence(beforeIndex, sequence);
      this.renderAndSave();
    });
  },

  moveSequence: function($draggable, newIndex) {
    $draggable.on('dragstop', () => {
      var oldIndex = this.getSequenceIndexFromDraggableChunk($draggable);
      this.model.moveSequence(oldIndex, newIndex);
      this.renderAndSave();
    });
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
    var sequenceId, availableSequenceView, feature;
    sequenceId = $draggable.closest('[data-sequence_id]').data('sequence_id');

    availableSequenceView = this.parentView()
      .getAvailableSequenceViewFromSequenceId(sequenceId);

    if($draggable.hasClass('designer-available-sequence-entireseq')) {
      return availableSequenceView.model;
    } else {
      feature = _.findWhere(availableSequenceView.features, {
        id: $draggable.data('feature_id')
      });

      return {
        feature: feature,
        subSeq: availableSequenceView.model.getSubSeq(feature.from, feature.to)
      };
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
    this.cleanUpDraggable();
  },

  remove: function() {
    this.cleanUpDraggable();
    Backbone.View.prototype.remove.apply(this, arguments);
  },

  afterRender: function() {
    var _this = this;
    this.$('.designer-designed-sequence-chunk').draggable({
      zIndex: 2000, 
      revert: 'invalid', 
      helper: 'clone',
      // refreshPositions: true,
      cursorAt: {
        top: 5, 
        left: 5
      },
    }).hover(
    (event) => {
      var sequence = this.getSequenceFromDraggableChunk($(event.target));
      this.parentView().hoveredOverSequence(sequence.get('id'));
    },
    (event) => {
      var sequence = this.getSequenceFromDraggableChunk($(event.target));
      this.parentView().unhoveredOverSequence(sequence.get('id'));
    });

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