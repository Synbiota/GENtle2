var handleError = function (exception, codeLabel=undefined) {
  console.groupCollapsed('%c ERR ' + (codeLabel || 'unnamed error'), 'color: white; background: red;');
  console.log(exception.stack)
  console.groupEnd();
};

var namedHandleError = function(codeLabel) {
  return function(exception) {
    handleError(exception, codeLabel);
  };
};

export default {handleError, namedHandleError};
