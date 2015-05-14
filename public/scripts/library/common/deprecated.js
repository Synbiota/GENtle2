function deprecatedMethod(obj, methodName, replacement) {
  console.error(`Using ${methodName} on ${obj.constructor.name} instances is deprecated. Use ${replacement} instead.`);
}

export default deprecatedMethod;