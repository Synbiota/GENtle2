// Taken from underscore's createAssigner
var createAssigner = function(keysFunc, undefinedOnly) {
  return function(obj) {
    var length = arguments.length;
    if (length < 2 || obj === null) return obj;
    for (var index = 1; index < length; index++) {
      var source = arguments[index],
          keys = keysFunc(source),
          l = keys.length;
 
      for (var i = 0; i < l; i++) {
        var key = keys[i];
        if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
      }
    }
    return obj;
  };
};
 
var getOwn = Object.getOwnPropertyNames;
var overwritingMixin = createAssigner(getOwn);
var safeMixin = createAssigner(getOwn, true);
 
export default {overwritingMixin, safeMixin};