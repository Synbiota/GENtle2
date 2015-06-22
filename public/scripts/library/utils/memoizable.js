import smartMemoizeAndClear from './smart_memoize_and_clear';

export default class Memoizable {
  constructor() {
    this._init();
  }

  _init() {
    this._memoized = [];
    this._callbacks = [];
    this._targets = [];
  }

  memoize(methodName, eventName, target = this) {
    this._memoized.push(methodName);
    this._callbacks = this._callbacks.concat(
      smartMemoizeAndClear(this, methodName, eventName, target)
    ); 
    if(!~this._targets.indexOf(target)) this._targets.push(target);
  }

  clearCache() {
    this._memoized.forEach((methodName) => this[methodName] && this[methodName].clearCache());
  }

  cleanupMemoized() {
    this._targets.forEach((target) => {
      this._callbacks.forEach((callback) => {
        target.off(null, callback);
      });
    });
    this._targets = [];
    this._callbacks = [];
  }
}