var keys = Object.getOwnPropertyNames;

var reverseForEach = function(arr, cb) {
  for(let i = arr.length-1; i >= 0; i--) cb(arr[i]);
};

function classMixin(overwrite = true) {
  return function(...mixins) {

    class MixedIn {
      constructor(...args) {
        reverseForEach(mixins, mixin => {
          var _init = mixin.prototype._init;
          if(_init) _init.apply(this, args);
        });
      }
    }
    var mixedInPrototype = MixedIn.prototype;

    reverseForEach(mixins, function(mixin) {
      var mixinPrototype = mixin.prototype; 
      var props = keys(mixinPrototype);

      for(let j = 0; j < props.length; j++) {
        let prop = props[j];
        
        if(mixedInPrototype[prop] && !overwrite) {
          throw new Error(`Cannot overwrite method '${prop}'`);
        }

        if(prop !== 'constructor') {
          mixedInPrototype[prop] = mixinPrototype[prop];
        }
      }      
    });

    return MixedIn;
  };
}

export default classMixin();