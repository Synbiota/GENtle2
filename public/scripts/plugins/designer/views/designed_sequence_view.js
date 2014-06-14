define(function(require) {
  var Backbone = require('backbone.mixed'),
      template = require('hbars!../templates/designed_sequence_view'),
      SynbioData = require('common/lib/synbio_data'),
      DesignedSequenceView;

  DesignedSequenceView = Backbone.View.extend({
    template: template,
    manage: true,

    processChunks: function() {
      var id = -1,
          features = [],
          chunks = [],
          chunkId = -1,
          lastChunkEndBase = 0,
          lastBase = this.model.length() - 1,
          _this = this;

      _.each(_.reject(this.model.get('features'), function(feature) {
        var featureTypeData = SynbioData.featureTypes[feature._type];
        return false;
        return !featureTypeData || !featureTypeData.is_main_type;
      }), function(feature) {
        _.each(feature.ranges, function(range) {
          features.push({
            name: feature.name,
            id: ++id,
            featureId: feature._id,
            from: range.from,
            to: range.to,
            type: feature._type.toLowerCase()
          });
        });
      });

      features = _.sortBy(features, function(feature) {
        return feature.from;
      });

      _.each(features, function(feature) {
        if(feature.from > lastChunkEndBase + 1) {
          chunks.push({
            id: ++chunkId,
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
          empty: true,
          from: lastChunkEndBase + 1,
          to: lastBase,
          length: lastBase - lastChunkEndBase
        });
      }

      this.chunks = chunks;
      return chunks;
    },

    positionChunks: function() {
      var availableWidth = this.$('.designer-designed-sequence-chunks').width(),
          sequenceLength = this.model.length(),
          chunks = this.chunks;

      _.each(this.$('.designer-designed-sequence-chunk'), function(chunkElem) {
        var $chunkElem = $(chunkElem),
            chunk = _.findWhere(chunks, {id: $chunkElem.data('chunkId')});

        $chunkElem
          .css('width',Math.floor(availableWidth * chunk.length / sequenceLength))
          .addClass(chunk.empty ?
            'designer-designed-sequence-chunk-empty' :
            'designer-designed-sequence-chunk-' + chunk.feature._type
          );
      });
    },

    serialize: function() {
      if(this.model.maxOverlappingFeatures() > 1) {
        return {
          sequence: this.model.serialize(),
          disabled: true
        };
      } else {
        if(this.model.length()) {
          return {
            sequence: this.model.serialize(),
            chunks: this.processChunks()
          };
        }
      }
    },

    insertFromAvailableSequence: function($droppable, $draggable) {
      var sequenceId, availableSequenceView, 
          feature, subSeq, chunk, insertBeforeBase;

      sequenceId = $draggable.closest('[data-sequence-id]').data('sequenceId');

      availableSequenceView = this.parentView
        .getAvailableSequenceViewFromSequenceId(sequenceId);

      feature = _.findWhere(availableSequenceView.features, {
        id: $draggable.data('featureId')
      });

      subSeq = availableSequenceView.model.getSubSeq(feature.from, feature.to);

      chunk = _.findWhere(this.chunks, {
        id: $droppable.closest("[data-chunk-id]").data('chunkId')
      });

      insertBeforeBase = $droppable.hasClass('designer-designed-sequence-chunk-droppable-before') ? 
        chunk.from : 
        chunk.to + 1;

      console.log($droppable, chunk.from, chunk.to+1, insertBeforeBase)

      this.model.insertBasesAndCreateFeature(insertBeforeBase, subSeq, feature.feature, true);
      this.render();
    },

    afterRender: function() {
      var _this = this;
      this.positionChunks();
      this.$('.designer-designed-sequence-chunk-droppable').droppable({
        hoverClass: 'active',
        tolerance: 'pointer',
        drop: function(event, ui) {
          _this.insertFromAvailableSequence($(this), ui.draggable);
        }
      });
    }
  });

  return DesignedSequenceView;
});