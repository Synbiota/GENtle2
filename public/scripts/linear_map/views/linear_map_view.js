import Backbone from 'backbone';
import Gentle from 'gentle';
import template from '../templates/linear_map_view.hbs';
import _ from 'underscore';
import RestrictionEnzymes from '../../sequence/lib/restriction_enzymes';

export default Backbone.View.extend({
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
      'change:sequence change:features.* change:features change:displaySettings.rows.res.*',
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
      $featureElement = this.$('[data-feature_id="'+feature.id+'"]');

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
    var featureId = $(event.currentTarget).data('feature_id'),
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
        positionMarks: this.positionMarks,
        enzymes: this.enzymes
      };
    }
  },

  refresh: function(render) {
    this.processFeatures();
    this.processPositionMarks();
    this.processEnzymes();
    if(render !== false) this.render();
  },

  processPositionMarks: function() {
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

  processEnzymes: function() {
    var model = this.model;
    var displaySettings = model.get('displaySettings.rows.res') || {};
    var enzymes = RestrictionEnzymes.getAllInSeq(model.get('sequence'), {
      length: displaySettings.lengths || [],
      customList: displaySettings.custom || [],
      hideNonPalindromicStickyEndSites: displaySettings.hideNonPalindromicStickyEndSites || false
    });

    this.enzymes = _.map(enzymes, function(enzymeArray, position) {
      var label = enzymeArray[0].name;
      if(enzymeArray.length > 1) label += ' +' + (enzymeArray.length - 1);
      return {position, label};
    });
  },

  positionEnzymes: function() {
    var maxBase = this.sequenceCanvas.maxVisibleBase();

    _.each(this.$('.linear-map-enzyme'), (element) => {
      var $element = this.$(element);
      var relativePosition = $element.data('position')/ maxBase * 100 ;
      $element.css('top', relativePosition + '%');
    });
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

  scrollSequenceCanvas: function() {
    this.sequenceCanvas.scrollTo(Math.floor(
      this.$scrollHelper.position().top /
      this.$el.height() * 
      this.sequenceCanvas.$scrollingChild.height()
    ), false);
  },

  afterRender: function() {
    if(this.initialRender) {
      var sequenceCanvas = this.parentView().sequenceCanvas;
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
      this.positionEnzymes();

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