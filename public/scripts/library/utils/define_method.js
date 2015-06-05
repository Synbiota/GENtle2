export default function defineMethod(target, key, fn) {
  Object.defineProperty(target, key, {
    enumerable: false,
    configurable: true,
    key,
    value: fn,
    writable: true
  });
}