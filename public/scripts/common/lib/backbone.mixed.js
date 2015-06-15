var _ = require('underscore');
var $ = require('jquery');

var Backbone = window.Backbone = require('backbone');
Backbone.$ = $;

require('backbone-deep-model');
require('backbone.layoutmanager/backbone.layoutmanager');
Backbone.LocalStorage = require('backbone.localstorage');

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

var f = Backbone.Layout.prototype.remove;
Backbone.Layout.prototype.remove = function() {
  console.log('LAPIN')
  f.apply(this, arguments);
}

module.exports = Backbone;