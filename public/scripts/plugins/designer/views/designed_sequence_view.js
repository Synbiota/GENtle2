import Backbone from 'backbone';
import template from '../templates/designed_sequence_view.hbs';
import SynbioData from '../../../common/lib/synbio_data';
import Gentle from 'gentle';
import Sequence from '../../../sequence/models/sequence';

export default Backbone.View.extend({
  template: template,
  manage: true,

  events: {
    'click .assemble-sequence-btn': 'assembleSequence'
  },

  initialize: function() {
    this.sequences = [];
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

  // trashFeatureOrBases: function(chunk){
  //   var currentChunk = _.findWhere(this.model.chunks,{id: chunk}), featureObj;

  //   this.model.deleteBases(
  //     currentChunk.from,
  //     -currentChunk.from+currentChunk.to+1, 
  //     true
  //   );
  // },

  // processChunks: function() {
  //   var id = 0,
  //       features = [],
  //       chunks = [],
  //       chunkId = -1,
  //       lastChunkEndBase = -1,
  //       lastBase = this.model.length() - 1,
  //       _this = this,
  //       type;

  //   _.each(_.reject(this.model.get('features'), function(feature) {
  //     var featureTypeData = SynbioData.featureTypes[feature._type];
  //     return false;
  //     return !featureTypeData || !featureTypeData.is_main_type;
  //   }), function(feature) {
  //     _.each(feature.ranges, function(range) {

  //       if(feature._type !== 'Sequence'){
  //         features.push({
  //            name: feature.name,
  //            id: ++id,
  //            featureId: feature._id,
  //            from: range.from,
  //            to: range.to,
  //            reverseComplement: range.reverseComplement,
  //           _type: feature._type.toLowerCase()
  //         });
  //       }
  //     });
  //   });

  //   features = _.sortBy(features, function(feature) {
  //     return feature.from;
  //   });

  //   _.each(features, function(feature) {
  //     if(feature.from > lastChunkEndBase + 1) {
  //       chunks.push({
  //         id: ++chunkId,
  //         _type: 'sequence',
  //         empty: true,
  //         from: lastChunkEndBase + 1,
  //         to: feature.from - 1,
  //         length: feature.from - 1 - lastChunkEndBase - 1 + 1
  //       });
  //     }

  //     chunks.push({
  //       id: ++chunkId,
  //       empty: false,
  //       from: feature.from,
  //       to: feature.to,
  //       length: feature.to - feature.from + 1,
  //       feature: feature
  //     });

  //       lastChunkEndBase = feature.to;
  //   });

  //   if(lastChunkEndBase < lastBase) {
  //     chunks.push({
  //       id: ++chunkId,
  //       _type: 'sequence',
  //       empty: true,
  //       from: lastChunkEndBase + 1,
  //       to: lastBase,
  //       length: lastBase - lastChunkEndBase
  //     });
  //   }

  //   this.chunks = chunks;
  //   this.model.chunks = this.chunks;
  //   return chunks;
  // },

  // styleChunks: function() {
  //   var availableWidth = this.$('.designer-designed-sequence-chunks').width(),
  //       sequenceLength = this.model.length(),
  //       chunks = this.chunks;

  //   _.each(this.$('.designer-designed-sequence-chunk'), function(chunkElem) {
  //     var $chunkElem = $(chunkElem),
  //         chunk = _.findWhere(chunks, {id: $chunkElem.data('chunkId')});

  //     // $chunkElem
  //     //   .css('width',Math.floor(availableWidth * chunk.length / sequenceLength))
  //     $chunkElem.addClass(chunk.empty ?
  //       'designer-designed-sequence-chunk-empty' :
  //       'designer-designed-sequence-chunk-' + chunk.feature.type
  //     );
  //   });
  // },

  serialize: function() {
    var output = {
      sequenceName: Gentle.currentSequence.get('name')
    };  
    // var output = {
    //     sequence: this.model.serialize(),
    //     readOnly: this.model.get('readOnly')
    // };

    // if(this.model.maxOverlappingFeatures() > 1) {
    //   output.disabled = true;
    // } else {
      if(this.sequences.length) {
        output.sequences = this.processSequences();
        output.lastId = this.sequences.length;
      } else {
        output.empty = true;
      // }
    }

    return output;
  },

  processSequences: function() {
    return _.map(this.sequences, function(sequence, i) {
      var features = sequence.get('features');
      var name = sequence.get('name')
      var type;

      if(features.length == 1) {
        console.log(features, sequence.length(), features[0].ranges[0].from === 0 && features[0].ranges[0].to >= sequence.length())
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

  // insertFromAvailableSequence: function($droppable, $draggable) {
  //   var featureAndSubSeq, chunk, insertBeforeBase, bases, basesRange, seqBases, featureObj;
  //       featureAndSubSeq = this.getFeatureFromAvailableSequenceDraggable($draggable);
   
  //   chunk = _.findWhere(this.chunks, {
  //     id: $droppable.closest("[data-chunk-id]").data('chunkId')
  //   });

  //   insertBeforeBase = $droppable.hasClass('designer-designed-sequence-chunk-droppable-before') ? 
  //     chunk.from : 
  //     chunk.to + 1;

  //   if(featureAndSubSeq.feature.type == 'Sequence') { 
  //     this.model.insertSequenceAndCreateFeatures(
  //       insertBeforeBase, 
  //       featureAndSubSeq.subSeq, 
  //       featureAndSubSeq.feature.features, 
  //       true
  //     );
  //   } else {
  //     this.model.insertBasesAndCreateFeatures(
  //       insertBeforeBase, 
  //       featureAndSubSeq.subSeq, 
  //       featureAndSubSeq.feature.feature, 
  //       true
  //     );
  //   }
  // },

  // insertFirstAnnotationFromAvailableSequence: function($draggable) {
  //   var featureAndSubSeq = this.getFeatureFromAvailableSequenceDraggable($draggable);

  //   if(featureAndSubSeq.feature.type == 'Sequence') { 
  //     this.model.insertSequenceAndCreateFeatures(
  //       0, 
  //       featureAndSubSeq.subSeq, 
  //       featureAndSubSeq.feature.features, 
  //       true
  //     );
  //   } else {
  //     this.model.insertBasesAndCreateFeatures(
  //       0, 
  //       featureAndSubSeq.subSeq, 
  //       featureAndSubSeq.feature.feature, 
  //       true
  //     );
  //   }
  // },

  // getFeatureFromAvailableSequenceDraggable: function($draggable) {
  //   var sequenceId, availableSequenceView, feature, sequence;

  //   sequenceId = $draggable.closest('[data-sequence-id]').data('sequenceId');

  //   availableSequenceView = this.parentView()
  //     .getAvailableSequenceViewFromSequenceId(sequenceId);

  //   if($draggable.hasClass('designer-available-sequence-entireseq')) {

  //     sequence = availableSequenceView.sequenceInfo;

  //     return {
  //       feature: sequence,
  //       subSeq: availableSequenceView.model.getSubSeq(sequence.from, sequence.to)
  //     }; 

  //   } else {

  //     feature = _.findWhere(availableSequenceView.features, {
  //       id: $draggable.data('featureId')
  //     });

  //     return {
  //       feature: feature,
  //       subSeq: availableSequenceView.model.getSubSeq(feature.from, feature.to)
  //     };
  //   }
  // },

  // moveChunk: function($droppable, $draggable) {
  //   var targetChunk = _.findWhere(this.chunks, {
  //         id: $droppable.closest('[data-chunk-id]').data('chunkId')
  //       }),
  //       movingChunk = _.findWhere(this.chunks, {id: $draggable.data('chunkId')}),
  //       movingTo = $droppable.hasClass('designer-designed-sequence-chunk-droppable-before') ? 
  //         targetChunk.from : 
  //         targetChunk.to + 1;

  //   if(movingTo !== movingChunk.from && movingTo !== movingChunk.to + 1) {
  //     this.model.moveBases(
  //       movingChunk.from, 
  //       movingChunk.length, 
  //       movingTo
  //     );
  //   }
  // },

  insertFromAvailableSequence: function($draggable, beforeIndex = 0) {
    var sequence = this.getSequenceFromAvailableSequenceDraggable($draggable);
    this.sequences.splice(beforeIndex, 0, sequence);
    this.render();
  },

  moveSequence: function($draggable, index) {
    var oldIndex = this.getSequenceIndexFromDraggableChunk($draggable);
    var sequence = this.sequences[oldIndex];
    this.sequences[oldIndex] = null;
    this.sequences.splice(index, 0, sequence);
    this.sequences = _.compact(this.sequences);
    this.render();
  },

  removeSequence: function(index) {
    this.sequences.splice(index, 1);
    this.render();
  },

  getSequenceIndexFromDraggableChunk: function($draggable) {
    var $container = $draggable.closest('.designer-designed-sequence-chunk-container');
    return $container.data('sequenceIndex');
  },

  getSequenceFromAvailableSequenceDraggable: function($draggable) {
    var sequenceId, availableSequenceView, feature, sequence;
// 
    sequenceId = $draggable.closest('[data-sequence-id]').data('sequenceId');

    availableSequenceView = this.parentView()
      .getAvailableSequenceViewFromSequenceId(sequenceId);

    if($draggable.hasClass('designer-available-sequence-entireseq')) {
      return availableSequenceView.model;

      // sequence = availableSequenceView.sequenceInfo;

      // return {
      //   feature: sequence,
      //   subSeq: availableSequenceView.model.getSubSeq(sequence.from, sequence.to)
      // }; 

    } else {

      feature = _.findWhere(availableSequenceView.features, {
        id: $draggable.data('featureId')
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

  canDrop: function($draggable, beforeIndex, previousIndex) {
    var sequence;
    var output = true;

    if($draggable.hasClass('designer-designed-sequence-chunk')) {
      sequence = this.getSequenceFromDraggableChunk($draggable);
    } else {
      sequence = this.getSequenceFromAvailableSequenceDraggable($draggable);
    }

    if(sequence) {
      if(beforeIndex > 0) {
        output = output && this.sequences[beforeIndex-1].stickyEndConnects(sequence);
      }

      if(beforeIndex < this.sequences.length) {
        output = output && sequence.stickyEndConnects(this.sequences[beforeIndex]);
      }

      if(previousIndex && previousIndex > 0 && previousIndex < this.sequences.length -1) {
        output = output && this.sequences[previousIndex - 1].stickyEndConnects(this.sequences[previousIndex + 1]) 
      }
    }

    return output;
  },

  canTrash: function($draggable, previousIndex) {
    return previousIndex <= 0 || previousIndex >= this.sequences.length -1 ||
        this.sequences[previousIndex - 1].stickyEndConnects(this.sequences[previousIndex + 1]) ;
  },

  afterRender: function() {
    var _this = this;
    // this.styleChunks();

    this.$('.designer-designed-sequence-chunk').draggable({
      zIndex: 2000, 
      revert: true, 
      helper: 'clone',
      refreshPositions: true,
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
        var index = $draggable.data('sequenceIndex');
        return index == $(this).data('sequenceIndex') && _this.canTrash($draggable, index);
      },
      drop: function(event, ui) {
        var index = ui.draggable.data('sequenceIndex');
        _this.removeSequence(index);
      }
    });

    this.$('.designer-designed-sequence-chunk-droppable').droppable({
      activeClass: 'active',
      hoverClass: 'hover',
      tolerance: 'pointer',
      accept: function(draggable){
        var previousIndex;
        if(draggable.hasClass('designer-designed-sequence-chunk')) {
          previousIndex = _this.getSequenceIndexFromDraggableChunk(draggable);
        }
        return _this.canDrop(draggable, $(this).data('beforeIndex'), previousIndex);
      },
      drop: function(event, ui) {
        var index = $(this).data('beforeIndex');
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
  }
});