/**
Layout/DOM manager

Views modules are registered using {{#crossLink "Layout/registerModule:method"}}{{/crossLink}} when initiating the {{#crossLink "App"}}{{/crossLink}}.

`Layout` notifies modules when they become visible or hidden by triggering `visible` and `hidden` events directly on them

@class Layout
@extends BaseClass
@constructor
**/
define(['jquery', 'underscore', 'utils/base_class'], function($, _, BaseClass) {
  var Layout = function() {
    this.registeredModules = [];
  };
  Layout.extend(BaseClass);

  /**
  Registers a module in the layout.

  Executed if/when the `ready` event is triggered on `gentle` instance.

  @method registerModule
  @param module 
    Instance of a module class. Has to have to the `$element` property returning `$`-wrapped instance of DOM element.
  @param {String} displayType
  **/
  Layout.prototype.registerModule = function(module, displayType) {
    this.registeredModules.push(module);

    gentle.ready().then(function() {
      switch(displayType) {
        case 'displayMode':
          $('#mainDisplay').html(module.$element);
          module.trigger('visible');
          break;
      }
    });
  };

  Layout.prototype.unregisterModule = function(module) {
    this.registeredModules = _.without(this.registeredModules, module);
  };

  return Layout;
});