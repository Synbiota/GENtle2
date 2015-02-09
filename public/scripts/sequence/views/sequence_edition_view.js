/**
@module Sequence
@submodule Views
@class SequenceEditionView
**/
define(function(require) {
  var template = require('../templates/sequence_edition_view.hbs'),
      SequenceCanvas = require('../lib/sequence_canvas'),
      Gentle = require('gentle')(),
      ContextMenuView = require('../../common/views/context_menu_view'),
      LinearMapView = require('../../linear_map/views/linear_map_view'),
      PlasmidMapView = require('../../plasmid_map/views/plasmid_map_view'),
      Backbone = require('backbone.mixed'),
      SequenceEditionView;

  SequenceEditionView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'sequence-view',

    initialize: function() {
      var _this = this;

      this.model = Gentle.currentSequence;

      this.contextMenuView = new ContextMenuView({context: 'sequence'});
      this.setView('#sequence-canvas-context-menu-outlet', this.contextMenuView);
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

      $('#sequence-canvas-primary-view-outlet').css({
        'right': this.actualSecondaryView.$el.width(),
      });
      $('.sequence-canvas-container, .scrolling-parent').css({
        'right': this.actualSecondaryView.$el.width(),
      });
      if(trigger !== false) {
        this.trigger('resize');
        this.actualSecondaryView.trigger('resize');
      }
    },

    secondaryViewRightPos: function() {
      return $('#sequence-secondary-view-outlet').width();
    },

     primaryViewLeftPos: function() {
      return $('#sequence-primary-view-outlet').width();
    },


    changeSecondaryView: function(viewName, render) {
      var secondaryView = _.findWhere(this.secondaryViews, {name: viewName});
      var actualView = new secondaryView.view();

      this.secondaryView = secondaryView;
      this.actualSecondaryView = actualView;
      this.model.actualSecondaryView = this.actualSecondaryView;
      this.model.set('displaySettings.secondaryView', viewName).throttledSave();

      this.setView('#sequence-canvas-secondary-view-outlet', this.actualSecondaryView);

      if(render !== false) {
        this.actualSecondaryView.render();
      }
      this.handleResizeRight(false);
      if(render !== false) {
       this.sequenceCanvas.refresh();
      }
      //trying to remove the previous view
      this.previousSecondaryView = this.actualSecondaryView;
    },


    afterRender: function() {
      this.$('.sequence-canvas-container, .scrolling-parent').css({
        'right': this.actualSecondaryView.$el.width(),
      });
      this.sequenceCanvas = new SequenceCanvas({
        view: this,
        $canvas: this.$('.sequence-canvas-container canvas').first()
      });
      this.sequenceCanvas.refresh();
      this.contextMenuView.$assumedParent = this.$('.scrolling-parent').focus();
      this.contextMenuView.boundTo = this.sequenceCanvas;
    },

  });

  return SequenceEditionView;
});
