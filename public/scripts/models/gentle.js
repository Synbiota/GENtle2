define(function(require) {
  var Backbone  = require('backbone'),
      Gentle;

  Gentle = Gentle || {};
  _.extend(Gentle, Backbone.Events);

  return function() {
    return Gentle;
  };
});