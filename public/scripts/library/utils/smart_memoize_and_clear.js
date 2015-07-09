import {memoize2 as memoize, isString, isFunction} from 'underscore';

export default function smartMemoizeAndClear(obj, methodName, eventName, listenTarget) {
  listenTarget = listenTarget || obj;
  if(isString(listenTarget)) listenTarget = obj[listenTarget];

  if(typeof methodName === 'object') {
    return Object.keys(methodName).map((_methodName) => {
      smartMemoizeAndClear(listenTarget, _methodName, methodName[_methodName], obj);
    });
  } else {
    if(isFunction(obj[methodName])) {
      obj[methodName] = memoize(obj[methodName]);
      let callback = () => obj[methodName].clearCache();

      if(typeof obj.listenTo !== 'undefined') {
        obj.listenTo(listenTarget, eventName, callback);
      } else {
        listenTarget.on(eventName, callback);
      }

      return callback;
    } else {
      throw `${methodName} should be a method on ${obj.constructor.name}`;
    }
  }
}