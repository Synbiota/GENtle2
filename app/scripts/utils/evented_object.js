/**
Simple class with event pub/sub capabilities
@class EventedObject
@constructor
**/
define(['underscore', 'utils/functional'], function(_, fun) {
  /**
  EventedObject class constructor
  @method EventedObject
  @protected
  **/
  function EventedObject() {
    this.listeners = {};
    this.triggeredOnce = {};
    return this;
  }

  /**
  Register listeners for single events
  @method onSingle
  @private
  @param {String} event
  @param {Function} [callback]
  **/
  EventedObject.prototype.onSingle = function(event, callback) {
    var this_ = this;
    if(event in this.triggeredOnce) {
      if(callback === undefined && this.listeners[event] !== undefined) 
        _.each(this.listeners[event], function(callback_) { callback_(this_.triggeredOnce[event]); });
      else 
        callback(this.triggeredOnce[event]);
    } else {
      if(this.listeners[event] === undefined) {
        this.listeners[event] = [callback];
      } else if(!~this.listeners[event].indexOf(callback)){
        this.listeners[event].push(callback);
      }
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

  /**
  Triggers single event on object and keep it as a state.
  @method triggerOnceSingle
  @private
  @param {String} event Event
  @param {*} [data] Callback argument
  **/
  EventedObject.prototype.triggerOnceSingle = function(event, data) {
    if(this.triggeredOnce[event] === undefined) {
      this.triggeredOnce[event] = data;
      this.onSingle(event)
    }
  };

  /**
  Triggers events on object and keeps them in the object's memory as a states. Supports space-separated list of events.

  Any event registered after the event has been triggered using `triggerOnce` will be called back 
  instantly.
  @method triggerOnce
  @param {String} events An event, or events separated by a space
  @param {*} [data] Callback argument
  @returns {EventedObject} Current instance of `EventedObject`
  **/
  EventedObject.prototype.triggerOnce = function(events, data) {
    var this_ = this;
    _.each(events.split(' '), function(event) { this_.triggerOnceSingle(event , data); });
    return this;
  };

  /**
  Creates new class extending this class
  @method extend
  @param {function} newConstructor
  **/
  EventedObject.extend = function(newConstructor) {
    return fun.extend(this, newConstructor || function(){});
  }


  return EventedObject;
});
