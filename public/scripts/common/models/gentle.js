define(function(require) {
  var Backbone  = require('backbone.mixed'),
      Gentle;

  Gentle = Gentle || {};
  _.extend(Gentle, Backbone.Events);

  return function() {
    return Gentle;
  };
});