/**
Main gentle model

@class Gentle
@extends EventEmitter
**/
define(['eventEmitter'], function(EventEmitter) {
  
  var Gentle = function() {
    opts = arguments[0] || {};
    this.layout = opts.layout;
    this.registeredModules = [];
    this.isLoaded = false;
  };
  Gentle.extend(EventEmitter);

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

  /**
  @method ready
  @return {Promise} a Promise that fulfills when the app is fully loaded
  **/
  Gentle.prototype.ready = function() {
    var this_ = this;
    this.readyPromise = this.readyPromise || new Promise(function(resolve, reject){
      if(this_.isLoaded) resolve();
      else this_.on('ready', resolve);
    });
    return this.readyPromise;
  };

  /**
  Used to notify that the app is fully loaded
  @method triggerReady
  @return {Gentle} current Gentle object
  **/
  Gentle.prototype.triggerReady = function() {
    this.isLoaded = true;
    return this.trigger('ready');
  };

  return Gentle;
});