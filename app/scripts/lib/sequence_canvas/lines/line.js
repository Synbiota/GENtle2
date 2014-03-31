/**
Base Line class from which to extend. 

@class Lines.Line
**/
define(function(require) {
  var _ = require('underscore'),
      Line;

  Line = function() {};

  /**
  Clears the cache of memoized functions
  @method clearCache
  **/
  Line.prototype.clearCache = function() {
    if(this.visible !== undefined && _.isFunction(this.visible.clearCache)) {
      this.visible.clearCache();
    }
  };

  Line.prototype.draw = function() {};

  return Line;
});
