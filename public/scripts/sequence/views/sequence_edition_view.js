/**
@module Sequence
@submodule Views
@class SequenceEditionView
**/
define(function(require) {
  var template = require('hbars!sequence/templates/sequence_edition_view'),
      SequenceCanvas = require('sequence/lib/sequence_canvas'),
      Gentle = require('gentle')(),
      SecondaryChangeView = require('sequence/views/secondary_view_dropdown'),
      ContextMenuView = require('common/views/context_menu_view'),
      LinearMapView = require('linear_map/views/linear_map_view'),
      Backbone = require('backbone.mixed'),
      SequenceEditionView;
  
  SequenceEditionView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'sequence-view',

    initialize: function() {
      var _this = this;

      this.model = Gentle.currentSequence;
      
      // this.on('resize', function() {
      // _this.$('.sequence-canvas-container, .scrolling-parent').css('left', _this.parentView.primaryViewLeftPos());
      // });
      this.contextMenuView = new ContextMenuView();
      this.secondaryViewDropdown = new SecondaryChangeView();
      this.insertView('#sequence-canvas-secondary-view-outlet',this.secondaryViewDropdown);
      this.insertView('#sequence-canvas-context-menu-outlet', this.contextMenuView);
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
        title: 'LinearMap',
        view: LinearMapView
        });  

        secondaryViews.push({
        name: 'plasmid',
        title: 'PlasmidMap',
        });  

      currentView = this.model.get('displaySettings.secondaryView');

      if(!~_.pluck(secondaryViews, 'name').indexOf(currentView))
        currentView = 'linear';

      this.secondaryViews = secondaryViews;
      this.changeSecondaryView(currentView, false);

    },

    handleResizeRight: function(trigger) {
      $('#sequence-canvas-primary-view-outlet').css({
        'right': this.actualSecondaryView.$el.width(),
      });
      this.$('.sequence-canvas-container, .scrolling-parent').css({
        'right': this.actualSecondaryView.$el.width(),
      });
      if(trigger !== false) {
        this.trigger('resize');
        this.actualSecondaryView.trigger('resize');
      }
    },

    handleResizeLeft: function(trigger) {

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
      var secondaryView = _.findWhere(this.secondaryViews, {name: viewName}),
          actualView = new secondaryView.view();

      this.secondaryView = secondaryView;
      this.actualSecondaryView = actualView;
      this.actualSecondaryView.parentView = this;
      this.model.actualSecondaryView = this.actualSecondaryView;
      this.model.set('displaySettings.secondaryView', viewName).throttledSave();
      this.insertView('#sequence-canvas-secondary-view-outlet', this.actualSecondaryView);

      if(render !== false) {
        this.actualSecondaryView.render();
      }

      this.handleResizeRight(false);
    },


    afterRender: function() {
    var li = '', _this= this;

     for (var i=0;i<this.secondaryViews.length;i++){
      li += '<li role="presentation" >'+'<a role="menuitem" id ="secondary-view-item">'+this.secondaryViews[i].name +'</a></li>';
      $('#secondary-view-list').append(li);
      li = '';
     }
     $('#secondary-view-item').click(function () {
       value = $(this).html();
       _this.changeSecondaryView(value,false);
      });
      this.sequenceCanvas = new SequenceCanvas({
        view: this,
        $canvas: this.$('canvas').first()
      });

      this.$('.sequence-canvas-container, .scrolling-parent').css({
        'right': this.actualSecondaryView.$el.width(),
      });

      this.sequenceCanvas.refresh();
      this.contextMenuView.$assumedParent = this.$('.scrolling-parent').focus();
      this.contextMenuView.boundTo = this.sequenceCanvas;
    },

  });

  return SequenceEditionView;
});