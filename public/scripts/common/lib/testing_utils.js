import _ from 'underscore';


// Allows us to stub out in tests
var _assertion = function(test, message) {
  // console.assert does not work in karma tests run in Node.
  if(!test) throw new Error(message);
};

var stubAssertion = function(newAssertion) {
  var oldAssertion = _assertion;
  _assertion = newAssertion;
  return oldAssertion;
};


var assertion = function(test, message) {
  _assertion(test, message);
};

var assertIsDefinedAndNotNull = function(value, fieldName) {
  _assertion(
    _.isUndefined(value) && _.isNull(value),
    `\`${fieldName}\` cannot be undefined or null`
  );
};

var assertIsNumber = function(value, fieldName) {
  _assertion(_.isNumber(value) && !_.isNaN(value), `\`${fieldName}\` should be a number but is: ${value} (${typeof value})`);
};

var assertIsInstance = function(value, klass, fieldName) {
  // N.B. klass.className is manually set on backbone models
  _assertion((value && value.constructor) === klass, `\`${fieldName}\` should be a instance of ${klass.className || klass.name || klass} but is ${value}`);
};

var assertIsObject = function(value, fieldName) {
  _assertion(_.isObject(value), `\`${fieldName}\` should be an Object but is: ${value} (${typeof value})`);
};


export default {
  stubAssertion,
  assertion,
  assertIsNumber,
  assertIsInstance,
  assertIsDefinedAndNotNull,
  assertIsObject
};
