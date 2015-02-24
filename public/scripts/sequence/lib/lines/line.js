/**
Base Line class from which to extend. 

@class Lines.Line
@module Sequence
@submodule SequenceCanvas
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
    var toClear = this.cachedProperties,
        _this   = this;

    _.each(toClear, function(funcName) {
      if(_this[funcName] !== undefined && _.isFunction(_this[funcName].clearCache)) {
        _this[funcName].clearCache();
      }
    });
  };

  Line.prototype.draw = function() {};

  return Line;
});
