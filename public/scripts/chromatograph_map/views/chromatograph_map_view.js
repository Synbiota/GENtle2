import Backbone from 'backbone';
import Gentle from 'gentle';
import {handleError} from '../../common/lib/handle_error';
import Q from 'q';
import Artist from '../../common/lib/graphics/artist';
import template from '../templates/chromatograph_map_view.hbs';
import _ from 'underscore';
import RestrictionEnzymes from '../../sequence/lib/restriction_enzymes';
import ChromatographMapCanvas from './chromatograph_map_canvas';


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'chromatograph-map',
  minPositionMarkInterval: 60,
  initialRender: true,

  events: {
    'click .chromatograph-toggle-dropdown': 'toggleDropdown',
    'click .chromatograph-map-fragment': 'goToFragment',
    'click .chromatograph-map-defect-mark': 'goToDefect',
    'click canvas': 'goToBase'
    // 'click .linear-map-feature': 'goToFeature'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
    this.minFeatureWidth = 4;
    this.topFeatureOffset = 0;

    this.tempDims = {
      baseWidth: 10,
      fragmentWidth: 10,
      fragmentHeight: 10,
      fragmentMargin: 10,
      yOffset: 50,
      consensusGoodHeight: 40,
      consensusMediumHeight: 30,
      consensusBadHeight: 20
    }


    // _.bindAll(this, 'scrollSequenceCanvas');

    _.bindAll(this,
      'scrollSequenceCanvas',
      // 'updateScrollHelperPosition',
      'updateCursor',
      'refresh'
    );

    this.listenTo(
      this.model,
      'change:sequence change:features.* change:features change:displaySettings.rows.res.* change:chromatogramFragments',
      _.debounce(this.refresh, 500),
      this
    );

  },

  toggleDropdown: function(e){
    e.preventDefault();
    this.$el.toggleClass('open');

  },

  processFragments: function() {
    var id = -1,
        _this = this;

    this.fragments = [];

    _.forEach(this.model.get('chromatogramFragments'), function(fragment, i){

      var position = 0;

      if (fragment.map) position = fragment.map.position;

      _this.fragments.push({
        id: ++id,
        name: fragment.name || 'Fragment ' + id,
        from: position,
        to: position + fragment.getLength()
      });
    });
  },

  positionFragments: function() {
    var $el, _this = this;

    var baseWidth = this.$el.width()/this.model.getLength();

    _.forEach(this.fragments, function(fragment, i){
      $el = _this.$('[data-fragment-id="'+fragment.id+'"]');

      $el.css({
        left: fragment.from * baseWidth,
        width: (fragment.to - fragment.from) * baseWidth,
        // top: i * featureHeight
      });

    });

  },

  goToBase: function(e) {
    var sequenceCanvas = this.sequenceCanvas,
        sequence = sequenceCanvas.sequence,
        ls = sequenceCanvas.layoutSettings,
        base = Math.floor(e.offsetX/this.$el.width() * sequence.getLength())

    this.sequenceCanvas.scrollToBase(base)

    e.preventDefault();
  },

  goToFragment: function(event) {
    var fragmentId = $(event.currentTarget).data('fragment-id'),
        fragment = _.findWhere(this.fragments, {id: fragmentId});

    this.$el.removeClass('open')
    this.sequenceCanvas.scrollToBase(fragment.from);

    event.preventDefault();
  },

  goToDefect: function(event){
    var base = $(event.currentTarget).data('base');

    console.log(event, base)
    this.sequenceCanvas.scrollToBase(base);
    event.preventDefault();
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
        defectMarks: this.defectMarks,
        fragments: this.fragments,
        // features: this.features,
        positionMarks: this.positionMarks,
        // enzymes: this.enzymes
      };
    }
  },

  // displayEnzymes: function() {
  //   return this.model.get('displaySettings.rows.res.display');
  // },

  refresh: function(render) {
    var _this = this;

    _this.processFragments();
    // _this.processFeatures();
    _this.processPositionMarks();
    _this.processDefectMarks();
    // if(_this.displayEnzymes()) {
    //   _this.processEnzymes();
    // } else {
    //   _this.enzymes = [];
    // }

    if(render !== false) _this.render();

  },

  processPositionMarks: function() {
    var sequenceCanvas = this.sequenceCanvas,
        length = this.$el.width(),
        // maxBase = sequenceCanvas.maxVisibleBase(),
        maxBase = this.model.getLength(),
        magnitudeOrder = Math.floor(Math.log10(maxBase)),
        divider = Math.pow(10, magnitudeOrder - 1),
        maxBaseForCalc = Math.ceil(maxBase / divider) * divider;

    this.positionMarks = [];
    this.positionMarksInterval = Math.floor(maxBaseForCalc / 10);
    this.maxBaseForCalc = maxBaseForCalc;

    while(this.positionMarksInterval / this.maxBase * length < this.minPositionMarkInterval) {
      this.positionMarksInterval = Math.floor(this.positionMarksInterval * 2);
    }

    for(var i = 0; i < maxBase; i += this.positionMarksInterval) {

      var data = {
            base: i,
            label: _.formatThousands(i+1),
            offset: Math.floor(i / maxBase * length)
          };

      this.positionMarks.push(data);
    }

  },

  processDefectMarks: function(){
    var maxBase = this.model.getLength(),
        consensus = this.model.getConsensus(),
        markThreshold = 20,
        _this = this,
        mark, prevMark;

    this.defectMarks = [];

    _.forEach(consensus, function(consensusPoint, i){

      if (
          (consensus[i] < 6) &&
            (!_this.defectMarks.length ||
              ((consensus[i - 1] > 5) && ((i - _this.defectMarks[_this.defectMarks.length - 1].base) > markThreshold)))
          ){

        mark = {
          base: i,
          offset: Math.floor(i / maxBase * _this.$el.width())
        };

        _this.defectMarks.push(mark);

        prevMark = i;
      }

    });

  },

  // processEnzymes: function() {
  //   var model = this.model;
  //   var displaySettings = model.get('displaySettings.rows.res') || {};
  //   var enzymes = RestrictionEnzymes.getAllInSeq(model.getSequence(), {
  //     // length: displaySettings.lengths || [],
  //     customList: displaySettings.custom || [],
  //     // hideNonPalindromicStickyEndSites: displaySettings.hideNonPalindromicStickyEndSites || false
  //     hideNonPalindromicStickyEndSites: false
  //   });

  //   this.enzymes = _.compact(_.map(enzymes, function(enzymeArray, position) {
  //     position = position^0;

  //     enzymeArray = _.filter(enzymeArray, function(enzyme) {
  //       return model.isRangeEditable(position, position + enzyme.seq.length);
  //     });

  //     if(enzymeArray.length === 0) return;
  //     var label = enzymeArray[0].name;
  //     if(enzymeArray.length > 1) label += ' +' + (enzymeArray.length - 1);
  //     return {position, label};
  //   }));
  // },

  // positionEnzymes: function() {
  //   var maxBase = this.sequenceCanvas.maxVisibleBase();

  //   _.each(this.$('.linear-map-enzyme'), (element) => {
  //     var $element = this.$(element);
  //     var relativePosition = $element.data('position')/ maxBase * 100 ;
  //     $element.css('top', relativePosition + '%');
  //   });
  // },

  // setupScrollHelper: function() {
  //   var sequenceCanvas = this.sequenceCanvas,
  //       $scrollHelper = this.$('.linear-map-visible-range'),
  //       scrollingParentHeight = sequenceCanvas.$scrollingParent.height(),
  //       scrollingChildHeight = sequenceCanvas.$scrollingChild.height(),
  //       elemHeight = this.$el.height(),
  //       elemWidth = this.$el.width();


  //   this.$scrollHelper = $scrollHelper;

  //   if (this.horizontal){
  //     $scrollHelper.width(Math.floor(
  //       scrollingParentHeight /
  //       scrollingChildHeight *
  //       elemWidth
  //     ));
  //   } else {
  //     $scrollHelper.height(Math.floor(
  //       scrollingParentHeight /
  //       scrollingChildHeight *
  //       elemHeight
  //     ));
  //   }

  //   $scrollHelper.draggable({
  //       axis: 'y',
  //       containment: 'parent',
  //       drag: _.throttle(this.scrollSequenceCanvas, 50)
  //     });

  //   this.updateScrollHelperPosition();
  // },

  // updateScrollHelperPosition: function() {
  //   var sequenceCanvas = this.sequenceCanvas,
  //       $scrollHelper = this.$scrollHelper,
  //       scrollingChildHeight = sequenceCanvas.$scrollingChild.height(),
  //       elemHeight = this.$el.height(),
  //       elemWidth = this.$el.width();

  //   if($scrollHelper) {
  //     if (this.horizontal){
  //       $scrollHelper.css({
  //         left:  Math.floor( sequenceCanvas.layoutHelpers.yOffset /
  //                           scrollingChildHeight *
  //                           elemWidth)
  //       });
  //     } else {
  //       $scrollHelper.css({
  //         top:  Math.floor( sequenceCanvas.layoutHelpers.yOffset /
  //                           scrollingChildHeight *
  //                           elemHeight)
  //       });
  //     }

  //   }
  // },

  initializeCursor: function() {
    var  sequenceCanvas = this.sequenceCanvas,
         $cursor = this.$('.chromatograph-map-cursor'),
         scrollingParentWidth = sequenceCanvas.$scrollingParent.width(),
         scrollingChildWidth = sequenceCanvas.$scrollingChild.width(),
         elemWidth = this.$el.width();


    this.$cursor = $cursor;

    $cursor.width(Math.floor(
      scrollingParentWidth /
      scrollingChildWidth *
      elemWidth
    ));

    $cursor.draggable({
       axis: 'x',
       containment: 'parent',
       drag: _.throttle(this.scrollSequenceCanvas, 50)
     });

    this.updateCursor();
  },

  updateCursor: function() {
    var $cursor = this.$cursor || this.$('.chromatograph-map-cursor'),
        sequenceCanvas = this.sequenceCanvas,
        ls = sequenceCanvas.layoutSettings,
        lh = sequenceCanvas.layoutHelpers,
        elemWidth = this.$el.width(),
        scrollingChildWidth = sequenceCanvas.$scrollingChild.width();


    $cursor.css({
      left: Math.floor( sequenceCanvas.layoutHelpers.xOffset /
                        scrollingChildWidth *
                        elemWidth)
    });

    // Jquery substituation used instead of serialize instead of render for performance.
    this.$('.cursor-start').html(Math.floor(lh.xOffset/ls.basePairDims.width));


  },

  scrollSequenceCanvas: function() {
    this.sequenceCanvas.scrollTo(Math.floor(
      this.$cursor.position().left /
      this.$el.width() *
      this.sequenceCanvas.$scrollingChild.width()
    ), 0, false);
  },

  afterRender: function() {

    this.chromatographMapCanvas = new ChromatographMapCanvas({
      view: this,
      $canvas: this.$('#chromatograph_map_canvas')
    });

    if(this.initialRender) {
      this.initialRender = false;

      var sequenceCanvas = this.parentView().sequenceCanvas;
      this.sequenceCanvas = sequenceCanvas;

      // this.listenTo(
      //   sequenceCanvas,
      //   'scroll',
      //   this.updateScrollHelperPosition,
      //   this
      // );

      // this.listenTo(
      //   sequenceCanvas,
      //   'change:layoutHelpers',
      //   this.refresh,
      //   this
      // );

      sequenceCanvas.on('scroll', this.updateCursor);


      var _this = this;
      sequenceCanvas.on(
        'change:layoutHelpers',
        this.refresh(null, _this)
      );

    } else {
      this.positionFragments();

      this.initializeCursor();
      // this.positionFeatures();
      // if(this.displayEnzymes()) this.positionEnzymes();

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
