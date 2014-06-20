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

    processChunks: function() {
      var id = -1,
          features = [],
          chunks = [],
          chunkId = -1,
          lastChunkEndBase = -1,
          lastBase = this.model.length() - 1,
          _this = this;

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
          feature: feature,
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
          sequence: this.model.serialize()
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
          featureAndSubSeq = this.getFeatureFromDraggable($draggable);
     
      chunk = _.findWhere(this.chunks, {
        id: $droppable.closest("[data-chunk-id]").data('chunkId')
      });

      insertBeforeBase = $droppable.hasClass('designer-designed-sequence-chunk-droppable-before') ? 
        chunk.from : 
        chunk.to + 1;

     if(featureAndSubSeq.feature._type !== undefined && featureAndSubSeq.feature._type === 'sequence'){

      console.log('1');

      this.model.deleteBases( featureAndSubSeq.feature.from , Math.abs(featureAndSubSeq.feature.to- featureAndSubSeq.feature.from)+2 ,false);
      this.model.insertBases(featureAndSubSeq.subSeq,insertBeforeBase,false);
      this.render();
     }
     else
     if(featureAndSubSeq.feature.type==='Sequence')
     {
            console.log('2');
      this.model.insertSequenceAndCreateFeature(insertBeforeBase, featureAndSubSeq.subSeq, featureAndSubSeq.feature, true);
     }
     else 
     if(featureAndSubSeq.feature.type !== 'Sequence' && featureAndSubSeq.feature.feature === undefined)
     {
      featureObj = _.findWhere(this.model.get('features'),{_id:featureAndSubSeq.feature.featureId});
      basesRange = _.findWhere(this.model.get('features'),{_id:featureAndSubSeq.feature.featureId}).ranges[0];
      bases = this.model.getSubSeq(basesRange.from,basesRange.to);
      this.model.deleteFeature(featureObj,false);
      featureObj.ranges = [{from: insertBeforeBase,to:(basesRange.to-basesRange.from )+ insertBeforeBase}];
      this.model.createFeature(featureObj, false);
     }
     else
     {
      console.log('4');
      this.model.insertBasesAndCreateFeature(insertBeforeBase, featureAndSubSeq.subSeq, featureAndSubSeq.feature.feature, true);
     }
    },

    insertFirstAnnotationFromAvailableSequence: function($draggable) {
      var featureAndSubSeq = this.getFeatureFromDraggable($draggable);
      this.model.insertBasesAndCreateFeature(0, featureAndSubSeq.subSeq, featureAndSubSeq.feature.feature, true);
    },

   getFeatureFromDraggable: function($draggable) {
      var sequenceId, availableSequenceView, sequence, feature, dataChunkId;
      chunkId = $draggable.data('chunkId');
      this.model = Gentle.currentSequence;
      if(chunkId === undefined) 
      {
       sequenceId = $draggable.closest('[data-sequence-id]').data('sequenceId');
       availableSequenceView = this.parentView
        .getAvailableSequenceViewFromSequenceId(sequenceId);
       feature = _.findWhere(availableSequenceView.features, {
        id: $draggable.data('featureId')
      });
      sequence =_.findWhere(availableSequenceView.sequence, {
        id: 0
      });
      }
      else
      if(chunkId !== undefined){
      if(!_.findWhere(this.model.chunks,{id:chunkId}).empty)
        feature = _.findWhere(this.model.chunks,{id:chunkId}).feature;
      if(_.findWhere(this.model.chunks,{id:chunkId}).empty){
        sequence = _.findWhere(this.model.chunks,{id:chunkId});
      }
      }

      if(feature){
      return {
        feature: feature,
        subSeq: (availableSequenceView===undefined)? this.model.getSubSeq(feature.from,feature.to) : availableSequenceView.model.getSubSeq(feature.from, feature.to)
      };}
      if(sequence){
      return {
        feature: sequence,
        subSeq: (availableSequenceView===undefined)? this.model.get('sequence').substr(sequence.from, sequence.to) : availableSequenceView.model.getSubSeq(sequence.from, sequence.to)
      }; 
      }
    },

    afterRender: function() {
      var _this = this;
      this.styleChunks();
      this.$('.designer-designed-sequence-chunk').draggable({axis: "y", zIndex: 2000, revert: true, revertDuration: 100, opacity: 0.85, containment:[, 100, , ]});
      this.$('.designer-designed-sequence-chunk-droppable').droppable({
        hoverClass: 'active',
        tolerance: 'pointer',
        drop: function(event, ui) {
          _this.insertFromAvailableSequence($(this), ui.draggable);
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