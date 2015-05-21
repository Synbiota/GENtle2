import {memoize2 as memoize} from 'underscore';

export default function smartMemoizeAndClear(obj, methodName, eventName) {
  if(typeof methodName === 'object') {
    Object.keys(methodName).forEach((_methodName) => {
      smartMemoizeAndClear(obj, _methodName, methodName[_methodName]);
    });
  } else {
    obj[methodName] = memoize(obj[methodName]);
    let callback = () => obj[methodName].clearCache();
    if(typeof obj.listenTo !== 'undefined') {
      obj.listenTo(obj, eventName, callback);
    } else {
      obj.on(eventName, callback);
    }
  }
}