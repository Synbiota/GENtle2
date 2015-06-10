
// Allows us to stub out in tests
var _assertion = function(test, message, value=undefined) {
  if(!test && arguments.length === 3) message += (' ' + JSON.stringify(value, null, 2));
  console.assert(test, message);
  if(window.TESTS_RUNNING && !test) throw new Error(message);
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
  _assertion(_.isNumber(value) && !_.isNaN(value), `\`${fieldName}\` should be a number`);
};


var assertIsBoolean = function(value, fieldName) {
  _assertion(_.isBoolean(value), `\`${fieldName}\` should be a Boolean`);
};


var assertIsInstance = function(value, klass, fieldName) {
  _assertion(value instanceof klass, `\`${fieldName}\` should be a instance of ${klass} but is: `, value);
};


export default {
  stubAssertion,
  assertion,
  assertIsNumber,
  assertIsBoolean,
  assertIsInstance,
};