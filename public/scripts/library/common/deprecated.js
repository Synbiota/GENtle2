function deprecatedMethod(obj, methodName, replacement) {
  console.groupCollapsed("%c DEP ", "background-color: cyan; color: blue;", `Using ${methodName} on ${obj.constructor.name} instances is deprecated. Use ${replacement} instead.`);
  console.log((new Error).stack)
  console.groupEnd();
}

export default deprecatedMethod;