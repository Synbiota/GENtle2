define(function(require) {
  var template      = require('../templates/results_view.hbs'),
      ResultsView;

  ResultsView = Backbone.View.extend({
    manage: true,
    template: template,

    events: {
      'click .open-ncbi-sequence': 'openSequence'
    },

    openSequence: function(event) {
      var $element = $(event.currentTarget),
          id = $element.data('ncbi_id');

      event.preventDefault();
      $element.find('.open-label').hide();
      $element.find('.loading-label').show();
      $element.addClass('disabled');
      this.parentView().openFromId.call(this.parentView(), id, false).then(function() {
        $element.find('.success-label').show();
        $element.find('.loading-label').hide();
        $element.addClass('btn-success');
      }, function() {
        $element.find('.loading-label').hide();
        $element.find('.open-label').show();
        $element.removeClass('disabled');
      });
    },

    serialize: function() {
      return {
        results: this.parentView().results || []
      };
    }
  });

  return ResultsView;
});