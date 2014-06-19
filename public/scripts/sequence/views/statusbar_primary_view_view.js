define(function(require) {
  var Backbone = require('backbone.mixed'),
      template = require('hbars!../templates/statusbar_primary_view_view');

  return Backbone.View.extend({
    template: template,
    manage: true,

    serialize: function() {
      return {
        primaryView: this.parentView.parentView.primaryView.title
      };
    }
  });
});