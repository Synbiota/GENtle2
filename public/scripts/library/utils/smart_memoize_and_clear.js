import {memoize2 as memoize} from 'underscore';

export default function smartMemoizeAndClear(obj, methodName, eventName, listenTarget) {
  listenTarget = listenTarget || obj;

  if(typeof methodName === 'object') {
    Object.keys(methodName).forEach((_methodName) => {
      smartMemoizeAndClear(listenTarget, _methodName, methodName[_methodName], obj);
    });
  } else {
    obj[methodName] = memoize(obj[methodName]);
    let callback = () => obj[methodName].clearCache();
    if(typeof listenTarget.listenTo !== 'undefined') {
      listenTarget.listenTo(listenTarget, eventName, callback);
    } else {
      listenTarget.on(eventName, callback);
    }
  }
}