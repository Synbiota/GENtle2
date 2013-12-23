/**
Base extensible class

@class Class
@static
**/
define(function() {

    var fnTest    = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/,
        BaseClass = function(){};

    /**
    Inspired by John Resig's Simple Javascript Inheritance (http://ejohn.org/blog/simple-javascript-inheritance/), as discussed: http://stackoverflow.com/questions/15050816/is-john-resigs-javascript-inheritance-snippet-deprecated

    @method extend
    @param properties {Object} prototype of the new class. `init` is the constructor
    **/
    BaseClass.extend = function(props) {
      if(typeof props === 'function') 
        props = {init: props};

      var _super  = this.prototype,
          proto = Object.create(_super),
          NewClass;

      for(var name in props) 
        proto[name] = typeof props[name] === "function" && typeof _super[name] == "function" && fnTest.test(props[name]) ?
          (function(name, fn){
            return function() {
              var tmp = this._super;
              this._super = _super[name];
              var ret = fn.apply(this, arguments);        
              this._super = tmp;
              return ret;
            };
          })(name, props[name]) :
          props[name];


      NewClass = typeof proto.init === "function" ? proto.init : function(){};
      NewClass.prototype = proto;
      proto.constructor = NewClass; 
      NewClass.extend = BaseClass.extend;
      return NewClass;
    }

    return BaseClass;
});