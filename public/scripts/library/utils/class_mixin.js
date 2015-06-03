import {defaults} from 'underscore';

var keys = Object.getOwnPropertyNames;

var chainFunctions = function(fun1, fun2) {
  return function(...args) {
    console.log('prout')
    fun1(...args);
    fun2(...args);
  };
};

function classMixin2(options) {
  defaults(options, {
    overwrite: true,
    chainConstructors: true
  });

  return function(...mixins) {

    class MixedIn {}
    var mixedInPrototype = MixedIn.prototype;

    for(let i = mixins.length - 1; i >= 0; i--) {
      let mixin = mixins[i];
      let mixinPrototype = mixin.prototype; 

      for(let prop of keys(mixin.prototype)) {
        if(mixedInPrototype[prop] && !options.overwrite) {
          throw new Error(`Cannot overwrite method '${prop}'`);
        }

        if(prop === 'constructor' && options.chainConstructors && mixedInPrototype[prop]) {
          mixedInPrototype[prop] = chainFunctions(
            mixinPrototype[prop],
            mixedInPrototype[prop]
          );
        } else {
          mixedInPrototype[prop] = mixinPrototype[prop];
        }
      }
    }

    return MixedIn;
  };
}

function classMixin(...mixins) {
  
}

export default classMixin({});