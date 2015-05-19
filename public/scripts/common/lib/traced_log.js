export default function tracedLog(label, ...messages) {
  console.groupCollapsed(`%c${label}`, 'font-weight: normal;', ...messages);
  console.log((new Error()).stack);
  console.groupEnd();
}