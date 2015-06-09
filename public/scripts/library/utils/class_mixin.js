import defineMethod from './define_method';

var keys = Object.getOwnPropertyNames;

var reverseForEach = function(arr, cb) {
  for(let i = arr.length-1; i >= 0; i--) cb(arr[i]);
};

var toArray = (pseudoArr) => Array.prototype.slice.apply(pseudoArr);

var newConstructor = function(obj, mixins, args) {
  reverseForEach(mixins, mixin => {
    var _init = mixin.prototype._init;
    if(_init) _init.apply(obj, args);
  });
};

function classMixin(overwrite = true) {
  return function() {
    var mixins = toArray(arguments);
    var MixedIn;

    if(typeof mixins[mixins.length - 1] === 'function') {
      MixedIn = class MixedIn extends mixins.pop() {
        constructor() { 
          var args = toArray(arguments);
          super(toArray(arguments));
          newConstructor(this, mixins, args);
        }
      };
    } else {
      MixedIn = class MixedIn {
        constructor() {
          var args = toArray(arguments);
          newConstructor(this, mixins, args);
        }
      };
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

        if(prop !== 'constructor' && prop !== '_init') {
          defineMethod(MixedIn.prototype, prop, mixinPrototype[prop]);
        }
      }      
    });

    return MixedIn;
  };
}

export default classMixin();
