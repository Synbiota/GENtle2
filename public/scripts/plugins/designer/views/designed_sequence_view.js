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
  },

  initialize: function() {
    var assembleSequencesJSON = Gentle.currentSequence.get('meta.assembleSequences') || '[]';
    var assembleSequences = JSON.parse(assembleSequencesJSON);
    this.sequences = _.map(assembleSequences, (sequenceAttributes) => new Sequence(sequenceAttributes));
  },

  assembleSequence: function(event) {
    event.preventDefault();
    var finalSequence = Sequence.concatenateSequences(this.sequences);
    Gentle.currentSequence.set({
      sequence: finalSequence.get('sequence'),
      features: finalSequence.get('features'),
      stickyEnds: finalSequence.get('stickyEnds')
    });
    this.parentView(2).changePrimaryView('edition');
  },

  serialize: function() {
    var output = {sequenceName: Gentle.currentSequence.get('name')};
    if(this.sequences.length) {
      output.sequences = this.processSequences();
      output.lastId = this.sequences.length;
    } else {
      output.empty = true;
    }
    return output;
  },

  processSequences: function() {
    return _.map(this.sequences, function(sequence, i) {
      var features = sequence.get('features');
      var name = sequence.get('name');
      var type;

      if(false && features.length == 1) { // temporarily disabled
        if(features[0].ranges[0].from === 0 && features[0].ranges[0].to >= sequence.length() -1) {
          name = features[0].name;
          type = features[0].type;
        }
      }

      return {
        name: name,
        type: type,
        index: i
      };
    });
  },

  renderAndSave: function () {
    this.render();
    Gentle.currentSequence.set('meta.assembleSequences', JSON.stringify(this.sequences));
    Gentle.currentSequence.throttledSave();
  },

  insertFromAvailableSequence: function($draggable, beforeIndex = 0) {
    $draggable.on('dragstop', () => {
      var sequence = this.getSequenceFromAvailableSequenceDraggable($draggable);
      this.sequences.splice(beforeIndex, 0, sequence);
      this.renderAndSave();
    });
  },

  moveSequence: function($draggable, index) {
    $draggable.on('dragstop', () => {
      var oldIndex = this.getSequenceIndexFromDraggableChunk($draggable);
      var sequence = this.sequences[oldIndex];
      this.sequences[oldIndex] = null;
      this.sequences.splice(index, 0, sequence);
      this.sequences = _.compact(this.sequences);
      this.renderAndSave();
    });
  },

  removeSequence: function($draggable, index) {
    $draggable.on('dragstop', () => {
      this.sequences.splice(index, 1);
      this.renderAndSave();
    });
  },

  getSequenceIndexFromDraggableChunk: function($draggable) {
    var $container = $draggable.closest('.designer-designed-sequence-chunk-container');
    return $container.data('sequence_index');
  },

  getSequenceFromAvailableSequenceDraggable: function($draggable) {
    var sequenceId, availableSequenceView, feature;
    sequenceId = $draggable.closest('[data-sequence-id]').data('sequenceId');

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
    return this.sequences[this.getSequenceIndexFromDraggableChunk($container)];
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
    return this._canDrop(sequence, beforeIndex, previousIndex);
  },

  _canDrop: function(sequence, beforeIndex, previousIndex) {
    var output = true;

    // if(sequence) {
      if(beforeIndex > 0) {
        output = output && this.sequences[beforeIndex-1].stickyEndConnects(sequence);
      }

      if(beforeIndex < this.sequences.length) {
        output = output && sequence.stickyEndConnects(this.sequences[beforeIndex]);
      }

      if(previousIndex && previousIndex > 0 && previousIndex < this.sequences.length -1) {
        output = output && this.sequences[previousIndex - 1].stickyEndConnects(this.sequences[previousIndex + 1]);
      }
    // }

    return output;
  },

  getDroppabilityState: function(availableSequences) {
    // Dictionary of sequence ids and the positions they can drop too.
    var droppabilityState = {};
    _.each(availableSequences, (availableSequence) => {
      var acceptableDropIndices = [];
      _.each(_.range(this.sequences.length+1), (index) => {
        if(this._canDrop(availableSequence, index)) {
          acceptableDropIndices.push(index);
        }
      });
      droppabilityState[availableSequence.get('id')] = acceptableDropIndices;
    });
    return droppabilityState;
  },

  canTrash: function($draggable, previousIndex) {
    return previousIndex <= 0 || previousIndex >= this.sequences.length -1 ||
        this.sequences[previousIndex - 1].stickyEndConnects(this.sequences[previousIndex + 1]);
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
    });

    this.$('div.designer-designed-sequence-chunk-trash').droppable({
      activeClass: 'enabled',
      hoverClass: 'active',
      tolerance: 'pointer',
      accept: function($draggable) {
        var index = $draggable.data('sequence_index');
        return index == $(this).data('sequence_index') && _this.canTrash($draggable, index);
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

});