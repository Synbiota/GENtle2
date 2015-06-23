
function deprecatedMethod(obj, methodName, replacement) {
  var constructorName = obj.displayName || obj.constructor.name;
  var message = `Using ${methodName} on ${constructorName} instances is deprecated. Use ${replacement} instead.`;
  var stack = (new Error()).stack;
  if(stack) {
    console.groupCollapsed("%c DEP ", "background-color: cyan; color: blue;", message);
    console.log(stack);
    console.groupEnd();
  } else {
    // This is needed for tests in PhantomJS where the stack is otherwise empty
    // and the error message is not displayed.
    console.warn(message);
  }
}

export default deprecatedMethod;
