/**
@module Model
**/
define(function(require) {
  var Backbone  = require('backbone.mixed'),
      Gentle;

  Gentle = Gentle || {};
  _.extend(Gentle, Backbone.Events);

  Gentle.plugins = [];

  Gentle.addPlugin = function(type, data) {
    Gentle.plugins.push({
      type: type,
      data: data
    });
  };

  return function() {
    return Gentle;
  };
});