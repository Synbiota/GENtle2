define(function(require) {
  var Backbone  = require('backbone'),
      DeepModel = require('deepmodel'),
      LayoutMgr = require('layoutmanager');

  Backbone.View.prototype.parentView = function(depth) {
    var parent;
    depth = depth || 1;

    if(this.__manager__ && this.__manager__.parent) {
      parent = this.__manager__.parent;
    }

    if(parent && depth > 1) {
      parent = parent.parentView(depth-1);
    }

    return parent;
  };

  return Backbone;
});