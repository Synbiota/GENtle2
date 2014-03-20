define(function(require) {
  var Backbone      = require('backbone'),
      Sequence      = require('models/sequence'),
      ls            = require('localstorage'),
      Sequences;

  Sequences = Backbone.Collection.extend({
    model: Sequence,
    localStorage: new Backbone.LocalStorage('Gentle-Sequences'),
    
  });

  return Sequences;
});