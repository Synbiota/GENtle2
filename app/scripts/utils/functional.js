/**
Functional methods toolkit (not formally a class)

Methods are shown as protected not to pollute documentation of classes which use this class.

@class functional
@static
**/
define(['underscore'], function(_) {
  return {
    /**
    @method extend
    @protected
    **/
    extend: function() {
      var classes = _.toArray(arguments);

      function NewClass() {
        var this_ = this,
            arguments_ = arguments;
        _.each(classes, function(class_) { class_.apply(this_, arguments_); });
        return this;
      };
      NewClass.prototype = {};

      _.each(classes, function(class_) {
        _.extend(NewClass.prototype, class_.prototype);
      });

      return NewClass;
    }
  }
});