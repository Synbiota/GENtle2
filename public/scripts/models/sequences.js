define(function(require) {
  var Sequence      = require('models/sequence'),
      ls            = require('localstorage'),
      Sequences;

  Sequences = Backbone.Collection.extend({
    model: Sequence,
    localStorage: new Backbone.LocalStorage('Gentle-Sequences'),
    serialize: function() { return _.map(this.models, function(model) { return model.serialize(); }); }
  });

  return Sequences;
});