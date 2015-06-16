import smartMemoizeAndClear from './smart_memoize_and_clear';

export default class Memoizable {
  constructor() {
    this._init();
  }

  _init() {
    this._memoized = [];
  }

  memoize(methodName, eventName, target) {
    this._memoized.push(methodName);
    smartMemoizeAndClear(this, methodName, eventName, target || this); 
  }

  clearCache() {
    this._memoized.forEach((methodName) => this[methodName] && this[methodName].clearCache());
  }
}