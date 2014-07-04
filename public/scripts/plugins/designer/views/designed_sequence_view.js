define(function(require) {
  var Backbone = require('backbone.mixed'),
      template = require('hbars!../templates/designed_sequence_view'),
      SynbioData = require('common/lib/synbio_data'),
      Gentle = require('gentle')(),
      DesignedSequenceView;

  DesignedSequenceView = Backbone.View.extend({
    template: template,
    manage: true,

    initialize: function() {
      this.listenTo(Gentle.currentSequence, 'change', this.render, this);
    },

    trashFeatureOrBases: function(chunk){
      var currentChunk = _.findWhere(this.model.chunks,{id: chunk}), featureObj;

      this.model.deleteBases(
        currentChunk.from,
        -currentChunk.from+currentChunk.to+1, 
        true
      );
    },

    processChunks: function() {
      var id = 0,
          features = [],
          chunks = [],
          chunkId = -1,
          lastChunkEndBase = -1,
          lastBase = this.model.length() - 1,
          _this = this,
          type;

      _.each(_.reject(this.model.get('features'), function(feature) {
        var featureTypeData = SynbioData.featureTypes[feature._type];
        return false;
        return !featureTypeData || !featureTypeData.is_main_type;
      }), function(feature) {
        _.each(feature.ranges, function(range) {

          if(feature._type !== 'Sequence'){


          features.push({
             name: feature.name,
             id: ++id,
             featureId: feature._id,
             from: range.from,
             to: range.to,
             reverseComplement: range.reverseComplement,
            _type: feature._type.toLowerCase()
          });
        }
        });
      });

      features = _.sortBy(features, function(feature) {
        return feature.from;
      });

      _.each(features, function(feature) {
        if(feature.from > lastChunkEndBase + 1) {
          chunks.push({
            id: ++chunkId,
            _type: 'sequence',
            empty: true,
            from: lastChunkEndBase + 1,
            to: feature.from - 1,
            length: feature.from - 1 - lastChunkEndBase - 1 + 1
          });
        }

        chunks.push({
          id: ++chunkId,
          empty: false,
          from: feature.from,
          to: feature.to,
          length: feature.to - feature.from + 1,
          feature: feature
        });

          lastChunkEndBase = feature.to;
      });

      if(lastChunkEndBase < lastBase) {
        chunks.push({
          id: ++chunkId,
          _type: 'sequence',
          empty: true,
          from: lastChunkEndBase + 1,
          to: lastBase,
          length: lastBase - lastChunkEndBase
        });
      }

      this.chunks = chunks;
      this.model.chunks = this.chunks;
      return chunks;
    },

    styleChunks: function() {
      var availableWidth = this.$('.designer-designed-sequence-chunks').width(),
          sequenceLength = this.model.length(),
          chunks = this.chunks;

      _.each(this.$('.designer-designed-sequence-chunk'), function(chunkElem) {
        var $chunkElem = $(chunkElem),
            chunk = _.findWhere(chunks, {id: $chunkElem.data('chunkId')});

        // $chunkElem
        //   .css('width',Math.floor(availableWidth * chunk.length / sequenceLength))
        $chunkElem.addClass(chunk.empty ?
          'designer-designed-sequence-chunk-empty' :
          'designer-designed-sequence-chunk-' + chunk.feature.type
        );
      });
    },

    serialize: function() {
      var output = {
          sequence: this.model.serialize(),
          readOnly: this.model.get('readOnly')
      };

      if(this.model.maxOverlappingFeatures() > 1) {
        output.disabled = true;
      } else {
        if(this.model.length()) {
          output.chunks = this.processChunks();
        } else {
          output.empty = true;
        }
      }

      return output;
    },

    insertFromAvailableSequence: function($droppable, $draggable) {
      var featureAndSubSeq, chunk, insertBeforeBase, bases, basesRange, seqBases, featureObj;
          featureAndSubSeq = this.getFeatureFromAvailableSequenceDraggable($draggable);
     
      chunk = _.findWhere(this.chunks, {
        id: $droppable.closest("[data-chunk-id]").data('chunkId')
      });

      insertBeforeBase = $droppable.hasClass('designer-designed-sequence-chunk-droppable-before') ? 
        chunk.from : 
        chunk.to + 1;

      if(featureAndSubSeq.feature.type == 'Sequence') { 
        this.model.insertSequenceAndCreateFeatures(
          insertBeforeBase, 
          featureAndSubSeq.subSeq, 
          featureAndSubSeq.feature.features, 
          true
        );
      } else {
        this.model.insertBasesAndCreateFeatures(
          insertBeforeBase, 
          featureAndSubSeq.subSeq, 
          featureAndSubSeq.feature.feature, 
          true
        );
      }
    },

    insertFirstAnnotationFromAvailableSequence: function($draggable) {
      var featureAndSubSeq = this.getFeatureFromAvailableSequenceDraggable($draggable);

      if(featureAndSubSeq.feature.type == 'Sequence') { 
        this.model.insertSequenceAndCreateFeatures(
          0, 
          featureAndSubSeq.subSeq, 
          featureAndSubSeq.feature.features, 
          true
        );
      } else {
        this.model.insertBasesAndCreateFeatures(
          0, 
          featureAndSubSeq.subSeq, 
          featureAndSubSeq.feature.feature, 
          true
        );
      }
    },

    getFeatureFromAvailableSequenceDraggable: function($draggable) {
      var sequenceId, availableSequenceView, feature, sequence;

      sequenceId = $draggable.closest('[data-sequence-id]').data('sequenceId');

      availableSequenceView = this.parentView()
        .getAvailableSequenceViewFromSequenceId(sequenceId);

      if($draggable.hasClass('designer-available-sequence-entireseq')) {

        sequence = availableSequenceView.sequenceInfo;

        return {
          feature: sequence,
          subSeq: availableSequenceView.model.getSubSeq(sequence.from, sequence.to)
        }; 

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

    moveChunk: function($droppable, $draggable) {
      var targetChunk = _.findWhere(this.chunks, {
            id: $droppable.closest('[data-chunk-id]').data('chunkId')
          }),
          movingChunk = _.findWhere(this.chunks, {id: $draggable.data('chunkId')});

      this.model.moveBases(
        movingChunk.from, 
        movingChunk.length, 
        $droppable.hasClass('designer-designed-sequence-chunk-droppable-before') ? 
          targetChunk.from : 
          targetChunk.to + 1
      );
    },

    afterRender: function() {
      var _this = this;
      this.styleChunks();

      this.$('.designer-designed-sequence-chunk').draggable({
        zIndex: 2000, 
        revert: true, 
        helper: 'clone',
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
          return $draggable.data('chunkId') == $(this).data('trashId');
        },
        drop: function(event, ui) {
          _this.trashFeatureOrBases(ui.draggable.data('chunkId'));
        }
      });

      this.$('.designer-designed-sequence-chunk-droppable').droppable({
        hoverClass: 'active',
        tolerance: 'pointer',
        drop: function(event, ui) {
          if(ui.draggable.hasClass('designer-designed-sequence-chunk')) {
            _this.moveChunk($(this), ui.draggable);
          } else {
            _this.insertFromAvailableSequence($(this), ui.draggable);
          }
        }
      });

      this.$('.designer-designed-sequence-empty-placeholder').droppable({
        activeClass: 'active',
        tolerance: 'pointer',
        drop: function(event, ui) {
          _this.insertFirstAnnotationFromAvailableSequence(ui.draggable);
        }
      });
    }
  });

  return DesignedSequenceView;
});