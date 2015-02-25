define(function(require) {
  var Backbone = require('backbone'),
      Gentle = require('gentle'),
      template = require('../templates/statusbar_primary_view_view.hbs');

  return Backbone.View.extend({
    template: template,
    manage: true,

    events: {
      'click #primary-view-list a': 'changePrimaryView'
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.listenTo(this.model, 'change:displaySettings.primaryView', this.render, this);
    },

    serialize: function() {
      var parentView = this.parentView(2);

      return {
        readOnly: !!Gentle.currentSequence.get('readOnly'),
        primaryView: parentView.primaryView.title,
        primaryViews: parentView.primaryViews
      };
    },

    changePrimaryView: function(event) {
      event.preventDefault();
      var primaryViewName = this.$(event.currentTarget).data('sectionName');
      this.parentView(2).changePrimaryView(primaryViewName, true);
    }
  });
});