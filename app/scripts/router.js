define(function(require) {
  var backbone        = require('backbone'),
      SequenceView    = require('views/sequence_view'),
      HomeView        = require('views/home_view'),
      Gentle          = require('gentle'),
      Router;

  Gentle = Gentle();

  Router = Backbone.Router.extend({

    routes: {
      '':               'index',
      'home':           'home',
      'sequence/:id':   'sequence',
      '*nomatch':       'notFound'
    },

    index: function() {
      if(Gentle.sequences.length) {
        this.sequence(Gentle.sequences.last().get('id'));  
      } else {
        this.navigate('home', {trigger: true});
      }
    },

    home: function() {
      Gentle.currentSequence = undefined;
      Gentle.layout.setView('#content', new HomeView());
      Gentle.layout.render();
    },

    sequence: function(id) {
      Gentle.currentSequence = Gentle.sequences.get(id);
      if(Gentle.currentSequence) {
        Gentle.layout.setView('#content', new SequenceView());
        Gentle.layout.render();
      } else {
        this.notFound();
      }
    },

    notFound: function() {
      this.navigate('home', {trigger: true});
    } 
  });

  return Router;
});