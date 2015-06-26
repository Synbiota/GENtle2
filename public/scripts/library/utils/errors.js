
// Copied from https://gist.github.com/daliwali/09ca19032ab192524dc6[]

const hasCaptureStackTrace = 'captureStackTrace' in Error;
 
// Internal function to set up an error.
function setup (message) {
  const { constructor, constructor: { name } } = this;

  if (hasCaptureStackTrace) {
    Error.captureStackTrace(this, constructor);
  } else {
    Object.defineProperty(this, 'stack', {
      value: Error().stack
    });
  }
 
  Object.defineProperties(this, {
    name: { value: name },
    message: { value: message }
  });
}


class BaseError extends Error {
  constructor({message, data = {}}) {
    super();
    setup.apply(this, [message]);
    this.data = data;
  }
}


var errors = {
  BaseError
};

export default errors;
