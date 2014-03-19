define(function(require) {
  var Backbone = require('backbone'),
      Sequence = require('models/sequence'),
      Sequences;

  Sequences = Backbone.Collection.extend({
    model: Sequence
  });

  return Sequences;
});