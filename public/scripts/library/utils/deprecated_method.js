function deprecatedMethod(obj, methodName, replacement) {
  var constructorName = obj.displayName || obj.constructor.name;
  console.groupCollapsed("%c DEP ", "background-color: cyan; color: blue;", `Using ${methodName} on ${constructorName} instances is deprecated. Use ${replacement} instead.`);
  console.log((new Error()).stack);
  console.groupEnd();
}

export default deprecatedMethod;