/**
@module Sequence
@submodule Views
@class SequenceView
**/
define(function(require) {
  var template                = require('hbars!../templates/sequence_view'),
      Gentle                  = require('gentle')(),
      SequenceSettingsView    = require('./settings_view'),
      SequenceEditionView     = require('./sequence_edition_view'),
      Backbone                = require('backbone.mixed'),
      SequenceView;
  
  SequenceView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'sequence-view',

    initialize: function() {
      var _this = this;

      this.model = Gentle.currentSequence;
      
      this.sequenceSettingsView = new SequenceSettingsView();
      this.sequenceSettingsView.parentView = this;
      this.setView('.sequence-sidebar', this.sequenceSettingsView);

      // this.primaryViewSwitcherView = new PrimaryViewSwitcherView();
      // this.primaryViewSwitcherView.parentView = this;
      // this.setView('#sequence-primary-view-switcher-outlet', this.primaryViewSwitcherView);

      this.handleResize = _.bind(this.handleResize, this);
      this.listenTo(this.sequenceSettingsView, 'resize', this.handleResize, this);
      $(window).on('resize', this.handleResize);

      this.initPrimaryViews();
    },

    initPrimaryViews: function(trigger) {
      var primaryViews,
          currentView;

      primaryViews = _.chain(Gentle.plugins)
        .where({type: 'sequence-primary-view'})
        .pluck('data')
        .value();

      primaryViews.push({
        name: 'edition',
        title: 'Edition',
        view: SequenceEditionView
      });

      currentView = this.model.get('displaySettings.primaryView');
      if(!~_.pluck(primaryViews, 'name').indexOf(currentView))
        currentView = 'edition';

      this.primaryViews = primaryViews;
      this.changePrimaryView(currentView, false);
    },

    changePrimaryView: function(viewName, render) {
      var primaryView = _.findWhere(this.primaryViews, {name: viewName}),
          actualView = new primaryView.view();

      this.primaryView = primaryView;
      this.actualPrimaryView = actualView;
      this.model.set('displaySettings.primaryView', viewName).throttledSave();
      this.setView('#sequence-primary-view-outlet', actualView);
      actualView.parentView = this;
      if(render !== false) actualView.render();
    },

    afterRender: function() {
      this.handleResize(false);
    },

    handleResize: function(trigger) {
      this.$('#sequence-primary-view-outlet').css('left', this.primaryViewLeftPos());
      if(trigger !== false) {
        this.trigger('resize');
        this.actualPrimaryView.trigger('resize');
      }
    },

    primaryViewLeftPos: function() {
      return this.sequenceSettingsView.$el.width();
    },

    remove: function() {
      $(window).off('resize', this.handleResize);
      Backbone.View.prototype.remove.apply(this, arguments);
    }

  });

  return SequenceView;
});