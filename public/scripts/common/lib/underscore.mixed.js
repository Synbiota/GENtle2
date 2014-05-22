/**
Set of utility methods.

Utility methods are mixed in underscore rather than added 
to the global namespace. This lets us use underscore's chaining.
See https://gist.github.com/HenrikJoreteg/641397 for
discussion

@class Utilities
**/

define(function(require) {
  var _           = require('underscore'),
      keyPrefix   = +new Date() + '';

  _.mixin({

    /**
    Capitalizes the first letter of a text
    @method _.ucFirst
    @param {string} text to transform
    **/
    ucFirst: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    /**
    Converts an Array-like object (with `length` fmethod)
    into an Array
    @method _.objectToArray
    @param {object} object to convert
    **/
    objectToArray: function(obj) {
      return  _.map(
                _.reject(
                  _.pairs(obj), 
                    function(pair) { return _.isNaN(parseInt(pair[0])); }
                  ), 
                  function(pair) { return pair[1]; }
                );
    },

    /**
    Derived from Lo-Dash 2.4.1's `memoize` function, which exposes the cache
    https://github.com/lodash/lodash/blob/2.4.1/dist/lodash.compat.js#L5909

    Example: 
    ```javascript
    var memoizedFunc = _(func).memo
    ize2(),
        result = memoizedFunc('test'); 
    memoizedFunc.cache.test;  // Returns cached value
    ```
    @method _.memoize2
    @param {function} func function to memoize
    @param {function} [resolver]
    **/
    memoize2: function(func, resolver) {
      if (!_.isFunction(func)) {
        throw new TypeError();
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      };
      memoized.cache = {};
      memoized.clearCache = function() { memoized.cache = {}; };
      return memoized;
    },

    /**
    Format an integer, separating thousands

    ```js
    _.formatThousands(14342534) // => "14,342,534"
    ``

    @method _.formatThousands
    @param {Integer} number
    @returns {String} formatted number
    **/
    formatThousands: function(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }





  });

  return _;
});