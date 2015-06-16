import Bugsnag from 'bugsnag-js';
import tracedLog from './traced_log';

var handleError = function (exception, codeLabel=undefined) {
  if(process.env.ENABLE_BUGSNAG) {
    if(codeLabel) {
      Bugsnag.notifyException(exception, codeLabel);
    } else {
      Bugsnag.notifyException(exception);
    }
  } else {
    if(codeLabel) {
      tracedLog("%c ERR ", "background-color: red; color: white;", codeLabel, exception);
    } else {
      tracedLog(exception);
    }
  }
};

var namedHandleError = function(codeLabel) {
  return function(exception) {
    handleError(exception, codeLabel);
  };
};

export default {handleError, namedHandleError};
