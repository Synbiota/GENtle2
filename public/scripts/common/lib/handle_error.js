import Bugsnag from 'bugsnag-js';

var handleError = function (exception, codeLabel=undefined) {
  if(process.env.ENABLE_BUGSNAG) {
    if(codeLabel) {
      Bugsnag.notifyException(exception, codeLabel);
    } else {
      Bugsnag.notifyException(exception);
    }
  } else {
    if(codeLabel) {
      console.error(codeLabel, exception);
    } else {
      console.error(exception);
    }
  }
};

var namedHandleError = function(codeLabel) {
  return function(exception) {
    handleError(exception, codeLabel);
  };
};

export default {handleError, namedHandleError};
