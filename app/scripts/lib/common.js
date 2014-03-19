define(function(require) {
  var Backbone = require('backbone');

  // Creates a globally-accessible namespace for the app
  window.Gentle = window.Gentle || {};
  _.extend(Gentle, Backbone.Events);

  return;
});