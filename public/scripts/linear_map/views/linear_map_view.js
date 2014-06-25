define(function(require) {
  var Backbone        = require('backbone.mixed'),
      Gentle          = require('gentle')(),
      template        = require('hbars!linear_map/templates/linear_map_view'),
      LinearMapView;

  LinearMapView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'linear-map',
    minPositionMarkInterval: 60,
    initialRender: true,

    events: {
      'click .linear-map-feature': 'goToFeature'
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.minFeatureWidth = 4;
      this.topFeatureOffset = 0;
      _.bindAll(this, 'scrollSequenceCanvas');

      this.listenTo(
        this.model, 
        'change:sequence change:features.* change:features',
        _.debounce(this.refresh, 500),
        this
      );
    },

    processFeatures: function() {
      var id = -1,
          _this = this;

      this.features = [];

      _.each(this.model.get('features'), function(feature) {
        _.each(feature.ranges, function(range) {
          _this.features.push({
            name: feature.name,
            id: ++id,
            from: range.from,
            to: range.to,
            type: feature._type.toLowerCase()
          });
        });
      });

      this.features = _.sortBy(this.features, function(feature) {
        return feature.from;
      });
    },

    positionFeatures: function() {
      var maxBase = this.maxBaseForCalc || this.model.length(),
          viewHeight = this.$el.height(),
          $featureElement, feature, featureWidth,
          overlapStack = [], overlapIndex;

      for(var i = 0; i < this.features.length; i++) {
        feature = this.features[i];
        featureWidth = Math.max(
          Math.floor((feature.to - feature.from + 1) / maxBase * viewHeight), 
          this.minFeatureWidth
        );
        $featureElement = this.$('[data-feature-id="'+feature.id+'"]');

        $featureElement.css({
          width: featureWidth,
          top: Math.floor(feature.from / maxBase * viewHeight) + this.topFeatureOffset,
        });

        overlapIndex =  overlapStack.length;

        for(var j = overlapStack.length - 1; j >= 0; j--) {
          if(overlapStack[j] === undefined || overlapStack[j][1] <= feature.from) {
            overlapStack[j] = undefined;
            overlapIndex = j;
          }
        }

        $featureElement.addClass('linear-map-feature-stacked-'+overlapIndex);

        overlapStack[overlapIndex] = [feature.from, feature.to];
      }
    },

    goToFeature: function(event) {
      var featureId = $(event.currentTarget).data('featureId'),
          feature = _.findWhere(this.features, {id: featureId});

      this.sequenceCanvas.scrollToBase(feature.from);

      event.preventDefault();
    },

    serialize: function() {
      if(this.initialRender) {
        return {};
      } else {
        return {
          features: this.features,
          positionMarks: this.positionMarks
        };
      }
    },

    refresh: function(render) {
      this.processFeatures();
      this.processPositionMarks();
      if(render !== false) this.render();
    },

    processPositionMarks: function(layoutHelpers) {
      var sequenceCanvas = this.sequenceCanvas,
          height = this.$el.height(),
          maxBase = sequenceCanvas.maxVisibleBase(),
          magnitudeOrder = Math.floor(Math.log10(maxBase)),
          divider = Math.pow(10, magnitudeOrder - 1),
          maxBaseForCalc = Math.ceil(maxBase / divider) * divider;

      this.positionMarksInterval = Math.floor(maxBaseForCalc / 10);
      this.maxBaseForCalc = maxBaseForCalc;

      while(this.positionMarksInterval / this.maxBase * height < this.minPositionMarkInterval) {
        this.positionMarksInterval = Math.floor(this.positionMarksInterval * 2);
      }

      this.positionMarks = [];
      for(var i = 0; i < maxBase; i += this.positionMarksInterval) {
        this.positionMarks.push({
          base: i,
          label: _.formatThousands(i+1),
          top: Math.floor(i / maxBase * height)
        });
      }


    },

    // positionPositionMarks: function() {
    //   var _this = this;
    //   this.$('linar-map-position-mark').each(function(i, element) {
    //     var $mark = $(element);
    //     $mark.css({
    //       top: Math.floor($mark.data('base') / _this.maxBase * canvasHeight)
    //     });
    //   });
    // },

    setupScrollHelper: function() {
      var sequenceCanvas = this.sequenceCanvas,
          $scrollHelper = this.$('.linear-map-visible-range'),
          scrollingParentHeight = sequenceCanvas.$scrollingParent.height(),
          scrollingChildHeight = sequenceCanvas.$scrollingChild.height(),
          elemHeight = this.$el.height();

      this.$scrollHelper = $scrollHelper;

      $scrollHelper.height(Math.floor(
        scrollingParentHeight / 
        scrollingChildHeight *
        elemHeight
      )).draggable({
        axis: 'y',
        containment: 'parent',
        drag: _.throttle(this.scrollSequenceCanvas, 50)
      });

      this.updateScrollHelperPosition();
    },

    updateScrollHelperPosition: function() {
      var sequenceCanvas = this.sequenceCanvas,
          $scrollHelper = this.$scrollHelper,
          scrollingChildHeight = sequenceCanvas.$scrollingChild.height(),
          elemHeight = this.$el.height();

      if($scrollHelper) {
        $scrollHelper.css({
          top:  Math.floor( sequenceCanvas.layoutHelpers.yOffset / 
                            scrollingChildHeight * 
                            elemHeight)
        });
      }
    },

    scrollSequenceCanvas: function(event, ui) {
      this.sequenceCanvas.scrollTo(Math.floor(
        this.$scrollHelper.position().top /
        this.$el.height() * 
        this.sequenceCanvas.$scrollingChild.height()
      ), false);
    },

    afterRender: function() {
      if(this.initialRender) {
        var sequenceCanvas = this.parentView.sequenceCanvas;
        this.initialRender = false;
        this.sequenceCanvas = sequenceCanvas;

        this.listenTo(
          sequenceCanvas, 
          'scroll', 
          this.updateScrollHelperPosition, 
          this
        );

        this.listenTo(
          sequenceCanvas,
          'change:layoutHelpers',
          this.refresh,
          this
        );

      } else {

        this.setupScrollHelper();
        this.positionFeatures();

        // When SequenceCanvas' layoutHelpers are calculated, we fetch the
        // max base number (>= sequence length)
        // sequenceCanvas.redraw();
        // sequenceCanvas.afterNextRedraw(function() {
        //   var layoutHelpers = sequenceCanvas.layoutHelpers;
        //   _this.maxBase = layoutHelpers.rows.total * layoutHelpers.basesPerRow - 1;

        //   _this.setupScrollHelper();

        //   _this.positionFeatures();
        // });
      }
    },

  });

  return LinearMapView;

});