/**
Simple class with event pub/sub capabilities
@class EventedObject
@constructor
**/
define(['underscore', 'utils/class'], function(_, Class) {
  /**
  EventedObject class constructor
  @method EventedObject
  @protected
  **/
  EventedObject = Class.extend();

  EventedObject.prototype.listeners = {};

  /**
  Register listeners for single events
  @method onSingle
  @private
  @param {String} event
  @param {Function} [callback]
  **/
  EventedObject.prototype.onSingle = function(event, callback) {
    var this_ = this;
    
    if(this.listeners[event] === undefined) {
      this.listeners[event] = [callback];
    } else if(!~this.listeners[event].indexOf(callback)){
      this.listeners[event].push(callback);
    }
  }

  /**
  Register listeners for events. Supports space-separated list of events.
  @method on
  @param {String} events An event, or list of events separated by a space
  @param {Function} [callback]
  @returns EventedObject instance
  **/
  EventedObject.prototype.on = function(events, callback) {
    var this_ = this;
    _.each(events.split(' '), function(event) { this_.onSingle(event, callback); });
    return this;
  };

  /**
  Unsubscribe listeners. Does not support space-separated list of events yt.
  @method off
  @param {String} event
  @param {Function} [callback] Callback Function
  @returns Current instance of `EventedObject`
  **/
  EventedObject.prototype.off = function(event, callback) {
    if(callback === undefined && this.listeners[event] !== undefined) {
      delete this.listeners[event];
    } else if (callback !== undefined && this.listeners[event] !== undefined) {
      this.listeners[event] = _.without(this.listeners[event], callback);
    }
    return this;
  }

  /**
  Triggers single event on object
  @method triggerSingle
  @private
  @param {String} event Event
  @param {*} [data] Callback argument
  **/
  EventedObject.prototype.triggerSingle = function(event, data) {
    if(this.listeners[event] !== undefined) {
      _.each(this.listeners[event], function(e) { e(data); });
    }
  }

  /**
  Triggers events on object. Supports space-separated list of events.
  @method trigger
  @param {String} An event, or list of events separated by a space
  @param {*} [data] Callback argument
  @returns Current instance of `EventedObject`
  **/
  EventedObject.prototype.trigger = function(events, data) {
    var this_ = this;
    _.each(events.split(' '), function(event) { this_.triggerSingle(event , data); });
    return this;
  }

  return EventedObject;
});
