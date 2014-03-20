define(function(require) {
  // var Backbone = require('backbone');
  var $ = require('jquery'),
      _ = require('underscore');

  // // Creates a globally-accessible namespace for the app
  // window.Gentle = window.Gentle || {};
  // _.extend(Gentle, Backbone.Events);

  window.ucFirst = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Function to convert Arraylike Object into array
  window.objectToArray = function(object) {
    return  _.map(
              _.reject(
                _.pairs(object), 
                  function(pair) { return _.isNaN(parseInt(pair[0])); }
                ), 
                function(pair) { return pair[1]; }
              );
  };

  return;
});