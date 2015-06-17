/**
@module Sequence
@submodule Views
@class SequenceView
**/
// define(function(require) {
  var template                = require('../templates/sequence_view.hbs'),
      Gentle                  = require('gentle'),
      SequenceSettingsView    = require('./settings_view'),
      SequenceEditionView     = require('./sequence_edition_view'),
      SequenceAnalysisView    = require('./sequence_analysis_view'),
      StatusbarView           = require('../../common/views/statusbar_view'),
      StatusbarPrimaryViewView= require('./statusbar_primary_view_view'),
      // StatusbarSecondaryViewSwitcherview = require('./statusbar_secondary_view_switcher_view'),
      Backbone                = require('backbone'),
      Q                       = require('q'),
      SequenceView;

  SequenceView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'sequence-view',

    initialize: function() {
      var _this = this,
          statusbarView;

      this.model = Gentle.currentSequence;
      this.sequenceSettingsView = new SequenceSettingsView();
      this.setView('.sequence-sidebar', this.sequenceSettingsView);

      this.handleResize = _.bind(this.handleResize, this);
      this.listenTo(this.sequenceSettingsView, 'resize', this.handleResize, this);
      $(window).on('resize', this.handleResize);

      this.listenTo(this.model, 'change:isCircular', this.changeSecondaryView);

      this.initPrimaryViews();
      this.initStatusbarView();
    },

    analyzeFragment: function(fragment){

      var sequenceAnalysisView = new SequenceAnalysisView();
      var canvasView = this.actualPrimaryView.sequenceCanvas;

      Modal.modalTitle = 'Analysis';
      Modal.setView('.modal-body', sequenceAnalysisView);

      sequenceAnalysisView.calculateResults(fragment);
      sequenceAnalysisView.render();

      canvasView.hideCaret();
      canvasView.selection = "";
      canvasView.redraw();

      Modal.show();
    },

    changeSecondaryView: function() {
      var viewName = this.model.get('isCircular') ? 'plasmid' : 'linear';
      this.actualPrimaryView.changeSecondaryView(viewName, true);
    },

    initStatusbarView: function() {
      var sequence = this.model;
      var statusbarView = this.statusbarView = new StatusbarView();
      this.setView('.sequence-statusbar-outlet', statusbarView);

      statusbarView.addSection({
        name: 'primaryView',
        view: StatusbarPrimaryViewView
      });

      // statusbarView.addSection({
      //   name: 'secondaryView',
      //   view: StatusbarSecondaryViewSwitcherview,
      //   className: 'pull-right',
      //   visible: function() {
      //     return sequence.get('displaySettings.primaryView') == 'edition';
      //   }
      // });

      _.each(_.where(Gentle.plugins, {type: 'sequence-statusbar-section'}), function(plugin) {
        statusbarView.addSection(plugin.data);
      });
      this.listenTo(this.model, 'change:displaySettings.primaryView', statusbarView.render, statusbarView);
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
        title: 'Edit sequence',
        view: SequenceEditionView
      });

      currentView = this.model.get('displaySettings.primaryView');

      if(!~_.pluck(primaryViews, 'name').indexOf(currentView)) {
        currentView = 'edition';
      }

      this.primaryViews = primaryViews;
      this.changePrimaryView(currentView, false);
    },

    changePrimaryView: function(viewName, render, argumentsForView=[]) {
      var primaryView = _.findWhere(this.primaryViews, {name: viewName});
      var actualView = new primaryView.view(...argumentsForView);

      _.each(this.primaryViews, function(view) {
        view.current = false;
      });

      primaryView.current = true;
      this.primaryView = primaryView;
      this.actualPrimaryView = actualView;
      this.model.set('displaySettings.primaryView', viewName).throttledSave();
      this.setView('#sequence-primary-view-outlet', actualView);

      var promiseRender;
      if(render === false) {
        promiseRender = Q.resolve();
      } else {
        promiseRender = actualView.render();
        this.maximizePrimaryView();
        this.sequenceSettingsView.render();
      }
      return promiseRender;
    },

    maximizePrimaryView: function() {
      var $outlet = $('#sequence-primary-view-outlet');

      var maximize = this.primaryView.maximize;
      maximize = _.isFunction(maximize) ? maximize(this.model) : !!maximize;

      if(maximize) {
        $outlet.addClass('maximize');
      } else {
        $outlet.removeClass('maximize');
      }
    },

    afterRender: function() {
      this.handleResize(false);
      this.maximizePrimaryView();
    },

    handleResize: function(trigger) {

      this.$('#sequence-primary-view-outlet').css('left', this.primaryViewLeftPos());

      if(trigger !== false) {
        this.trigger('resize');
        Gentle.trigger('resize');
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
export default SequenceView;
  // return SequenceView;
// });
