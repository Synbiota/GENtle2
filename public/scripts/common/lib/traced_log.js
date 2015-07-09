var groupLog = function(label, error, messages) {
  console.groupCollapsed(`%c${label}`, 'font-weight: normal;', ...messages);
  console.log(error.stack);
  console.groupEnd();
};


export default function tracedLog(label, ...messages) {
  var error = messages.pop();
  if(error instanceof Error) {
    groupLog(label, error, messages);
  } else {
    groupLog(label, new Error(), messages.concat(error));
  }
}