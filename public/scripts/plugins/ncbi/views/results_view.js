define(function(require) {
  var template      = require('hbars!../templates/results_view'),
      ResultsView;

  ResultsView = Backbone.View.extend({
    manage: true,
    template: template,

    events: {
      'click .open-ncbi-sequence': 'openSequence'
    },

    openSequence: function(event) {
      var id = $(event.currentTarget).data('ncbiId');
      event.preventDefault();
      this.parentView.openFromId.call(this.parentView, id);
    },

    serialize: function() {
      return {
        results: this.parentView.results || []
      };
    }
  });

  return ResultsView;
});