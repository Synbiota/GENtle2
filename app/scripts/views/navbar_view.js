define(function(require) {
  var Backbone    = require('backbone'),
      template    = require('hbars!templates/navbar_view'),
      NavbarView;

  NavbarView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click #menu-button': 'navigateToHome',
      'click #sequence-tabs li a': 'navigateToSequence'
    },

    initialize: function() {
      Gentle.sequences.on('add remove reset sort', this.render, this);
      // Gentle.router.on('route', this.render, this);
    },

    navigateToSequence: function(event) {
      Gentle.router.navigate($(event.target).attr('href'), {trigger: true});
      event.preventDefault();
    },

    navigateToHome: function(event) {
      Gentle.router.navigate('home', {trigger: true});
      event.preventDefault();
    },

    serialize: function() {
      return {
        sequences: Gentle.sequences.toJSON(),
        atHome: !Gentle.currentSequence
      };
    }
  });

  return NavbarView;
});