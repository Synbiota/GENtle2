import Q from 'q';


function RateLimit(fn, msDelay, context) {
  var queue = [];
  var timer = null;
  if(!_.isNumber(msDelay) || _.isNaN(msDelay)) {
    throw "RateLimit requires a numeric millisecond delay value";
  }
  function processQueue() {
    var item = queue.shift();
    if (item) {
      var response = fn.apply(item.context, item.arguments);
      // Will handle sync and failed/succeeded async promises.
      item.deferred.resolve(response);
    }
    if (queue.length === 0) {
      clearInterval(timer);
      timer = null;
    }
  }

  return function limited(...args) {
    var deferred = Q.defer();

    queue.push({
      context: context || this,
      arguments: args,
      deferred: deferred,
    });
    if (!timer) {
      setTimeout(processQueue, 0);  // start immediately on the first invocation
      timer = setInterval(processQueue, msDelay);
    }
    return deferred.promise;
  };

}

export default RateLimit;
