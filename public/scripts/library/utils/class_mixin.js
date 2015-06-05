var keys = Object.getOwnPropertyNames;

function classMixin(overwrite = true) {
  return function(...mixins) {

    class MixedIn {
      constructor(...args) {
        mixins.reverse().forEach(mixin => {
          var _init = mixin.prototype._init;
          _init && _init.apply(this, args);
        });
      }
    }
    var mixedInPrototype = MixedIn.prototype;

    for(let i = mixins.length - 1; i >= 0; i--) {
      let mixin = mixins[i];
      let mixinPrototype = mixin.prototype; 
      let props = keys(mixinPrototype);

      for(let j = 0; j < props.length; j++) {
        let prop = props[j];
        
        if(mixedInPrototype[prop] && !overwrite) {
          throw new Error(`Cannot overwrite method '${prop}'`);
        }

        if(prop !== 'constructor') {
          mixedInPrototype[prop] = mixinPrototype[prop];
        }
      }
    }

    return MixedIn;
  };
}

export default classMixin();