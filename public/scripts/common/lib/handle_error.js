
var handleError = function (exception, codeLabel=undefined) {
  if(codeLabel) {
    console.error(codeLabel, exception);
  } else {
    console.error(exception);
  }
};

var namedHandleError = function(codeLabel) {
  return function(exception) {
    handleError(exception, codeLabel);
  };
};

export default {handleError, namedHandleError};
