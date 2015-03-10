
var handleError = function (exception, codeLabel=undefined) {
  if(codeLabel) {
    console.error(codeLabel, exception);
  } else {
    console.error(exception);
  }
};

export default handleError;
