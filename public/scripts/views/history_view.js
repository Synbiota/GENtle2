define(function(require) {
  var template        = require('hbars!templates/history_view'),
      SequenceCanvas  = require('lib/sequence_canvas/sequence_canvas'),
      Gentle          = require('gentle')(),
      Backbone        = require('backbone.mixed'),
      BSConfirmation  = require('bootstrap-confirmation'),
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
      event.preventDefault();
      this.model.undoAfter(timestamp);
    },

    refresh: function() {
      var $tab = this.$('.sequence-settings-tab'),
          isOpen = $tab && $tab.hasClass('active');

      this.render();
      if(isOpen) this.$('.sequence-settings-tab-link').click(); // Meh..
    },

    serialize: function() {
      return {
        historySteps: this.model.getHistory().serialize(),
      };
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