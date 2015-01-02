/**
@module Sequence
@submodule Views
@class HistoryView
**/
define(function(require) {
  var template = require('../templates/history_view.hbs'),
    Gentle = require('gentle')(),
    Backbone = require('backbone.mixed'),
    HistoryView;

  HistoryView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click .sequence-feature-link': 'scrollToFeature',
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.listenTo(this.model.getHistory(), 'add remove', _.debounce(this.refresh, 500), this);
    },

    undoAfter: function(event, element) {
      var timestamp = $(element).data('timestamp');
      this.model.undoAfter(timestamp);
    },

    refresh: function() {
      var $tab = this.$('.sequence-settings-tab'),
        isOpen = $tab && $tab.hasClass('active');

      this.render();
      if (isOpen) this.$('.sequence-settings-tab-link').click(); // Meh..
    },

    getHistorySteps: function() {
      return this.model.getHistory();
    },

    serialize: function() {
      if (this.isOpen) {
        return {
          isOpen: true,
          readOnly: this.model.get('readOnly'),
          historySteps: this.getHistorySteps().serialize(),
        };
      } else return {};
    },

    afterRender: function() {
      var _this = this;

      $('.undo-history-step').confirmation({
        popout: true,
        singleton: true,
        btnOkLabel: 'Undo',
        placement: 'right',
        onConfirm: _.bind(_this.undoAfter, _this)
      });
    }

  });

  return HistoryView;
});