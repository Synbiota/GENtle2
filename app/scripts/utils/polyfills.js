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


  // Polyfills mutate the global state so we export nothing
  return;
})