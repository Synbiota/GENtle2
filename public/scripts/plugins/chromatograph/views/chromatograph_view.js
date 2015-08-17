import Gentle from 'gentle';
import Backbone from 'backbone';
import Q from 'q';
import ContextMenuView from '../../../common/views/context_menu_view';

import template from '../templates/sequence_chromatograph_view.hbs';

import ChromatographCanvas from '../lib/canvas/chromatograph_canvas';
import ChromatographMapView from '../views/chromatograph_map_view';
import ChromatographLegendView from './chromatograph_legend_view';
import ChromatographImportPromptView from './chromatograph_import_prompt_view';

// import ChromatographSettingsView from './chromatograph_settings_view';
// import LinearMapView from '../../linear_map/views/linear_map_view';
// import PlasmidMapView from '../../plasmid_map/views/plasmid_map_view';
// import MatchedEnzymesView from './matched_enzymes_view';

/**
@module Sequence
@submodule Views
@class SequenceEditionView
**/
export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'sequence-view',

  initialize: function() {
    var _this = this;

    this.model = Gentle.currentSequence;

    this.contextMenuView = new ContextMenuView({context: 'sequence'});

    // this.matchedEnzymesView = new MatchedEnzymesView();
    // this.setView('.sequence-matched-enzymes-outlet', this.matchedEnzymesView);

    this.initSecondaryViews();


    this.listenTo(this.model, 'add:chromatogramFragment remove:chromatogramFragment', function(chromatogramFragments){
      if (chromatogramFragments.length){
        this.$el.find('.chromatograph-import-wrapper').hide();
      } else {
        this.$el.find('.chromatograph-import-wrapper').show();
      }
    })

    var _this = this;

    // // Fix this later, this is a zombie bind.
    $(window).on('resize.chromatographCanvas', function(){
      _this.handleResizeTop();
    });

    // $(window).on('resize', function(){this.handleResizeTop)


  },

  initSecondaryViews: function(trigger) {
    var secondaryViews,
        currentView;

    secondaryViews = _.chain(Gentle.plugins)
      .where({type: 'sequence-secondary-view'})
      .pluck('data')
      .value();

    secondaryViews.push({
      name: 'chromatograph',
      title: 'Chromatograph Map',
      view:   ChromatographMapView
    });

    // secondaryViews.push({
    //   name: 'linear',
    //   title: 'Linear map',
    //   view: LinearMapView
    // });

    // secondaryViews.push({
    //   name: 'plasmid',
    //   title: 'Plasmid map',
    //   view: PlasmidMapView
    // });

    // currentView = this.model.get('isCircular') ? 'plasmid' : 'linear';
    currentView = 'chromatograph';

    // if(!~_.pluck(secondaryViews, 'name').indexOf(currentView))
    //   currentView = 'linear';

    this.secondaryViews = secondaryViews;
    this.changeSecondaryView(currentView, false);
  },

  // handleResizeRight: function(trigger) {
  //   // $('#sequence-canvas-primary-view-outlet, .sequence-canvas-outlet').css({
  //   //   // 'right': this.secondaryView.$el.width(),
  //   //   // top: this.secondaryView.$el.outerHeight()
  //   // });

  //   if(trigger !== false) {
  //     this.trigger('resize');
  //     this.secondaryView.trigger('resize');
  //   }
  // },

  handleResizeTop: function(trigger) {
    this.$('#sequence-canvas-main').css({
      height: this.$el.outerHeight() - this.secondaryView.$el.outerHeight(),
    });

    if(trigger !== false) {
      this.trigger('resize');
      this.secondaryView.trigger('resize');
    }
  },

  secondaryViewRightPos: function() {
    return $('#sequence-secondary-view-outlet').width();
  },

   primaryViewLeftPos: function() {
    return $('#sequence-primary-view-outlet').width();
  },

  changeSecondaryView: function(viewName, render) {
    var secondaryViewClass = _.findWhere(this.secondaryViews, {name: viewName});
    if(this.secondaryView) this.secondaryView.remove();
    this.secondaryView = new secondaryViewClass.view({
      horizontal: true
    });

    this.model.set('displaySettings.secondaryView', viewName).throttledSave();

    this.setView('#sequence-canvas-secondary-view-outlet', this.secondaryView);
    var secondaryViewPromise;
    if(render !== false) {
      secondaryViewPromise = this.secondaryView.render();
    } else {
      secondaryViewPromise = Q.resolve();
    }
    // `handleResizeRight` requires secondaryView to be rendered so that
    // it (`this.secondaryView.$el.width()`) is the correct value.
    secondaryViewPromise.then(() => {
      this.handleResizeTop(false);
      // this.handleResizeRight(false);
      if(render !== false) {
       this.sequenceCanvas.refresh();
      }
    });
  },

  beforeRender: function(){

    var promptView = new ChromatographImportPromptView({
      model: this.model
    });

    this.setView('.chromatograph-import-prompt', promptView);

    promptView.render();


    var legendView = new ChromatographLegendView({
      model: this.model
    });

    this.setView('.chromatograph-canvas-legend', legendView);

    legendView.render();
  },

  afterRender: function() {

    if (this.model.get('chromatogramFragments').length){
      this.$el.find('.chromatograph-import-wrapper').hide();
    } else {
      this.$el.find('.chromatograph-import-wrapper').show();
    }

    // this.$('.sequence-canvas-outlet').css({
    //   top: this.secondaryView.$el.outerHeight()
    //   // 'right': this.secondaryView.$el.width(),
    // });

    this.$('#sequence-canvas-main').css({
      top: this.secondaryView.$el.outerHeight(),
      position: 'absolute',
      width: '100%',
      height: this.$el.outerHeight() - this.secondaryView.$el.outerHeight(),
    });

    var sequence = this.model;

    var sequenceCanvas = this.sequenceCanvas = new ChromatographCanvas({
      sequence: sequence,
      container: this.$('.sequence-canvas-outlet').first(),
      legend: this.$('#sequence-canvas-chromatograph-legend').first(),
      yOffset: sequence.get('displaySettings.yOffset'),
      // non library options
      contextMenu: this.contextMenuView,
      view: this
    });

    sequenceCanvas.refresh();
  },

  cleanup: function() {
    $(window).off('chromatographCanvas')
  }

});
