import Backbone from 'backbone';
import Gentle from 'gentle';
import Q from 'q';
import {handleError} from '../../../common/lib/handle_error';
import Artist from '../../../common/lib/graphics/artist';
import template from '../templates/chromatograph_map_view.hbs';
import _ from 'underscore';
// import RestrictionEnzymes from '../../sequence/lib/restriction_enzymes';
import ChromatographMapCanvas from './chromatograph_map_canvas';

import tooltip from 'tooltip';

export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'chromatograph-map',
  minPositionMarkInterval: 60,
  initialRender: true,

  events: {
    'click .chromatograph-toggle-dropdown'  : 'toggleDropdown',
    'click .sequence-fragment.chromatograph-map-fragment'     : 'goToFragment',
    'mouseenter .sequence-fragment.chromatograph-map-fragment': 'showFragmentTooltip',
    'mouseleave .sequence-fragment.chromatograph-map-fragment': 'hideFragmentTooltip',
    'click .chromatograph-map-defect-mark'  : 'goToDefect',
    'click canvas'                          : 'goToBase'
    // 'click .linear-map-feature': 'goToFeature'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
    this.minFeatureWidth = 4;
    this.topFeatureOffset = 0;


    // _.bindAll(this, 'scrollSequenceCanvas');

    _.bindAll(this,
      'scrollSequenceCanvas',
      // 'updateScrollHelperPosition',
      'updateCursor'
    );

    var _this = this;

    this.listenTo(this.model, 'reverseComplement:chromatogramFragment', function(){
      _this.processFragments();
      _this.processDefectMarks();
    })

    this.listenTo(
      this.model,
      'change:sequence change:features.* change:features change:displaySettings.rows.res.*',
      _.debounce(this.render, 500),
      this
    );

    this.listenTo(
      this.model.get('chromatogramFragments'),
      'add remove reverseComplement',
      _.debounce(this.render, 500),
      // this.render,
      this
    );

  },

  mapWidth: function(){
    return this.$('.chromatograph-map-container').width();
  },

  toggleDropdown: function(e){
    e.preventDefault();
    this.$el.toggleClass('open');

  },

  processFragments: function() {
    var id = -1,
        _this = this;

    this.fragments = [];

    this.model.get('chromatogramFragments').forEach(function(fragment, i){

      var position = fragment.get('position') || 0,
          length   = fragment.getLength() || 0,
          sequenceLength = _this.model.getLength();
      // if (fragment.map) position = fragment.map.position;

      _this.fragments.push({
        id: ++id,
        name: fragment.get('name') || 'Fragment ' + id,
        from: position,
        to: position + length,
        offsetPercent: position/sequenceLength * 100,
        widthPercent: length/sequenceLength * 100,
        arrowDirection: fragment.get('isComplement') ? 'left' : 'right'
      });
    });
  },

  goToBase: function(e) {
    var sequenceCanvas = this.sequenceCanvas,
        sequence = sequenceCanvas.sequence,
        ls = sequenceCanvas.layoutSettings,
        base = Math.floor(e.offsetX/this.mapWidth() * sequence.getLength())

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

  goToFeature: function(event) {
    var featureId = $(event.currentTarget).data('feature_id'),
        feature = _.findWhere(this.features, {id: featureId});

    this.sequenceCanvas.scrollToBase(feature.from);

    event.preventDefault();
  },

  serialize: function() {

    this.processFragments();
    this.processPositionMarks();
    this.processDefectMarks();

    return {
      defectMarks: this.defectMarks,
      fragments: this.fragments,
      positionMarks: this.positionMarks,
    };
  },

  // refresh: function(render) {
  //   var _this = this;

  //   _this.processFragments();
  //   _this.processPositionMarks();
  //   _this.processDefectMarks();

  //   // if(render) {
  //     console.log('awegaweg', render)
  //     _this.render();
  //   // }

  // },

  processPositionMarks: function() {
    var sequenceCanvas = this.sequenceCanvas,
        length = this.mapWidth(),
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
            offsetPercent: i / maxBase * 100
          };

      this.positionMarks.push(data);
    }

  },

  processDefectMarks: function(){
    var maxBase = this.model.getLength(),
        consensus = this.model.getConsensus(),
        markThreshold = 40,
        _this = this,
        mark, prevMark;

    this.defectMarks = [];

    _.forEach(consensus, function(base, i){

      if (
          (consensus[i] == '-') &&
            (!_this.defectMarks.length ||
              ((consensus[i - 1] != '-') && ((i - _this.defectMarks[_this.defectMarks.length - 1].base) > markThreshold)))
          ){

        mark = {
          base: i,
          offsetPercent: i / maxBase * 100
        };

        _this.defectMarks.push(mark);

        prevMark = i;
      }

    });

  },

  // setupScrollHelper: function() {
  //   var sequenceCanvas = this.sequenceCanvas,
  //       $scrollHelper = this.$('.linear-map-visible-range'),
  //       scrollingParentHeight = sequenceCanvas.$scrollingParent.height(),
  //       scrollingChildHeight = sequenceCanvas.$scrollingChild.height(),
  //       elemHeight = this.$el.height(),
  //       elemWidth = this.mapWidth();


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
  //       elemWidth = this.mapWidth();

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
         $cursor = this.$('.chromatograph-map-cursor');


    this.$cursor = $cursor;

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
        elemWidth = this.mapWidth(),
        scrollingParentWidth = sequenceCanvas.$scrollingParent.width(),
        scrollingChildWidth = sequenceCanvas.$scrollingChild.width();

    $cursor.css({
      width: (scrollingParentWidth / scrollingChildWidth * 100) + '%',
      left: (sequenceCanvas.layoutHelpers.xOffset / scrollingChildWidth * 100) + '%'
    });

    // Jquery substituation used instead of serialize instead of render for performance.
    this.$('.cursor-start').html(Math.floor(lh.xOffset/ls.basePairDims.width));


  },

  scrollSequenceCanvas: function() {
    this.sequenceCanvas.scrollTo(Math.floor(
      this.$cursor.position().left /
      this.mapWidth() *
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

      // this.listenTo(sequenceCanvas, 'scroll', this.updateCursor);

      // this.listenTo(sequenceCanvas, 'change:layoutHelpers resize', function(){
      //   this.refresh(null)
      // })

      // this.listenTo(
      //   sequenceCanvas,
      //   'scroll',
      //   this.updateScrollHelperPosition,
      //   this
      // );

      var _this = this;

      sequenceCanvas.on(
        'change:layoutHelpers resize',
        function(){
          _this.initializeCursor()
        }
      );

      sequenceCanvas.on('scroll', this.updateCursor)

      // this.render();


    } else {
      this.initializeCursor();



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

  showFragmentTooltip: function(event){
    var fragmentId = $(event.currentTarget).data('fragment-id'),
        fragment = _.findWhere(this.fragments, {id: fragmentId});

    tooltip.show(fragment.name);
  },

  hideFragmentTooltip: function(){
    tooltip.hide();
  }

});
