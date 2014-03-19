define(function() {

  // Object.create polyfill (ES5)
  // from MDN
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
  
  if (!Object.create) {
    Object.create = (function(){
      function F(){}
      
      return function(o){
        if (arguments.length != 1) {
            throw new Error('Object.create implementation only accepts one parameter.');
        }
        F.prototype = o
          return new F()
      }
    })()
  }

  // window.requestAnimationFrame
  // from Paul Irish
  // http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
  
  (function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }());


  // Polyfills mutate the global state so we export nothing
  return;
})