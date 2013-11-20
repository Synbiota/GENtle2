/**
Main gentle model

@class Gentle
@extends EventedObject
**/
define(['utils/evented_object'], function(EventedObject) {
  
  var Gentle = EventedObject.extend(function() {
    opts = arguments[0] || {};
    this.layout = opts.layout;
    this.registeredModules = []
  });

  /**
  @method registerModuleInLayout
  @param {Class} moduleClass
  @param {Object} options
  **/
  Gentle.prototype.registerModuleInLayout = function(moduleClass, options) {
    if(this.layout === undefined) return;
    var module = new moduleClass();
    this.registeredModules.push(module);
    this.layout.registerModule(module, options.type);
  };

  return Gentle;
});