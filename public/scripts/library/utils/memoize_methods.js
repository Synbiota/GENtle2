import {
  memoize2 as memoize,
  keys,
  uniqueId
} from 'underscore.mixed';


function memoizedTable(instance) {
  return instance.__memoizedTable = instance.__memoizedTable || {};
}

function initClearCache(instance) {
  if(instance.clearCache) return;
  var table = memoizedTable(instance);
  instance.clearCache = function(...clearedMethodNames) {
    (clearedMethodNames.length ? 
      clearedMethodNames : 
      keys(table)
    ).each(function(clearedMethodName) {
      instance[clearedMethodName].clearCache();
    });
  };
}

function memoizeMethods(instance, ...methodNames) {
  var table = memoizedTable(instance);

  methodNames.each(function(methodName) {
    table[methodName] = instance[methodName] = memoize(methodName);
  });

  initClearCache();
}

function memoizeForInstance(instance, fn) {
  var tempName = `__memoized-${uniqueId()}`;
  var table = memoizedTable(instance);
  table[tempName] = memoize(fn);
  initClearCache();
}

function memoizeMethodDecorator() {
  debugger
  let getter = descriptor.get, setter = descriptor.set;

  descriptor.get = function() {
    let table = memoizationFor(this);
    if (name in table) { return table[name]; }
    return table[name] = getter.call(this);
  }

  descriptor.set = function(val) {
    let table = memoizationFor(this);
    setter.call(this, val);
    table[name] = val;
  }
 }
export default {memoizeMethods, memoizedTable, memoizeForInstance, memoizeMethodDecorator};