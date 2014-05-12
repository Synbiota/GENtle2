  define(function(require) {
  var template    = require('hbars!templates/navbar_view'),
      Gentle      = require('gentle')(),
      NavbarView;

  NavbarView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click #menu-button': 'navigateToHome',
      'click #sequence-tabs li a': 'navigateToHref',
      'click #sequence-tabs .close-sequence': 'closeSequence'
    },

    initialize: function() {
      Gentle.sequences.on('add remove reset sort', this.render, this);
      // Gentle.router.on('route', this.render, this);
    },

    navigateToHref: function(event) {
      Gentle.router.sequence($(event.currentTarget).data('sequence-id'));
      event.preventDefault();
    },

    navigateToHome: function(event) {
      Gentle.router.home();
      event.preventDefault();
    },

    closeSequence: function(event) {
      event.preventDefault();
      var sequence = Gentle.sequences.get($(event.currentTarget).closest('a').data('sequence-id')),
          nextSequence;
      if(sequence) {
        sequence.destroy();
        if(nextSequence = Gentle.sequences.last())
          Gentle.router.sequence(nextSequence.get('id'));
        else
          Gentle.router.home();
      }
    },

    serialize: function() {
      return {
        sequences: Gentle.sequences.serialize(),
        atHome: Backbone.history.fragment == 'home',
      };
    }
  });

  return NavbarView;
});