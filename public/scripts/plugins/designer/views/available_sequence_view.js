define(function(require) {
  var Backbone = require('backbone'),
      template = require('../templates/available_sequence_view.hbs'),
      SynbioData = require('../../../common/lib/synbio_data'),
      Gentle = require('gentle'),
      draggableCleanup = require('../lib/draggable_cleanup'),
      AvailableSequenceView;

  AvailableSequenceView = Backbone.View.extend({
    template: template,
    manage: true,
    className: 'designer-available-sequence',
    minFeatureWidth: 4,

    initialize: function(){
      this.listenTo(Gentle.currentSequence, 'change', this.render, this);
      this.features = [];
      this.availableSequences = Gentle.sequences.without(this.model);
    },

    processFeatures: function() {
      var id = 0,
          _this = this;

      this.features = [];
      this.sequence =[];

      _.each(_.reject(this.model.get('features'), function(feature) {
        var featureTypeData = SynbioData.featureTypes[feature._type];
        return false;
        return !featureTypeData || !featureTypeData.is_main_type;
      }), function(feature) {
        _.each(feature.ranges, function(range) {
          _this.features.push({
            name: feature.name,
            id: ++id,
            from: range.from,
            to: range.to,
            reverseComplement: range.reverseComplement,
            _type: feature._type.toLowerCase(),
            feature: feature
          });
        });
      });

      this.features = _.sortBy(this.features, function(feature) {
        return feature.from;
      });

      var sequenceId = this.model.get('id');
      this.sequenceInfo = {
        name: this.model.get('name'),
        id: sequenceId,
        from: 0,
        to: this.model.length()-1,
        length: this.model.length(),
        type: 'Sequence',
        features: this.model.get('features'),
        hidden: this.model.maxOverlappingFeatures()>1,
        usable: this.parentView().isUsable(sequenceId),
      };
    },

    positionFeatures: function() {
      var maxBase = this.maxBaseForCalc || this.model.length(),
          viewWidth = this.$el.width(),
          $featureElement, feature, featureWidth,sequence,
          overlapStack = [], overlapIndex,
          maxOverlapStackIndex = 0, length,
          $featuresElem;

       for(var i = 0; i < this.features.length; i++) {
        feature = this.features[i];
        featureWidth = Math.max(
          Math.floor((feature.to - feature.from + 1) / maxBase * viewWidth), 
          this.minFeatureWidth
        );
        $featureElement = this.$('[data-feature-id="'+feature.id+'"]');

        $featureElement.css({
          left: Math.floor(feature.from / maxBase * viewWidth),
          width: featureWidth
        });

        overlapIndex = overlapStack.length;

        for(var j = overlapStack.length - 1; j >= 0; j--) {
          if(overlapStack[j] === undefined || overlapStack[j][1] <= feature.from) {
            overlapStack[j] = undefined;
            overlapIndex = j;
          }
        }

        $featureElement.addClass('designer-available-sequence-feature-stacked-'+overlapIndex);
        overlapStack[overlapIndex] = [feature.from, feature.to];
        maxOverlapStackIndex = Math.max(maxOverlapStackIndex, overlapStack.length);
      }
      $featuresElem = this.$('.designer-available-sequence-features');
      $featuresElem.addClass('designer-available-sequence-features-max-overlap-' + maxOverlapStackIndex);
    },

    serialize: function() {
      this.processFeatures();
      return {
        sequence: this.sequenceInfo,
        features: this.features,
        hideAnnotations: Gentle.currentUser.get('displaySettings.designerView.hideAnnotations') || false,
      };
    },

    afterRender: function() {
      this.positionFeatures();

      // this.$('.designer-available-sequence-feature').draggable({
      //   refreshPositions: true,
      //   revert: 'invalid',
      //   helper: 'clone',
      //   cursorAt: {
      //     top: 5,
      //     left: 5
      //   }
      // });
      var sequenceId = this.model.get('id');
      this.$('.designer-available-sequence-entireseq').draggable({
        refreshPositions: true,
        revert: 'invalid',
        helper: 'clone',
        cursorAt: {
          top: 5,
          left: 5
        }
      }).hover(
      (event) => {
        this.parentView().hoveredOverSequence(sequenceId);
      },
      (event) => {
        this.parentView().unhoveredOverSequence(sequenceId);
      });
    },

    cleanUpDraggable: function() {
      draggableCleanup(
        this, 
        '.designer-available-sequence-entireseq'
      );
    },

    beforeRender: function() {
      this.cleanUpDraggable();
    },

    remove: function() {
      this.cleanUpDraggable();
      Backbone.View.prototype.remove.apply(this, arguments);
    },

  });

  return AvailableSequenceView;
});