define(function(require) {
  var Backbone        = require('backbone.mixed'),
      Gentle          = require('gentle')(),
      template        = require('hbars!linear_map/templates/linear_map_view'),
      LinearMapCanvas = require('linear_map/lib/linear_map_canvas'),
      LinearMapView;

  LinearMapView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'linear-map',

    events: {
      'click .linear-map-feature': 'goToFeature'
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.minFeatureWidth = 4;
      this.topFeatureOffset = -16;
      _.bindAll(this, 'scrollSequenceCanvas')

      this.listenTo(
        this.model, 
        'change:sequence change:features.* change:features',
        _.debounce(this.refresh, 500),
        this
      );

      this.refresh(false);

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
      var maxBase = this.maxBase || this.model.length(),
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
      return {
        features: this.features
      };
    },

    refresh: function(render) {
      this.processFeatures();
      if(this.linearMapCanvas) this.linearMapCanvas.unbind();
      if(render !== false) this.render();
    },

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
      var _this = this,
          sequenceCanvas = Gentle.layout.getView('#content').sequenceCanvas;

      if(this.sequenceCanvas === undefined) {
        this.listenTo(
          sequenceCanvas, 
          'scroll', 
          this.updateScrollHelperPosition, 50, 
          this
        );
      }
      this.sequenceCanvas = sequenceCanvas;

      // When SequenceCanvas' layoutHelpers are calculated, we fetch the
      // max base number (>= sequence length)
      sequenceCanvas.redraw();
      sequenceCanvas.afterNextRedraw(function() {
        var layoutHelpers = sequenceCanvas.layoutHelpers;
        _this.maxBase = layoutHelpers.rows.total * layoutHelpers.basesPerRow - 1;

        _this.setupScrollHelper();

        _this.linearMapCanvas = new LinearMapCanvas({
          maxBase: _this.maxBase,
          $canvas: _this.$('canvas')
        });

        _this.positionFeatures();
      });
      
    },

  });

  return LinearMapView;

});