/**
@module Sequence
@submodule Views
@class SequenceEditionView
**/
define(function(require) {
  var template        = require('hbars!sequence/templates/sequence_edition_view'),
      SequenceCanvas  = require('sequence/lib/sequence_canvas'),
      Gentle          = require('gentle')(),
      ContextMenuView = require('common/views/context_menu_view'),
      LinearMapView   = require('linear_map/views/linear_map_view'),
      Backbone        = require('backbone.mixed'),
      SequenceEditionView;
  
  SequenceEditionView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'sequence-view',

    initialize: function() {
      var _this = this;

      this.model = Gentle.currentSequence;
      
      // this.on('resize', function() { 
      //   _this.$('.sequence-canvas-container, .scrolling-parent').css('left', _this.parentView.primaryViewLeftPos());
      // });
      
      this.contextMenuView = new ContextMenuView();
      this.insertView('#sequence-canvas-context-menu-outlet', this.contextMenuView);

    },

    afterRender: function() {

      this.sequenceCanvas = new SequenceCanvas({
        view: this,
        $canvas: this.$('canvas').first()
      });

      this.secondaryView = new LinearMapView();
      this.secondaryView.parentView = this;
      this.insertView('#sequence-canvas-secondary-view-outlet', this.secondaryView)
        .render();

      this.$('.sequence-canvas-container, .scrolling-parent').css('right',
        this.secondaryView.$el.width()
      );
      this.sequenceCanvas.refresh();

      this.contextMenuView.$assumedParent = this.$('.scrolling-parent').focus();
      this.contextMenuView.boundTo = this.sequenceCanvas;
    },

  });

  return SequenceEditionView;
});