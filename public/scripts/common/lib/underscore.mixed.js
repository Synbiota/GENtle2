/**
Set of utility methods.

Utility methods are mixed in underscore rather than added 
to the global namespace. This lets us use underscore's chaining.
See https://gist.github.com/HenrikJoreteg/641397 for
discussion

@module Utilities
@class _
**/

var _ = window._ = require('underscore');

require('backbone-deep-model/lib/underscore.mixin.deepExtend');


var keyPrefix   = +new Date() + '';

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
          key = resolver ? 
            resolver.apply(this, arguments) : 
            keyPrefix + arguments[1] ? _.toArray(arguments).join('--') : arguments[0];

      return hasOwnProperty.call(cache, key) ? 
        cache[key] : 
        (cache[key] = func.apply(this, arguments));
    };
    memoized.cache = {};
    memoized.clearCache = function() { memoized.cache = {}; };
    return memoized;
  },

  /**
  Format an integer, separating thousands

  ```js
  _.formatThousands(14342534) // => "14,342,534"
  ```

  @method _.formatThousands
  @param {Integer} number
  @returns {String} formatted number
  **/
  formatThousands: function(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },

  /**
  Converts an integer in short form depending on order of magnitude

  ```js
  _.shortFormNumber(124) // => "124"
  _.shortFormNumber(1240) // => "1.24K"
  _.shortFormNumber(124023) // => "124K"
  _.shortFormNumber(1240234) // => "1.24M"
  _.shortFormNumber(1240234000) // => "1.24G"
  ```
  **/
  shortFormNumber: function(number) {
    var suffixes = ['', 'K', 'M', 'G'],
        magOrder = Math.round(Math.log10(number) / 3),
        roundedNumber = Math.round(number / Math.pow(10, magOrder * 3) * 100) / 100;
    return number === 0 ? 0 : roundedNumber.toString() + suffixes[magOrder];
  },

  /**
  Returns a randomized unique ID

  Inspired by http://stackoverflow.com/a/6860916/916312

  @method _.uniqueId
  **/
  uniqueId: function() {
    return +(new Date()) + '-' + (((1+Math.random())*0x10000)|0).toString(16);
  },

  /**
  Deep clones an object. Will only work properly with simple objects/arrays
  Adapted from a rejected underscore pull request 
  https://github.com/jashkenas/underscore/blob/95ada0839e5ee206e72d831dd62b5e41f18fdcae/underscore.js
  @method _.deepClone
  **/
  deepClone: function(obj, depthLeft=100, debuggingKeys=[]) {
    if (depthLeft <= 0) {
      console.warn(debuggingKeys);
      throw "deepClone recursion limit exceeded";
    }
    if (!_.isObject(obj) || _.isFunction(obj)) return obj;
    if (_.isDate(obj)) return new Date(obj.getTime());
    if (_.isRegExp(obj)) return new RegExp(obj.source, obj.toString().replace(/.*\//, ""));
    var isArr = (_.isArray(obj) || _.isArguments(obj));
    var isObj = (_.isObject(obj) && !_.isDate(obj));
    var func = function (memo, value, key) {
      debuggingKeys.push(key);
      if (isArr)
        memo.push(_.deepClone(value, depthLeft-1, debuggingKeys));
      else if (isObj)
        memo[key] = _.deepClone(value, depthLeft-1, debuggingKeys);
      else
        memo[key] = _.deepClone(value, depthLeft, debuggingKeys);
      debuggingKeys.pop();
      return memo;
    };
    return _.reduce(obj, func, isArr ? [] : {});
  },

  snakify: function(object) {
    return object.replace(/([A-Z\d]+)([A-Z][a-z])/g,'$1_$2')
                 .replace(/([a-z\d])([A-Z])/g,'$1_$2')
                 .toLowerCase();
  },

  camelize: function(string) {

    return string.replace (/(?:[-_])(\w)/g, function (_, c) {
      return c ? c.toUpperCase () : '';
    });
  },

  // Similar to `_.throttle(func, wait, {leading: false})`
  afterLastCall: function(func, wait) {
    var timeoutId, args, thisArg, delayed;

    delayed = function() {
      func.apply(thisArg, args);
    };

    return function() {
      args = arguments;
      thisArg = this;

      if(timeoutId) {
        timeoutId = clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(delayed, wait);
      return this;
    };
  }
});


module.exports = _;