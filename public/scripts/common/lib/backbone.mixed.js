var _ = require('underscore.mixed');
var $ = require('jquery.mixed');

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

module.exports = Backbone;