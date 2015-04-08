
// Allows us to stub out in tests
var _assertion = function(test, message) {
  console.assert(test, message);
};

var stubAssertion = function(newAssertion) {
  var oldAssertion = _assertion;
  _assertion = newAssertion;
  return oldAssertion;
};


var assertion = function(test, message) {
  _assertion(test, message);
};

var assertIsNumber = function(value, fieldName) {
  _assertion(_.isNumber(value) && !_.isNaN(value), `\`${fieldName}\` should be a number but is: ${value} (${typeof value})`);
};

var assertIsInstance = function(value, klass, fieldName) {
  _assertion(value.constructor === klass, `\`${fieldName}\` should be a instance of ${klass} but is ${value}`);
};


export default {
  stubAssertion,
  assertion,
  assertIsNumber,
  assertIsInstance,
};