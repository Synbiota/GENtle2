/**
Extends the Object type with a basic prototypal
inheritance method 
@class Object
**/
define(function() {
    /**
    Basic prototypal inheritance method used to import the prototype of a parent class
    and give access to it through `__proto__` and the `_proto` function. Mutates the Object 
    type.
    
    Example: 
    ```javascript
    var Animal = function(options) {
      options = options || {};
      this.name = options.name || 'animal';
      return this;
    };

    Animal.prototype.talk = function() { console.log(this.name); };

    var Cat = function(options) {
      options = options || {};
      this.name = options.name || 'chat';
    };
    Cat.extend(Animal); // Animal's prototype is imported into Cat's
    (new Cat()).talk() // Logs 'chat'
    ```    

    @method extend
    @param Parent {Object} Class from which we include the prototype
    **/
    Object.prototype.extend = function(Parent) { 
      var _proto = this.prototype,
          _super = Parent.prototype;

      for(var key in _super) {
        if(_super.hasOwnProperty(key) && !_proto.hasOwnProperty(key))
          _proto[key] = _super[key];
      }

      /**
      Prototype of the Parent class.

      @property __super__
      @type Object 
      **/
      _proto.__super__ = _super;

      /**
      Returns the method in the Parent prototype

      @method _super
      @param func {String} Name of the function to be called
      in the Parent prototype
      **/
      _proto._super = function(func) { 
        var that = this;
        if(_super.hasOwnProperty(func))
          return function() { _super[func].call(that, arguments); }
      };
      return this;
    };

    return;
});