
var handleError = function (exception, codeLabel=undefined) {
  if(codeLabel) {
    console.error(codeLabel, exception, exception.stack);
  } else {
    console.error(exception, exception.stack);
  }
};

var namedHandleError = function(codeLabel) {
  return function(exception) {
    handleError(exception, codeLabel);
  };
};

export default {handleError, namedHandleError};
