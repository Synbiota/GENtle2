var keys = Object.getOwnPropertyNames;

function classMixin(overwrite = true) {
  return function(...mixins) {

    class MixedIn {
      constructor(...args) {
        mixins.reverse().forEach(mixin => mixin.prototype._init && mixin.prototype._init(...args));
      }
    }
    var mixedInPrototype = MixedIn.prototype;

    for(let i = mixins.length - 1; i >= 0; i--) {
      let mixin = mixins[i];
      let mixinPrototype = mixin.prototype; 

      for(let prop of keys(mixin.prototype)) {
        if(mixedInPrototype[prop] && !overwrite) {
          throw new Error(`Cannot overwrite method '${prop}'`);
        }

        if(prop === 'constructor') continue;

        mixedInPrototype[prop] = mixinPrototype[prop];
      }
    }

    return MixedIn;
  };
}

export default classMixin();