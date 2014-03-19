define(function(require) {
  var backbone      = require('backbone'),
      SequenceView  = require('views/sequence_view'),
      HomeView      = require('views/home_view'),
      Router;

  Router = Backbone.Router.extend({
    initialize: function(options) {
      options = options || {};
      this.app = options.app;
    },

    routes: {
      '':               'index',
      'sequence/:id':   'sequence',
      'home':           'home'
    },

    index: function() {
      this.sequence(this.app.sequences.last().get('id'));
    },

    home: function() {
      console.log('prout')
      this.app.currentSequence = undefined;
      this.app.layout.setView('#content', new HomeView());
      this.app.layout.render();
    },

    sequence: function(id) {
      this.app.currentSequence = this.app.sequences.get(id);
      this.app.layout.setView('#content', new SequenceView());
      this.app.layout.render();
    }
  });

  return Router;
});