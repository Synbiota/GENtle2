define(function(require) {
  var Backbone = require('backbone.mixed'),
      Gentle = require('gentle')(),
      template = require('hbars!../templates/statusbar_primary_view_view');

  return Backbone.View.extend({
    template: template,
    manage: true,

    serialize: function() {
      return {
        readOnly: !!Gentle.currentSequence.get('readOnly'),
        primaryView: this.parentView(2).primaryView.title
      };
    }
  });
});