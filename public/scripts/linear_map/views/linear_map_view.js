import Backbone from 'backbone';
import Gentle from 'gentle';
import template from '../templates/linear_map_view.hbs';
import _ from 'underscore';
import RestrictionEnzymes from 'gentle-restriction-enzymes';
import tooltip from 'tooltip';
import tooltipTemplate from 'gentle-sequence-canvas/lines/_feature_tooltip_template.html';
import SVG from 'svg.js';



function onFeatureMouseOver(sequenceCanvas, {name, from: frm, to, _id}) {
  SVG.select(`.svg-feature-${_id}`).addClass('active');
  sequenceCanvas.highlightBaseRange(frm, to);
  tooltip.show(tooltipTemplate({
    name,
    from: _.formatThousands(frm + 1),
    to: _.formatThousands(to + 1),
    size: _.formatThousands(to - frm + 1)
  }));
}

function onFeatureMouseOut(sequenceCanvas, {_id}) {
   SVG.select(`.svg-feature-${_id}`).removeClass('active');
   sequenceCanvas.highlightBaseRange();
   tooltip.hide();
}

function onFeatureClick(sequenceCanvas, {from: frm, to}) {
  sequenceCanvas.focus();
  sequenceCanvas.select(frm, to);
  sequenceCanvas.scrollToBase(frm);
  sequenceCanvas.scrollBaseToVisibility(to).then(function() {
    sequenceCanvas.displayCaret(to+1);
  });
}


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

    _.bindAll(this,
      'scrollSequenceCanvas',
      'updateScrollHelperPosition',
      'refresh'
    );

    this.listenTo(
      this.model,
      'change:sequence change:features.* change:features change:displaySettings.rows.res.*',
      _.debounce(this.refresh, 500)
    );
  },

  processFeatures: function() {
    var id = -1,
        _this = this;

    this.features = [];

    _.each(this.model.getFeatures(), function(feature) {
      _.each(feature.ranges, function(range) {
        _this.features.push({
          name: feature.name,
          id: ++id,
          _id: feature._id,
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
    var maxBase = this.maxBaseForCalc || this.model.getLength(),
        viewHeight = this.$el.height(),
        $featureElement, featureWidth,
        overlapStack = [], overlapIndex;

    _.each(this.features, (feature) => {
      featureWidth = Math.max(
        Math.floor((feature.to - feature.from + 1) / maxBase * viewHeight),
        this.minFeatureWidth
      );
      $featureElement = this.$('[data-feature_id="'+feature.id+'"]');

      $featureElement.css({
        width: featureWidth,
        top: Math.floor(feature.from / maxBase * viewHeight) + this.topFeatureOffset
      });

      var sequenceCanvas = this.sequenceCanvas;

      $featureElement.on('mouseover', _.partial(
        onFeatureMouseOver,
        sequenceCanvas, feature
      ));

      $featureElement.on('mouseout', _.partial(
        onFeatureMouseOut,
        sequenceCanvas, feature
      ));

      $featureElement.on('click', _.partial(
        onFeatureClick,
        sequenceCanvas, feature
      ));

      overlapIndex =  overlapStack.length;

      for(var j = overlapStack.length - 1; j >= 0; j--) {
        if(overlapStack[j] === undefined || overlapStack[j][1] <= feature.from) {
          overlapStack[j] = undefined;
          overlapIndex = j;
        }
      }

      $featureElement.addClass('linear-map-feature-stacked-'+overlapIndex);

      overlapStack[overlapIndex] = [feature.from, feature.to];
    });
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

  displayEnzymes: function() {
    return this.model.get('displaySettings.rows.res.display');
  },

  refresh: function(render) {
    this.processFeatures();
    this.processPositionMarks();
    if(this.displayEnzymes()) {
      this.processEnzymes();
    } else {
      this.enzymes = [];
    }

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
    var enzymes = RestrictionEnzymes.getAllInSeq(model.getSequence(), {
      // length: displaySettings.lengths || [],
      customList: displaySettings.custom || [],
      // hideNonPalindromicStickyEndSites: displaySettings.hideNonPalindromicStickyEndSites || false
      hideNonPalindromicStickyEndSites: false
    });

    this.enzymes = _.compact(_.map(enzymes, function(enzymeArray, position) {
      position = position^0;

      enzymeArray = _.filter(enzymeArray, function(enzyme) {
        return model.isRangeEditable(position, position + enzyme.seq.length);
      });

      if(enzymeArray.length === 0) return;
      var label = enzymeArray[0].name;
      if(enzymeArray.length > 1) label += ' +' + (enzymeArray.length - 1);
      return {position, label};
    }));
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

      sequenceCanvas.on('scroll', this.updateScrollHelperPosition);
      sequenceCanvas.on('change:layoutHelpers', this.refresh);
    } else {

      this.setupScrollHelper();
      this.positionFeatures();
      if(this.displayEnzymes()) this.positionEnzymes();

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

  cleanup: function() {
    if(this.sequenceCanvas) {
      this.sequenceCanvas.off('scroll', this.updateScrollHelperPosition);
      this.sequenceCanvas.off('change:layoutHelpers', this.refresh);
    }
  }

});
