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
    var toClear = ['visible'],
        this_   = this;
    _(toClear).each(function(funcName) {
      console.log(funcName, this_[funcName] && this_[funcName].cache, this_);
      if(this_[funcName] !== undefined && _.isFunction(this_[funcName].clearCache)) {
        this_[funcName].clearCache();
      }
    });
  };

  Line.prototype.draw = function() {};

  return Line;
});
