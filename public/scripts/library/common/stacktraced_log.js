export default function stacktracedLog(...args) {
  console.groupCollapsed('%c LOG ', 'color: green', ...args)
  console.log((new Error).stack);
  console.groupEnd();
}