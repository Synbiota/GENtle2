
// Allows us to stub out in tests
var _assertion = function(test, message) {
  console.assert(test, message);
};

var assertion = function(test, message) {
  _assertion(test, message);
};

var assertIsNumber = function(value, fieldName) {
  _assertion(_.isNumber(value) && !_.isNaN(value), `\`${fieldName}\` should be a number`);
};

var stubAssertion = function(newAssertion) {
  var oldAssertion = _assertion;
  _assertion = newAssertion;
  return oldAssertion;
};


export default {
  assertion,
  assertIsNumber,
  stubAssertion,
};