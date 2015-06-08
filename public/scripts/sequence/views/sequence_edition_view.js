import Styles from '../../styles';
const LineStyles = Styles.sequences.lines;
/**
@module Sequence
@submodule Views
@class SequenceEditionView
**/
// define(function(require) {
  var template = require('../templates/sequence_edition_view.hbs'),
      SequenceCanvas = require('../lib/sequence_canvas'),
      Gentle = require('gentle'),
      ContextMenuView = require('../../common/views/context_menu_view'),
      LinearMapView = require('../../linear_map/views/linear_map_view'),
      PlasmidMapView = require('../../plasmid_map/views/plasmid_map_view'),
      MatchedEnzymesView = require('./matched_enzymes_view'),
      Backbone = require('backbone'),
      Q = require('q'),
      SequenceEditionView;

  SequenceEditionView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'sequence-view',

    initialize: function() {
      var _this = this;

      this.model = Gentle.currentSequence;

      this.contextMenuView = new ContextMenuView({context: 'sequence'});

      this.matchedEnzymesView = new MatchedEnzymesView();
      this.setView('.sequence-matched-enzymes-outlet', this.matchedEnzymesView);

      this.initSecondaryViews();
    },

    initSecondaryViews: function(trigger) {
      var secondaryViews,
          currentView;

      secondaryViews = _.chain(Gentle.plugins)
        .where({type: 'sequence-secondary-view'})
        .pluck('data')
        .value();

      secondaryViews.push({
        name: 'linear',
        title: 'Linear map',
        view: LinearMapView
      });

      secondaryViews.push({
        name: 'plasmid',
        title: 'Plasmid map',
        view: PlasmidMapView
      });

      currentView = this.model.get('isCircular') ? 'plasmid' : 'linear';

      // if(!~_.pluck(secondaryViews, 'name').indexOf(currentView))
      //   currentView = 'linear';

      this.secondaryViews = secondaryViews;
      this.changeSecondaryView(currentView, false);
    },

    handleResizeRight: function(trigger) {
      $('#sequence-canvas-primary-view-outlet, .sequence-canvas-outlet').css({
        'right': this.secondaryView.$el.width(),
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
      this.secondaryView = new secondaryViewClass.view();

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
        this.handleResizeRight(false);
        if(render !== false) {
         this.sequenceCanvas.refresh();
        }
      });
    },

    afterRender: function() {
      this.$('.sequence-canvas-outlet').css({
        'right': this.secondaryView.$el.width(),
      });

      var sequence = this.model;

      var sequenceCanvas = this.sequenceCanvas = new SequenceCanvas({
        sequence: sequence,
        container: this.$('.sequence-canvas-outlet').first(),
        yOffset: sequence.get('displaySettings.yOffset'),
        // non library options
        contextMenu: this.contextMenuView,
        view: this
      });

      sequenceCanvas.refresh();
    },

  });
export default SequenceEditionView;
  // return SequenceEditionView;
// });
